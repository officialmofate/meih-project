const plannerService = require('../services/plannerService');

exports.getMe = async (req, res, next) => {
  try {
    const planner = await plannerService.findByUserId(req.user.id);
    if (!planner) return res.status(404).json({ message: 'Planner profile not found' });
    res.json(planner);
  } catch (err) { next(err); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const planner = await plannerService.findByUserId(req.user.id);
    if (!planner) return res.status(404).json({ message: 'Planner profile not found' });
    const updated = await plannerService.updateByUserId(req.user.id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
};

exports.updateMeAvailability = async (req, res, next) => {
  try {
    const planner = await plannerService.findByUserId(req.user.id);
    if (!planner) return res.status(404).json({ message: 'Planner profile not found' });
    const result = await plannerService.updateAvailability(planner.id, req.body);
    res.json(result);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const planner = await plannerService.create(req.user.id, req.body);
    res.status(201).json(planner);
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const planners = await plannerService.list(req.query);
    res.json(planners);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const planner = await plannerService.findById(req.params.id);
    if (!planner) return res.status(404).json({ message: 'Planner not found' });
    res.json(planner);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const planner = await plannerService.update(req.params.id, req.user.id, req.body);
    if (!planner) return res.status(404).json({ message: 'Planner not found or unauthorized' });
    res.json(planner);
  } catch (err) { next(err); }
};

exports.getPortfolio = async (req, res, next) => {
  try {
    const portfolio = await plannerService.getPortfolio(req.params.id);
    res.json(portfolio);
  } catch (err) { next(err); }
};

exports.addPortfolioItem = async (req, res, next) => {
  try {
    const item = await plannerService.addPortfolioItem(req.params.id, req.body);
    res.status(201).json(item);
  } catch (err) { next(err); }
};

exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ message: 'No images uploaded' });
    const db = require('../config/database');
    const fs = require('fs');
    const planner = await plannerService.findByUserId(req.user.id);
    if (!planner) return res.status(404).json({ message: 'Planner profile not found' });
    const setClauses = [];
    const params = [planner.id];
    let idx = 2;
    for (let i = 0; i < Math.min(req.files.length, 3); i++) {
      const url = '/uploads/profiles/' + req.files[i].filename;
      let b64 = null;
      try { b64 = fs.readFileSync(req.files[i].path).toString('base64'); } catch (_) {}
      setClauses.push(`image_url_${i + 1} = $${idx++}`, `image_base64_${i + 1} = $${idx++}`);
      params.push(url, b64);
    }
    if (setClauses.length) {
      await db.query(`UPDATE planners SET ${setClauses.join(', ')}, updated_at = now() WHERE id = $1`, params);
    }
    const urls = req.files.map(f => '/uploads/profiles/' + f.filename);
    res.json({ urls, images: urls });
  } catch (err) { next(err); }
};

exports.getEvents = async (req, res, next) => {
  try {
    const events = await plannerService.getEvents(req.params.id);
    res.json(events);
  } catch (err) { next(err); }
};

exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await plannerService.getReviews(req.params.id);
    res.json(reviews);
  } catch (err) { next(err); }
};

exports.getAvailability = async (req, res, next) => {
  try {
    const availability = await plannerService.getAvailability(req.params.id);
    res.json(availability);
  } catch (err) { next(err); }
};
