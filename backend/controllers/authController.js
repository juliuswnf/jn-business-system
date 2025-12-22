import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import LifecycleEmail from '../models/LifecycleEmail.js';
import { isValidEmail, validatePassword, sanitizeErrorMessage } from '../utils/validation.js';

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
    const {
      email, password, firstName, lastName, name, role, phone,
      companyName, companyAddress, companyCity, companyZip, plan, businessType
    } = req.body;

    // Combine firstName + lastName OR use name
    const fullName = name || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName);

    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password and name'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Validate role (only allow specific roles)
    const allowedRoles = ['customer', 'admin', 'employee', 'salon_owner', 'ceo'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';

    // Check if user exists - ensure email is string to prevent NoSQL injection
    const existingUser = await User.findOne({ email: String(email).toLowerCase() }).maxTimeMS(5000);
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
    if (phone) {
      userData.phone = phone;
    }
    if (companyName) {
      userData.companyName = companyName;
    }

    // Create user (password auto-hashed by mongoose pre-hook)
    const user = await User.create(userData);

    // If salon_owner, automatically create a Salon with 30-day trial
    let salon = null;
    if (userRole === 'salon_owner' && companyName) {
      const Salon = (await import('../models/Salon.js')).default;

      // Generate unique slug
      let slug = companyName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Check for existing slug and add number if needed
      const existingSlug = await Salon.findOne({ slug }).maxTimeMS(5000);
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      // Validate businessType
      const validBusinessTypes = [
        'hair-salon', 'beauty-salon', 'spa-wellness', 'tattoo-piercing',
        'medical-aesthetics', 'personal-training', 'physiotherapy',
        'barbershop', 'nail-salon', 'massage-therapy', 'yoga-studio',
        'pilates-studio', 'other'
      ];
      const selectedBusinessType = businessType && validBusinessTypes.includes(businessType) 
        ? businessType 
        : 'hair-salon'; // Default fallback

      salon = await Salon.create({
        name: companyName,
        slug,
        owner: user._id,
        email: email,
        phone: phone || '',
        businessType: selectedBusinessType,
        address: {
          street: companyAddress || '',
          city: companyCity || '',
          postalCode: companyZip || '',
          country: 'Deutschland'
        },
        isActive: true,
        subscription: {
          status: 'trial',
          tier: plan || 'starter',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
        }
      });

      // Link salon to user
      user.salonId = salon._id;
      await user.save();

      logger.info(`Salon created for new owner: ${salon.name} (${salon.slug})`);

      // Queue welcome email
      try {
        const emailService = (await import('../services/emailService.js')).default;
        await emailService.sendWelcomeEmail(user, salon);
      } catch (emailError) {
        logger.warn('Welcome email failed:', emailError.message);
      }

      // Schedule lifecycle emails for trial nurturing
      try {
        await LifecycleEmail.scheduleForNewSalon(salon, user);
        logger.info(`Lifecycle emails scheduled for: ${salon.name}`);
      } catch (lifecycleError) {
        logger.warn('Lifecycle email scheduling failed:', lifecycleError.message);
      }
    }

    // Generate token
    const token = generateToken(user._id);

    logger.info(`User registered: ${user.email} (${user.role})`);

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON(),
      salon: salon ? {
        id: salon._id,
        name: salon.name,
        slug: salon.slug,
        trialEndsAt: salon.subscription?.trialEndsAt
      } : null
    });
  } catch (error) {
    logger.error('Register Error:', error);
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

    // Find user with password field - ensure email is string to prevent NoSQL injection
    const user = await User.findOne({ email: String(email).toLowerCase() }).maxTimeMS(5000).select('+password');

    if (!user) {
      logger.warn(`🚨 Login attempt with non-existent email: ${email}`);
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
      logger.warn(`?? Invalid password for: ${email}`);
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

    logger.info(`? User logged in: ${user.email} (${user.role})`);

    res.status(200).json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('? Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// ==================== CEO LOGIN ====================
// SECURITY: This endpoint is heavily protected
// - IP Whitelist (only allowed IPs can access)
// - 2FA mandatory for CEO access
// - Only allows users with role 'ceo'
// - Logs all access attempts with IP
// - Implements progressive delay on failed attempts
// - Account lockout after multiple failures

// Track failed CEO login attempts by IP
const ceoLoginAttempts = new Map();

// CEO IP Whitelist - Add allowed IPs here
// Set to empty array [] to disable whitelist (allow all IPs)
// In production, add specific IPs like: ['123.45.67.89', '98.76.54.32']
const CEO_IP_WHITELIST = process.env.CEO_IP_WHITELIST
  ? process.env.CEO_IP_WHITELIST.split(',').map(ip => ip.trim())
  : []; // Empty = disabled, add IPs to enable

// Helper to check if IP is whitelisted
const isIPWhitelisted = (clientIP) => {
  // If whitelist is empty, allow all (disabled)
  if (CEO_IP_WHITELIST.length === 0) return true;

  // Normalize IP for comparison
  const normalizedIP = clientIP.replace('::ffff:', '');

  // Check exact match or localhost variations
  return CEO_IP_WHITELIST.some(allowedIP => {
    const normalizedAllowed = allowedIP.replace('::ffff:', '');
    return normalizedIP === normalizedAllowed ||
           normalizedIP === '127.0.0.1' ||
           normalizedIP === '::1' ||
           normalizedIP === 'localhost';
  });
};

export const ceoLogin = async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const { email, password, twoFactorCode } = req.body;

    // SECURITY: Log all CEO login attempts with full details
    logger.warn(`[CEO-SECURITY] Login attempt - IP: ${clientIP}, Email: ${email || 'not provided'}, UA: ${userAgent.substring(0, 50)}`);

    // SECURITY: Check IP Whitelist FIRST
    if (!isIPWhitelisted(clientIP)) {
      logger.error(`[CEO-SECURITY] ? BLOCKED - IP not whitelisted: ${clientIP}`);
      // Don't reveal that it's an IP block - generic message
      return res.status(403).json({
        success: false,
        message: 'Zugriff verweigert'
      });
    }

    // Check for brute force from this IP
    const ipAttempts = ceoLoginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
    const now = Date.now();

    // Reset counter after 30 minutes
    if (now - ipAttempts.lastAttempt > 30 * 60 * 1000) {
      ipAttempts.count = 0;
    }

    // Block if too many attempts (more than 5 in 30 min)
    if (ipAttempts.count >= 5) {
      const waitTime = Math.min(ipAttempts.count * 60, 300); // Max 5 min wait
      logger.error(`[CEO-SECURITY] BLOCKED - Too many attempts from IP: ${clientIP}`);
      return res.status(429).json({
        success: false,
        message: `Zu viele Versuche. Bitte warten Sie ${waitTime} Sekunden.`
      });
    }

    // Validate input
    if (!email || !password) {
      ipAttempts.count++;
      ipAttempts.lastAttempt = now;
      ceoLoginAttempts.set(clientIP, ipAttempts);
      return res.status(400).json({
        success: false,
        message: 'Bitte E-Mail und Passwort angeben'
      });
    }

    // Find user with password field AND 2FA fields (twoFactorSecret has select: false) - ensure email is string
    const user = await User.findOne({ email: String(email).toLowerCase() }).maxTimeMS(5000).select('+password +twoFactorSecret');

    if (!user) {
      ipAttempts.count++;
      ipAttempts.lastAttempt = now;
      ceoLoginAttempts.set(clientIP, ipAttempts);
      logger.warn(`[CEO-SECURITY] Failed - Email not found: ${email}, IP: ${clientIP}`);

      // Add delay to slow down brute force
      await new Promise(resolve => setTimeout(resolve, 1000 * ipAttempts.count));

      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    // SECURITY: Verify user is CEO - no other role allowed
    if (user.role !== 'ceo') {
      ipAttempts.count += 2; // Double penalty for wrong role attempt
      ipAttempts.lastAttempt = now;
      ceoLoginAttempts.set(clientIP, ipAttempts);
      logger.error(`[CEO-SECURITY] ALERT - Non-CEO attempted access: ${email} (role: ${user.role}), IP: ${clientIP}`);

      // Add significant delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      return res.status(403).json({
        success: false,
        message: 'Zugriff verweigert'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      logger.warn(`[CEO-SECURITY] Locked account attempt: ${email}, IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: 'Konto gesperrt. Zu viele Fehlversuche.'
      });
    }

    // Compare password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      ipAttempts.count++;
      ipAttempts.lastAttempt = now;
      ceoLoginAttempts.set(clientIP, ipAttempts);
      logger.warn(`[CEO-SECURITY] Failed - Wrong password: ${email}, IP: ${clientIP}`);
      await user.incLoginAttempts();

      // Add delay
      await new Promise(resolve => setTimeout(resolve, 1000 * ipAttempts.count));

      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    // ==================== 2FA MANDATORY FOR CEO ====================
    // CEO MUST have 2FA enabled - no exceptions

    logger.info(`[CEO-SECURITY] 2FA Check - twoFactorEnabled: ${user.twoFactorEnabled}, twoFactorSecret: ${user.twoFactorSecret ? 'exists' : 'null'}, twoFactorCode provided: ${twoFactorCode ? 'yes' : 'no'}`);

    // If 2FA is not enabled yet
    if (!user.twoFactorEnabled) {
      // Check if user is trying to verify a setup code
      if (twoFactorCode && user.twoFactorSecret) {
        logger.info(`[CEO-SECURITY] Attempting 2FA setup verification with code: ${twoFactorCode}`);
        // User has a secret and is sending a code - verify it to complete setup
        const isValidToken = authenticator.verify({
          token: twoFactorCode.toString().replace(/\s/g, ''),
          secret: user.twoFactorSecret
        });

        if (isValidToken) {
          // Code is valid - enable 2FA and complete login
          user.twoFactorEnabled = true;
          await user.save();

          // Reset counters and generate token
          ceoLoginAttempts.delete(clientIP);
          await user.resetLoginAttempts();
          const token = generateToken(user._id, '30d');

          logger.info(`[CEO-SECURITY] ? 2FA setup completed and CEO logged in: ${user.email}, IP: ${clientIP}`);

          return res.status(200).json({
            success: true,
            token,
            user: user.toJSON(),
            message: '2FA erfolgreich eingerichtet. Willkommen im CEO Bereich!'
          });
        } else {
          // Invalid code during setup
          logger.warn(`[CEO-SECURITY] Invalid 2FA code during setup: ${email}, IP: ${clientIP}`);
          return res.status(401).json({
            success: false,
            message: 'Ungültiger 2FA-Code. Bitte versuchen Sie es erneut.'
          });
        }
      }

      // No code provided or no secret yet - generate/show setup
      logger.warn(`[CEO-SECURITY] 2FA not enabled for CEO: ${email}, IP: ${clientIP}`);

      // Only generate new secret if none exists
      let secret = user.twoFactorSecret;
      if (!secret) {
        secret = authenticator.generateSecret();
        user.twoFactorSecret = secret;
        await user.save();
      }

      const otpauth = authenticator.keyuri(user.email, 'JN-Business-System-CEO', secret);
      const qrCode = await QRCode.toDataURL(otpauth);

      return res.status(200).json({
        success: false,
        requiresTwoFactorSetup: true,
        message: '2FA ist für CEO-Zugang Pflicht. Bitte richten Sie die Zwei-Faktor-Authentifizierung ein.',
        qrCode,
        secret, // Allow manual entry
        setupInstructions: 'Scannen Sie den QR-Code mit einer Authenticator-App (Google Authenticator, Authy, etc.)'
      });
    }

    // 2FA is enabled - verify code
    if (!twoFactorCode) {
      logger.info(`[CEO-SECURITY] 2FA code required for: ${email}, IP: ${clientIP}`);
      return res.status(200).json({
        success: false,
        requiresTwoFactor: true,
        message: 'Bitte geben Sie Ihren 2FA-Code ein'
      });
    }

    // Verify 2FA code - clean up the code first (remove spaces, ensure string)
    const cleanCode = twoFactorCode.toString().replace(/\s/g, '');
    const isValidToken = authenticator.verify({
      token: cleanCode,
      secret: user.twoFactorSecret
    });

    if (!isValidToken) {
      ipAttempts.count++;
      ipAttempts.lastAttempt = now;
      ceoLoginAttempts.set(clientIP, ipAttempts);
      logger.warn(`[CEO-SECURITY] Failed - Invalid 2FA code: ${email}, Code: ${cleanCode}, IP: ${clientIP}`);

      await new Promise(resolve => setTimeout(resolve, 2000));

      return res.status(401).json({
        success: false,
        message: 'Ungültiger 2FA-Code'
      });
    }

    // ==================== FULL SUCCESS ====================
    // Password correct + 2FA verified

    // If 2FA was just set up (twoFactorEnabled was false), enable it now
    if (!user.twoFactorEnabled) {
      user.twoFactorEnabled = true;
      await user.save();
      logger.info(`[CEO-SECURITY] 2FA activated for CEO: ${user.email}`);
    }

    // Reset all counters
    ceoLoginAttempts.delete(clientIP);
    await user.resetLoginAttempts();

    // Generate token (CEO gets longer session)
    const token = generateToken(user._id, '30d');

    logger.info(`[CEO-SECURITY] ? SUCCESS - CEO logged in with 2FA: ${user.email}, IP: ${clientIP}`);

    res.status(200).json({
      success: true,
      token,
      user: user.toJSON(),
      message: 'Willkommen im CEO Bereich'
    });
  } catch (error) {
    logger.error(`[CEO-SECURITY] ERROR: ${error.message}, IP: ${clientIP}`);
    res.status(500).json({
      success: false,
      message: 'Login fehlgeschlagen'
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
    const user = await User.findOne({ email }).maxTimeMS(5000).select('+password');

    if (!user) {
      logger.warn(`?? Employee login attempt with non-existent email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify user is employee or admin
    if (!['employee', 'admin'].includes(user.role)) {
      logger.warn(`?? Non-employee user attempted employee login: ${email} (role: ${user.role})`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Employee credentials required.'
      });
    }

    // Check company association if companyId provided
    if (companyId && user.companyId && user.companyId.toString() !== companyId) {
      logger.warn(`?? Employee ${email} attempted login to wrong company`);
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
      logger.warn(`?? Invalid password for employee: ${email}`);
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

    logger.info(`? Employee logged in: ${user.email} (${user.role})`);

    res.status(200).json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('? Employee Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// ==================== GET PROFILE ====================

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).maxTimeMS(5000);

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
    logger.error('? GetProfile Error:', error);
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
    if (name) {
      updateData.name = name;
    }
    if (phone) {
      updateData.phone = phone;
    }
    if (avatar) {
      updateData.avatar = avatar;
    }
    if (language) {
      updateData.language = language;
    }
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

    logger.info(`? Profile updated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('? UpdateProfile Error:', error);
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
    const user = await User.findById(req.user.id).maxTimeMS(5000).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify old password
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
      logger.warn(`?? Invalid old password for: ${user.email}`);
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`? Password changed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password successfully changed'
    });
  } catch (error) {
    logger.error('? ChangePassword Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
};

// ==================== LOGOUT ====================

export const logout = async (req, res) => {
  try {
    logger.info(`? User logged out: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    logger.error('? Logout Error:', error);
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
    const user = await User.findOne({ email }).maxTimeMS(5000);
    if (!user) {
      // Don't reveal if email exists (security best practice)
      logger.warn(`?? Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({
        success: true,
        message: 'If this email is registered, a reset link will be sent'
      });
    }

    // Generate reset token
    const resetToken = user.getPasswordResetToken();
    await user.save();

    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const firstName = user.name?.split(' ')[0] || user.name || 'dort';
    
    try {
      const { sendEmail } = await import('../services/emailService.js');
      await sendEmail({
        to: user.email,
        subject: '🔒 Passwort zurücksetzen - JN Business System',
        body: `Hallo ${firstName},\n\nSie haben eine Passwort-Zurücksetzung angefordert.\n\nKlicken Sie auf den folgenden Link:\n${resetUrl}\n\nDer Link ist 10 Minuten gültig.\n\nBei Fragen: support@jn-business-system.de`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8fafc;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 30px; text-align: center;">
    <div style="font-size: 48px; margin-bottom: 10px;">🔒</div>
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Passwort zurücksetzen</h1>
  </div>

  <!-- Content -->
  <div style="background: white; padding: 40px 30px;">

    <p style="font-size: 16px; color: #1f2937; margin: 0 0 20px 0;">
      Hallo ${firstName},
    </p>

    <p style="color: #4b5563; margin: 0 0 30px 0;">
      Sie haben eine Passwort-Zurücksetzung für Ihr JN Business System Konto angefordert.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Passwort jetzt zurücksetzen
      </a>
    </div>

    <!-- Alternative Link -->
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 30px;">
      <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 13px;">
        Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:
      </p>
      <p style="color: #3b82f6; margin: 0; font-size: 12px; word-break: break-all;">
        ${resetUrl}
      </p>
    </div>

    <!-- Warning Box -->
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 30px; border-radius: 4px;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>⏱ Wichtig:</strong> Dieser Link ist nur 10 Minuten gültig.
      </p>
    </div>

    <!-- Security Notice -->
    <div style="border: 2px dashed #e5e7eb; border-radius: 8px; padding: 20px; text-align: center;">
      <p style="color: #6b7280; margin: 0; font-size: 13px;">
        Sie haben diese Anfrage nicht gestellt?<br>
        Dann können Sie diese E-Mail ignorieren — Ihr Passwort bleibt unverändert.
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="background: #1f2937; padding: 30px; text-align: center;">
    <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
      Bei Fragen: <a href="mailto:support@jn-business-system.de" style="color: #60a5fa; text-decoration: none;">support@jn-business-system.de</a>
    </p>
    <p style="color: #6b7280; margin: 0; font-size: 12px;">
      JN Business System • Das Buchungssystem für Salons & Studios
    </p>
  </div>

</body>
</html>
        `,
        type: 'password_reset'
      });
      logger.info(`✅ Password reset email sent to: ${user.email}`);
    } catch (emailError) {
      logger.error('❌ Failed to send password reset email:', emailError.message);
      // Don't fail the request if email fails in development
      if (process.env.NODE_ENV === 'production') {
        throw emailError;
      }
    }

    res.status(200).json({
      success: true,
      message: 'If this email is registered, a reset link will be sent',
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error) {
    logger.error('? ForgotPassword Error:', error);
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
      passwordResetExpire: { $gt: Date.now().maxTimeMS(5000) }
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

    logger.info(`? Password reset for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password successfully reset'
    });
  } catch (error) {
    logger.error('? ResetPassword Error:', error);
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
    logger.error('? VerifyToken Error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// ==================== EMAIL VERIFICATION ====================

export const sendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).maxTimeMS(5000);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    // Generate verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    try {
      const { sendEmail } = await import('../services/emailService.js');
      await sendEmail({
        to: user.email,
        subject: 'E-Mail bestätigen - JN Business',
        body: `Hallo ${user.name},\n\nBitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Link klicken:\n${verificationUrl}\n\nDer Link ist 24 Stunden gültig.\n\nMit freundlichen Grüßen,\nIhr JN Business Team`,
        type: 'email_verification'
      });
      logger.info(`?? Verification email sent to: ${user.email}`);
    } catch (emailError) {
      logger.error('? Failed to send verification email:', emailError.message);
      if (process.env.NODE_ENV === 'production') {
        throw emailError;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent',
      ...(process.env.NODE_ENV === 'development' && { verificationToken })
    });
  } catch (error) {
    logger.error('? SendVerificationEmail Error:', error);
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
      emailVerificationExpire: { $gt: Date.now().maxTimeMS(5000) }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Verify email
    await user.verifyEmail();

    logger.info(`? Email verified for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Email successfully verified'
    });
  } catch (error) {
    logger.error('? VerifyEmail Error:', error);
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
    logger.error('? HealthCheck Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error'
    });
  }
};

// ==================== REFRESH TOKEN ====================

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    // Also accept token from Authorization header
    const headerToken = req.headers.authorization?.replace('Bearer ', '');
    const tokenToVerify = token || headerToken;

    if (!tokenToVerify) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(tokenToVerify, process.env.JWT_SECRET);
    } catch (err) {
      // If token is expired, try to decode it anyway to get user ID
      if (err.name === 'TokenExpiredError') {
        decoded = jwt.decode(tokenToVerify);
        if (!decoded || !decoded.id) {
          return res.status(401).json({
            success: false,
            message: 'Invalid token'
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    }

    // Find user
    const user = await User.findById(decoded.id).maxTimeMS(5000);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is still active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate new access token
    const newAccessToken = generateToken(user._id, '15m'); // Short-lived access token
    const newRefreshToken = generateToken(user._id, '7d'); // Longer-lived refresh token

    logger.info(`?? Token refreshed for: ${user.email}`);

    res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('? RefreshToken Error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};

// ==================== 2FA - ENABLE ====================

export const enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).maxTimeMS(5000);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled'
      });
    }

    // Generate secret
    const secret = authenticator.generateSecret();
    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    // Save secret temporarily (will be confirmed after verification)
    user.twoFactorSecret = secret;
    user.twoFactorBackupCodes = backupCodes.map(code => ({
      code: code,
      used: false
    }));
    await user.save();

    // Generate QR code
    const otpAuthUrl = authenticator.keyuri(user.email, 'JN Business', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    logger.info(`?? 2FA setup initiated for: ${user.email}`);

    res.status(200).json({
      success: true,
      qrCode: qrCodeDataUrl,
      secret: secret,
      backupCodes: backupCodes
    });
  } catch (error) {
    logger.error('? Enable2FA Error:', error);
    res.status(500).json({
      success: false,
      message: '2FA setup failed'
    });
  }
};

// ==================== 2FA - VERIFY ====================

export const verify2FA = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code required'
      });
    }

    const user = await User.findById(req.user.id).maxTimeMS(5000);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: '2FA not initialized. Please enable 2FA first.'
      });
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret
    });

    if (!isValid) {
      // Check if it's a backup code
      const backupCode = user.twoFactorBackupCodes?.find(
        bc => bc.code === code.toUpperCase() && !bc.used
      );
      if (backupCode) {
        backupCode.used = true;
        await user.save();
        logger.info(`?? Backup code used for: ${user.email}`);
        return res.status(200).json({
          success: true,
          message: '2FA verified with backup code',
          usedBackupCode: true
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // If verifying for first time, enable 2FA
    if (!user.twoFactorEnabled) {
      user.twoFactorEnabled = true;
      await user.save();
      logger.info(`?? 2FA enabled for: ${user.email}`);
    }

    res.status(200).json({
      success: true,
      message: '2FA verified successfully'
    });
  } catch (error) {
    logger.error('? Verify2FA Error:', error);
    res.status(500).json({
      success: false,
      message: '2FA verification failed'
    });
  }
};

// ==================== 2FA - DISABLE ====================

export const disable2FA = async (req, res) => {
  try {
    const { password, code } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required to disable 2FA'
      });
    }

    const user = await User.findById(req.user.id).maxTimeMS(5000).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Optionally verify 2FA code if enabled
    if (user.twoFactorEnabled && code) {
      const isValid = authenticator.verify({
        token: code,
        secret: user.twoFactorSecret
      });
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid 2FA code'
        });
      }
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save();

    logger.info(`?? 2FA disabled for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    logger.error('? Disable2FA Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA'
    });
  }
};

// ==================== 2FA - GET STATUS ====================

export const get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).maxTimeMS(5000);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const backupCodesRemaining = user.twoFactorBackupCodes?.filter(bc => !bc.used).length || 0;

    res.status(200).json({
      success: true,
      twoFactorEnabled: user.twoFactorEnabled || false,
      backupCodesRemaining: backupCodesRemaining
    });
  } catch (error) {
    logger.error('? Get2FAStatus Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status'
    });
  }
};

// ==================== 2FA - REGENERATE BACKUP CODES ====================

export const regenerateBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required'
      });
    }

    const user = await User.findById(req.user.id).maxTimeMS(5000).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled'
      });
    }

    // Generate new backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    user.twoFactorBackupCodes = backupCodes.map(code => ({
      code: code,
      used: false
    }));
    await user.save();

    logger.info(`?? Backup codes regenerated for: ${user.email}`);

    res.status(200).json({
      success: true,
      backupCodes: backupCodes
    });
  } catch (error) {
    logger.error('? RegenerateBackupCodes Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate backup codes'
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
  healthCheck,
  refreshToken,
  enable2FA,
  verify2FA,
  disable2FA,
  get2FAStatus,
  regenerateBackupCodes
};

