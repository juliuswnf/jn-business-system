import logger from '../utils/logger.js';
import User from '../models/User.js';

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
    }).select('name email phone role status createdAt');

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
    }).select('name email phone role status createdAt');

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

// ==================== DEFAULT EXPORT ====================

export default {
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
