const adminService = require('../services/adminService');

const VALID_ROLES = ['client', 'planner', 'vendor', 'innovator', 'innovator_manager', 'judge', 'public_voter', 'admin', 'superadmin'];
const PRIVILEGED_ROLES = ['admin', 'superadmin'];

exports.dashboard = async (req, res, next) => {
  try {
    const data = await adminService.getDashboard();
    res.json(data);
  } catch (err) { next(err); }
};

exports.analytics = async (req, res, next) => {
  try {
    const data = await adminService.getAnalytics();
    res.json(data);
  } catch (err) { next(err); }
};

exports.listUsers = async (req, res, next) => {
  try {
    const users = await adminService.listUsers(req.query);
    res.json(users);
  } catch (err) { next(err); }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be one of: ' + VALID_ROLES.join(', ') });
    }
    // Only superadmin can assign admin or superadmin roles
    if (PRIVILEGED_ROLES.includes(role) && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can assign admin or superadmin roles' });
    }
    const user = await adminService.updateUserRole(req.params.id, role);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.updateUserStatus(req.params.id, req.body.status);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.listAllEvents = async (req, res, next) => {
  try {
    const events = await adminService.listAllEvents(req.query);
    res.json(events);
  } catch (err) { next(err); }
};

exports.listAllPayments = async (req, res, next) => {
  try {
    const payments = await adminService.listAllPayments(req.query);
    res.json(payments);
  } catch (err) { next(err); }
};

exports.triggerBackup = async (req, res, next) => {
  try {
    res.json({ message: 'Backup triggered', timestamp: new Date().toISOString() });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    res.json({ message: 'Settings updated', settings: req.body });
  } catch (err) { next(err); }
};

exports.getLogs = async (req, res, next) => {
  try {
    res.json({ logs: [], message: 'Log retrieval not yet implemented' });
  } catch (err) { next(err); }
};
