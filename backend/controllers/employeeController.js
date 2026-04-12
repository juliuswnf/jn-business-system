import logger from '../utils/logger.js';
import crypto from 'crypto';
import User from '../models/User.js';
import Booking from '../models/Booking.js';

// ==================== INVITE EMPLOYEE ====================

export const inviteEmployee = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name ist erforderlich' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Gültige E-Mail erforderlich' });
    }

    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ success: false, message: 'Kein Salon verknüpft' });
    }

    // Check for existing user with this email
    const existing = await User.findOne({ email: String(email).toLowerCase() }).maxTimeMS(5000);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Diese E-Mail-Adresse ist bereits vergeben' });
    }

    // Generate secure one-time invite token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Create employee account in pending state
    const employee = await User.create({
      name: name.trim(),
      email: String(email).toLowerCase(),
      phone: phone || '',
      // Random unusable password – employee sets their own via invite link
      password: crypto.randomBytes(20).toString('hex'),
      role: 'employee',
      salonId,
      isActive: false,
      inviteToken: hashedToken,
      inviteTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Send invite email
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/employee-setup?token=${rawToken}`;
    try {
      const { sendEmail } = await import('../services/emailService.js');
      await sendEmail({
        to: employee.email,
        subject: 'Einladung zu JN Business System – Konto einrichten',
        body: `Hallo ${employee.name},\n\nDu wurdest eingeladen, dem Team beizutreten.\n\nBitte richte dein Passwort über folgenden Link ein (24h gültig):\n${inviteLink}\n\nDanach kannst du dich unter /login/employee einloggen.\n\nViele Grüße,\nJN Business System`,
        html: `
<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
  <h2 style="color:#111">Willkommen im Team! 👋</h2>
  <p>Hallo <strong>${employee.name}</strong>,</p>
  <p>Du wurdest eingeladen, dem Team beizutreten. Klicke auf den Button, um dein Passwort einzurichten.</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${inviteLink}" style="background:#111;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;display:inline-block">
      Konto einrichten →
    </a>
  </div>
  <p style="color:#666;font-size:13px">Der Link ist 24 Stunden gültig. Danach muss eine neue Einladung angefordert werden.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="color:#9ca3af;font-size:12px">JN Business System</p>
</body></html>`,
        type: 'employee_invite'
      });
    } catch (emailError) {
      logger.warn('Employee invite email failed:', emailError.message);
      // Still return success – admin can resend
    }

    logger.info(`Employee invited: ${employee.email} for salon ${salonId}`);
    res.status(201).json({
      success: true,
      message: 'Einladung wurde gesendet',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        isActive: employee.isActive
      }
    });
  } catch (error) {
    logger.error('InviteEmployee Error:', error);
    res.status(500).json({ success: false, message: 'Interner Serverfehler' });
  }
};

// ==================== SETUP PASSWORD VIA INVITE TOKEN ====================

export const setupEmployeePassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token und Passwort erforderlich' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Passwort muss mindestens 8 Zeichen lang sein' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const employee = await User.findOne({
      inviteToken: hashedToken,
      inviteTokenExpiry: { $gt: new Date() }
    }).select('+inviteToken +inviteTokenExpiry +password').maxTimeMS(5000);

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiger oder abgelaufener Einladungslink. Bitte fordere eine neue Einladung an.'
      });
    }

    // Set password, activate account, consume token
    employee.password = password; // hashed by mongoose pre-save hook
    employee.isActive = true;
    employee.inviteToken = undefined;
    employee.inviteTokenExpiry = undefined;
    await employee.save();

    logger.info(`Employee account activated: ${employee.email}`);
    res.json({
      success: true,
      message: 'Passwort gesetzt. Du kannst dich jetzt einloggen.'
    });
  } catch (error) {
    logger.error('SetupEmployeePassword Error:', error);
    res.status(500).json({ success: false, message: 'Interner Serverfehler' });
  }
};

// ==================== GET ALL EMPLOYEES ====================

export const getAllEmployees = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    if (!salonId) {
      return res.status(404).json({
        success: false,
        message: 'No salon associated with this user'
      });
    }

    const employees = await User.find({
      salonId,
      role: { $in: ['employee', 'manager'] }
    }).lean().maxTimeMS(5000).select('name email phone role status createdAt');

    res.status(200).json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    logger.error('GetAllEmployees Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET EMPLOYEE BY ID ====================

export const getEmployeeById = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { employeeId } = req.params;

    const employee = await User.findOne({
      _id: employeeId,
      salonId,
      role: { $in: ['employee', 'manager'] }
    }).maxTimeMS(5000).select('name email phone role status createdAt');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    logger.error('GetEmployeeById Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== UPDATE EMPLOYEE ====================

export const updateEmployee = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { employeeId } = req.params;
    const { name, phone, role, status } = req.body;

    const employee = await User.findOneAndUpdate(
      { _id: employeeId, salonId, role: { $in: ['employee', 'manager'] } },
      { name, phone, role, status },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    logger.error('UpdateEmployee Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== DELETE EMPLOYEE ====================

export const deleteEmployee = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { employeeId } = req.params;

    const employee = await User.findOneAndDelete({
      _id: employeeId,
      salonId,
      role: { $in: ['employee', 'manager'] }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    logger.error('DeleteEmployee Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET MY STATS ====================

export const getMyStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyBookings, totalBookings] = await Promise.all([
      Booking.find({
        employeeId: userId,
        bookingDate: { $gte: startOfMonth },
        status: { $in: ['confirmed', 'completed'] }
      }).populate('serviceId', 'price').lean().maxTimeMS(5000),
      Booking.countDocuments({
        employeeId: userId,
        status: { $in: ['confirmed', 'completed'] }
      }).maxTimeMS(5000)
    ]);

    const monthlyEarnings = monthlyBookings.reduce((sum, b) => {
      const price = b.serviceId?.price || b.services?.[0]?.price || 0;
      return sum + price;
    }, 0);

    res.status(200).json({
      success: true,
      stats: {
        monthlyEarnings: Math.round(monthlyEarnings * 100) / 100,
        totalBookings
      }
    });
  } catch (error) {
    logger.error('GetMyStats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== DEFAULT EXPORT ====================

export default {
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getMyStats
};


