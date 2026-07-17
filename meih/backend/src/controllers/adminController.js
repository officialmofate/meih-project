const adminService = require('../services/adminService');

const VALID_ROLES = ['client', 'planner', 'vendor', 'innovator', 'innovator_manager', 'judge', 'public_voter', 'admin', 'superadmin'];
const PRIVILEGED_ROLES = ['admin', 'superadmin'];
const VALID_STATUSES = ['active', 'suspended', 'pending', 'inactive'];

function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/[<>]/g, '').trim();
}

function parsePagination(query) {
  let page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || 50;
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function auditLog(action, details, req) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'AUDIT',
    action: action,
    performedBy: req.user ? req.user.id : 'unknown',
    performedByRole: req.user ? req.user.role : 'unknown',
    targetId: details.targetId || undefined,
    oldValue: details.oldValue || undefined,
    newValue: details.newValue || undefined,
    requestId: req.id || undefined,
  }));
}

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
    const pagination = parsePagination(req.query);
    const queryWithPagination = { ...req.query, page: pagination.page, limit: pagination.limit };
    const users = await adminService.listUsers(queryWithPagination);
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

    const targetId = sanitizeString(req.params.id);

    // Get current role for audit log
    const currentUsers = await adminService.listUsers({ id: targetId });
    const currentRole = currentUsers && currentUsers.role ? currentUsers.role : 'unknown';

    auditLog('ROLE_CHANGE', {
      targetId: targetId,
      oldValue: currentRole,
      newValue: role,
    }, req);

    const user = await adminService.updateUserRole(targetId, role);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: ' + VALID_STATUSES.join(', ') });
    }

    const targetId = sanitizeString(req.params.id);

    auditLog('STATUS_CHANGE', {
      targetId: targetId,
      newValue: status,
    }, req);

    const user = await adminService.updateUserStatus(targetId, status);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.listAllEvents = async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const queryWithPagination = { ...req.query, page: pagination.page, limit: pagination.limit };
    const events = await adminService.listAllEvents(queryWithPagination);
    res.json(events);
  } catch (err) { next(err); }
};

exports.listAllPayments = async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const queryWithPagination = { ...req.query, page: pagination.page, limit: pagination.limit };
    const payments = await adminService.listAllPayments(queryWithPagination);
    res.json(payments);
  } catch (err) { next(err); }
};

exports.triggerBackup = async (req, res, next) => {
  try {
    auditLog('TRIGGER_BACKUP', {}, req);
    res.json({ message: 'Backup triggered', timestamp: new Date().toISOString() });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    auditLog('UPDATE_SETTINGS', { newValue: Object.keys(req.body) }, req);
    res.json({ message: 'Settings updated', settings: req.body });
  } catch (err) { next(err); }
};

exports.getLogs = async (req, res, next) => {
  try {
    res.json({ logs: [], message: 'Log retrieval not yet implemented' });
  } catch (err) { next(err); }
};
