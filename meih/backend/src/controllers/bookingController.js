const bookingService = require('../services/bookingService');

exports.create = async (req, res, next) => {
  try {
    const booking = await bookingService.create(req.user.id, req.body);
    res.status(201).json(booking);
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const bookings = await bookingService.list(req.user.id, req.user.role, req.query);
    res.json(bookings);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const booking = await bookingService.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const booking = await bookingService.update(req.params.id, req.user.id, req.body);
    if (!booking) return res.status(404).json({ message: 'Booking not found or unauthorized' });
    res.json(booking);
  } catch (err) { next(err); }
};

exports.confirm = async (req, res, next) => {
  try {
    const booking = await bookingService.confirm(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found or already processed' });
    res.json(booking);
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const booking = await bookingService.cancel(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found or already processed' });
    res.json(booking);
  } catch (err) { next(err); }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await bookingService.getInvoice(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) { next(err); }
};
