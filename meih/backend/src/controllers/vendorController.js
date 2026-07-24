const vendorService = require('../services/vendorService');

exports.listCategories = async (req, res, next) => {
  try {
    const categories = vendorService.listCategories();
    res.json(categories);
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const vendor = await vendorService.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });
    res.json(vendor);
  } catch (err) { next(err); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const vendor = await vendorService.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });
    const updated = await vendorService.updateByUserId(req.user.id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
};

exports.getMeBookings = async (req, res, next) => {
  try {
    const vendor = await vendorService.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });
    const bookings = await vendorService.getBookings(vendor.id);
    res.json(bookings);
  } catch (err) { next(err); }
};

exports.getMeReviews = async (req, res, next) => {
  try {
    const vendor = await vendorService.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });
    const reviews = await vendorService.getReviews(vendor.id);
    res.json(reviews);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const vendor = await vendorService.create(req.user.id, req.body);
    res.status(201).json(vendor);
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const vendors = await vendorService.list(req.query);
    res.json(vendors);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const vendor = await vendorService.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const vendor = await vendorService.update(req.params.id, req.user.id, req.body);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found or unauthorized' });
    res.json(vendor);
  } catch (err) { next(err); }
};

exports.getPortfolio = async (req, res, next) => {
  try {
    const portfolio = await vendorService.getPortfolio(req.params.id);
    res.json(portfolio);
  } catch (err) { next(err); }
};

exports.addPortfolioItem = async (req, res, next) => {
  try {
    const item = await vendorService.addPortfolioItem(req.params.id, req.body);
    res.status(201).json(item);
  } catch (err) { next(err); }
};

exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ message: 'No images uploaded' });
    const db = require('../config/database');
    const fs = require('fs');
    const vendor = await vendorService.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });
    const setClauses = [];
    const params = [vendor.id];
    let idx = 2;
    for (let i = 0; i < Math.min(req.files.length, 3); i++) {
      const url = '/uploads/profiles/' + req.files[i].filename;
      let b64 = null;
      try { b64 = fs.readFileSync(req.files[i].path).toString('base64'); } catch (_) {}
      setClauses.push(`image_url_${i + 1} = $${idx++}`, `image_base64_${i + 1} = $${idx++}`);
      params.push(url, b64);
    }
    if (setClauses.length) {
      await db.query(`UPDATE vendors SET ${setClauses.join(', ')}, updated_at = now() WHERE id = $1`, params);
    }
    const urls = req.files.map(f => '/uploads/profiles/' + f.filename);
    res.json({ urls, images: urls });
  } catch (err) { next(err); }
};

exports.getBookings = async (req, res, next) => {
  try {
    const bookings = await vendorService.getBookings(req.params.id);
    res.json(bookings);
  } catch (err) { next(err); }
};

exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await vendorService.getReviews(req.params.id);
    res.json(reviews);
  } catch (err) { next(err); }
};

exports.getAvailability = async (req, res, next) => {
  try {
    const availability = await vendorService.getAvailability(req.params.id);
    res.json(availability);
  } catch (err) { next(err); }
};

exports.getMatchingEvents = async (req, res, next) => {
  try {
    const events = await vendorService.getMatchingEvents(req.user.id);
    res.json(events);
  } catch (err) { next(err); }
};
