import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Auth Controller - MVP Version
 * Core authentication functionality + CEO/Employee specific logins
 */

// ==================== HELPERS ====================

const generateToken = (id, expiresIn = process.env.JWT_EXPIRE || '7d') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// ==================== REGISTER ====================

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, name, role, phone, companyName } = req.body;

    // Combine firstName + lastName OR use name
    const fullName = name || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName);

    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password and name'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Validate role (only allow specific roles)
    const allowedRoles = ['customer', 'admin', 'employee', 'salon_owner', 'ceo'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Build user data
    const userData = {
      email,
      password,
      name: fullName,
      role: userRole
    };

    // Add optional fields
    if (phone) userData.phone = phone;
    if (companyName) userData.companyName = companyName;

    // Create user (password auto-hashed by mongoose pre-hook)
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id);

    console.log(`✅ User registered: ${user.email} (${user.role})`);

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('❌ Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// ==================== LOGIN ====================

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.warn(`⚠️ Login attempt with non-existent email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked. Too many failed login attempts.'
      });
    }

    // Compare password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      console.warn(`⚠️ Invalid password for: ${email}`);
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts and update last login
    await user.resetLoginAttempts();

    // Generate token
    const token = generateToken(user._id);

    console.log(`✅ User logged in: ${user.email} (${user.role})`);

    res.status(200).json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// ==================== CEO LOGIN ====================

export const ceoLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.warn(`⚠️ CEO login attempt with non-existent email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify user is CEO
    if (user.role !== 'ceo') {
      console.warn(`⚠️ Non-CEO user attempted CEO login: ${email} (role: ${user.role})`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. CEO credentials required.'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked. Too many failed login attempts.'
      });
    }

    // Compare password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      console.warn(`⚠️ Invalid password for CEO: ${email}`);
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts and update last login
    await user.resetLoginAttempts();

    // Generate token (CEO gets longer session)
    const token = generateToken(user._id, '30d');

    console.log(`✅ CEO logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      token,
      user: user.toJSON(),
      message: 'Welcome, CEO!'
    });
  } catch (error) {
    console.error('❌ CEO Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// ==================== EMPLOYEE LOGIN ====================

export const employeeLogin = async (req, res) => {
  try {
    const { email, password, companyId } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.warn(`⚠️ Employee login attempt with non-existent email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify user is employee or admin
    if (!['employee', 'admin'].includes(user.role)) {
      console.warn(`⚠️ Non-employee user attempted employee login: ${email} (role: ${user.role})`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Employee credentials required.'
      });
    }

    // Check company association if companyId provided
    if (companyId && user.companyId && user.companyId.toString() !== companyId) {
      console.warn(`⚠️ Employee ${email} attempted login to wrong company`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid company.'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked. Too many failed login attempts.'
      });
    }

    // Compare password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      console.warn(`⚠️ Invalid password for employee: ${email}`);
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts and update last login
    await user.resetLoginAttempts();

    // Generate token
    const token = generateToken(user._id);

    console.log(`✅ Employee logged in: ${user.email} (${user.role})`);

    res.status(200).json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('❌ Employee Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// ==================== GET PROFILE ====================

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('❌ GetProfile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

// ==================== UPDATE PROFILE ====================

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar, language } = req.body;

    // Validate input
    if (!name && !phone && !avatar && !language) {
      return res.status(400).json({
        success: false,
        message: 'At least one field required'
      });
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;
    if (language) updateData.language = language;
    updateData.updatedAt = new Date();

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ Profile updated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('❌ UpdateProfile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// ==================== CHANGE PASSWORD ====================

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all fields'
      });
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Find user with password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify old password
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
      console.warn(`⚠️ Invalid old password for: ${user.email}`);
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log(`✅ Password changed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password successfully changed'
    });
  } catch (error) {
    console.error('❌ ChangePassword Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
};

// ==================== LOGOUT ====================

export const logout = async (req, res) => {
  try {
    console.log(`✅ User logged out: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('❌ Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
};

// ==================== FORGOT PASSWORD ====================

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email required'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists (security best practice)
      console.warn(`⚠️ Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({
        success: true,
        message: 'If this email is registered, a reset link will be sent'
      });
    }

    // Generate reset token
    const resetToken = user.getPasswordResetToken();
    await user.save();

    // TODO: Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log(`📧 Password reset link: ${resetUrl}`);

    res.status(200).json({
      success: true,
      message: 'If this email is registered, a reset link will be sent',
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error) {
    console.error('❌ ForgotPassword Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset'
    });
  }
};

// ==================== RESET PASSWORD ====================

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, password and confirmation required'
      });
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Hash token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    console.log(`✅ Password reset for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password successfully reset'
    });
  } catch (error) {
    console.error('❌ ResetPassword Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

// ==================== VERIFY TOKEN ====================

export const verifyToken = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: req.user
    });
  } catch (error) {
    console.error('❌ VerifyToken Error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// ==================== EMAIL VERIFICATION ====================

export const sendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    // Generate verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save();

    // TODO: Send email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    console.log(`📧 Verification link: ${verificationUrl}`);

    res.status(200).json({
      success: true,
      message: 'Verification email sent',
      ...(process.env.NODE_ENV === 'development' && { verificationToken })
    });
  } catch (error) {
    console.error('❌ SendVerificationEmail Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token required' });
    }

    // Hash token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Verify email
    await user.verifyEmail();

    console.log(`✅ Email verified for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Email successfully verified'
    });
  } catch (error) {
    console.error('❌ VerifyEmail Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== HEALTH CHECK ====================

export const healthCheck = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Auth API online',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('❌ HealthCheck Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error'
    });
  }
};

// ==================== DEFAULT EXPORT ====================

export default {
  register,
  login,
  ceoLogin,
  employeeLogin,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  verifyToken,
  sendVerificationEmail,
  verifyEmail,
  healthCheck
};
