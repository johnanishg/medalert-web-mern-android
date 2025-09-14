import express from 'express';
import Manager from '../models/Manager.js';
import Employee from '../models/Employee.js';
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to verify admin or manager access
const verifyAdminOrManager = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'manager') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }
};

// Get all managers
router.get('/managers', verifyToken, verifyAdminOrManager, async (req, res) => {
  try {
    const managers = await Manager.find({})
      .populate('createdBy', 'name email')
      .populate('managedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Managers retrieved successfully',
      managers
    });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all employees
router.get('/employees', verifyToken, verifyAdminOrManager, async (req, res, next) => {
  try {
    let employees;
    
    if (req.user.role === 'admin') {
      // Admin can see all employees
      employees = await Employee.find({})
        .populate('createdBy', 'name email')
        .populate('managedBy', 'name email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'manager') {
      // Manager can only see employees they manage
      employees = await Employee.find({ managedBy: req.user.userId })
        .populate('createdBy', 'name email')
        .populate('managedBy', 'name email')
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      message: 'Employees retrieved successfully',
      employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create manager (admin only)
router.post('/create-manager', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create managers' });
    }

    const { name, email, password, department, level } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: 'Name, email, password, and department are required' });
    }

    // Check if manager already exists
    const existingManager = await Manager.findOne({ email });
    if (existingManager) {
      return res.status(400).json({ message: 'Manager already exists with this email' });
    }

    // Create new manager
    const manager = new Manager({
      name,
      email,
      password,
      department,
      level: level || 'junior',
      createdBy: req.user.userId,
      managedBy: req.user.userId
    });

    await manager.save();

    res.status(201).json({
      message: 'Manager created successfully',
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        userId: manager.userId,
        department: manager.department,
        level: manager.level
      }
    });

  } catch (error) {
    console.error('Create manager error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create employee (admin or manager)
router.post('/create-employee', verifyToken, verifyAdminOrManager, async (req, res) => {
  try {
    const { name, email, password, department, position, level } = req.body;

    if (!name || !email || !password || !department || !position) {
      return res.status(400).json({ message: 'Name, email, password, department, and position are required' });
    }

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee already exists with this email' });
    }

    // Determine who manages this employee
    let managedBy;
    if (req.user.role === 'admin') {
      // Admin can assign to any manager or manage directly
      managedBy = req.body.managedBy || req.user.userId;
    } else if (req.user.role === 'manager') {
      // Manager manages the employee they create
      managedBy = req.user.userId;
    }

    // Create new employee
    const employee = new Employee({
      name,
      email,
      password,
      department,
      position,
      level: level || 'junior',
      createdBy: req.user.userId,
      managedBy
    });

    await employee.save();

    res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        userId: employee.userId,
        department: employee.department,
        position: employee.position,
        level: employee.level
      }
    });

  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user
router.put('/update-user/:id', verifyToken, verifyAdminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Determine which model to use based on the user's role
    let Model;
    let user;
    
    // First, find the user to determine their role
    const managers = await Manager.find({ _id: id });
    const employees = await Employee.find({ _id: id });
    
    if (managers.length > 0) {
      Model = Manager;
      user = managers[0];
    } else if (employees.length > 0) {
      Model = Employee;
      user = employees[0];
    } else {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    if (req.user.role === 'manager' && user.managedBy?.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only update employees you manage' });
    }

    // Update user
    const updatedUser = await Model.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user
router.delete('/delete-user/:id', verifyToken, verifyAdminOrManager, async (req, res) => {
  try {
    const { id } = req.params;

    // Determine which model to use and check permissions
    const managers = await Manager.find({ _id: id });
    const employees = await Employee.find({ _id: id });
    
    let Model;
    let user;
    
    if (managers.length > 0) {
      Model = Manager;
      user = managers[0];
    } else if (employees.length > 0) {
      Model = Employee;
      user = employees[0];
    } else {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    if (req.user.role === 'manager' && user.managedBy?.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only delete employees you manage' });
    }

    // Delete user
    await Model.findByIdAndDelete(id);

    res.status(200).json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get manager/employee profile
router.get('/profile/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;
    
    let Model;
    if (role === 'manager') {
      Model = Manager;
    } else if (role === 'employee') {
      Model = Employee;
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await Model.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update manager/employee profile
router.put('/profile/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { role } = req.user;
    
    let Model;
    if (role === 'manager') {
      Model = Manager;
    } else if (role === 'employee') {
      Model = Employee;
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.userId;
    delete updateData.password;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const user = await Model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get hierarchy
router.get('/hierarchy', verifyToken, verifyAdminOrManager, async (req, res) => {
  try {
    let hierarchy;

    if (req.user.role === 'admin') {
      // Admin sees full hierarchy
      const managers = await Manager.find({})
        .populate('createdBy', 'name email')
        .populate('managedEmployees', 'name email userId');

      hierarchy = {
        admin: req.user,
        managers: managers.map(manager => ({
          ...manager.toObject(),
          employees: manager.managedEmployees
        }))
      };
    } else if (req.user.role === 'manager') {
      // Manager sees their employees
      const manager = await Manager.findOne({ _id: req.user.userId })
        .populate('managedEmployees', 'name email userId department position');

      hierarchy = {
        manager: manager,
        employees: manager?.managedEmployees || []
      };
    }

    res.status(200).json({
      message: 'Hierarchy retrieved successfully',
      hierarchy
    });

  } catch (error) {
    console.error('Get hierarchy error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;