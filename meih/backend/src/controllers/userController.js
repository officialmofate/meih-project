const userService = require('../services/userService');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await userService.findById(req.user.id, true);
    res.json(user);
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await userService.update(req.user.id, req.body);
    res.json(user);
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    await userService.changePassword(req.user.id, req.body);
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const users = await userService.list(req.query);
    res.json(users);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await userService.remove(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
};
