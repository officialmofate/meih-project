const eventService = require('../services/eventService');

exports.listCategories = async (req, res, next) => {
  try {
    const categories = await eventService.listCategories();
    res.json(categories);
  } catch (err) { next(err); }
};

exports.getCategory = async (req, res, next) => {
  try {
    const category = await eventService.getCategory(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) { next(err); }
};

exports.createEvent = async (req, res, next) => {
  try {
    const event = await eventService.create(req.user.id, req.body);
    res.status(201).json(event);
  } catch (err) { next(err); }
};

exports.listEvents = async (req, res, next) => {
  try {
    const events = await eventService.list(req.query);
    res.json(events);
  } catch (err) { next(err); }
};

exports.getEvent = async (req, res, next) => {
  try {
    const event = await eventService.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) { next(err); }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.update(req.params.id, req.user.id, req.body);
    if (!event) return res.status(404).json({ message: 'Event not found or unauthorized' });
    res.json(event);
  } catch (err) { next(err); }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const deleted = await eventService.remove(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ message: 'Event not found or unauthorized' });
    res.status(204).end();
  } catch (err) { next(err); }
};

exports.publishEvent = async (req, res, next) => {
  try {
    const event = await eventService.publish(req.params.id, req.user.id);
    if (!event) return res.status(404).json({ message: 'Event not found or not in draft status' });
    res.json(event);
  } catch (err) { next(err); }
};

exports.listEventBookings = async (req, res, next) => {
  try {
    const bookings = await eventService.listEventBookings(req.params.id);
    res.json(bookings);
  } catch (err) { next(err); }
};

exports.createQuote = async (req, res, next) => {
  try {
    const quote = await eventService.createQuote(req.params.id, { ...req.body, clientId: req.user.id });
    res.status(201).json(quote);
  } catch (err) { next(err); }
};

exports.listQuotes = async (req, res, next) => {
  try {
    const quotes = await eventService.listQuotes(req.params.id);
    res.json(quotes);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const event = await eventService.updateStatus(req.params.id, req.body.status);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) { next(err); }
};
