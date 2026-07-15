const notificationService = require('../services/notificationService');

exports.list = async (req, res, next) => {
  try {
    const notifications = await notificationService.list(req.user.id, req.query);
    res.json(notifications);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const notification = await notificationService.getById(req.params.id, req.user.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markRead(req.params.id, req.user.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found or already read' });
    res.json(notification);
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await notificationService.remove(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ message: 'Notification not found' });
    res.status(204).end();
  } catch (err) { next(err); }
};
