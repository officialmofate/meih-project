const paymentService = require('../services/paymentService');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/payments');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

exports.createPayment = async (req, res, next) => {
  try {
    const screenshotUrl = req.file ? `/uploads/payments/${req.file.filename}` : null;
    const payment = await paymentService.create(req.user.id, {
      ...req.body,
      screenshotUrl
    });
    res.status(201).json(payment);
  } catch (err) { next(err); }
};

exports.getPaymentDetails = async (req, res, next) => {
  try {
    const details = await paymentService.getPaymentDetails(req.params.bookingId);
    if (!details) return res.status(404).json({ message: 'No payment details for this booking' });
    res.json(details);
  } catch (err) { next(err); }
};

exports.listPayments = async (req, res, next) => {
  try {
    if (req.user.role === 'planner' || req.user.role === 'admin') {
      const payments = await paymentService.listForPlanner(req.user.id, req.query);
      return res.json(payments);
    }
    const payments = await paymentService.list(req.user.id, req.query);
    res.json(payments);
  } catch (err) { next(err); }
};

exports.getPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) { next(err); }
};

exports.uploadScreenshot = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Screenshot file is required' });
    const screenshotUrl = `/uploads/payments/${req.file.filename}`;
    const payment = await paymentService.updateScreenshot(req.params.id, req.user.id, screenshotUrl);
    if (!payment) return res.status(404).json({ message: 'Payment not found or unauthorized' });
    res.json(payment);
  } catch (err) { next(err); }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.confirm(req.params.id, req.user.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found or already processed' });
    res.json(payment);
  } catch (err) { next(err); }
};

exports.rejectPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.reject(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found or already processed' });
    res.json(payment);
  } catch (err) { next(err); }
};

exports.paymentCallback = async (req, res, next) => {
  try {
    const payment = await paymentService.handleCallback(req.params.id, req.body);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) { next(err); }
};

exports.listInvoices = async (req, res, next) => {
  try {
    const invoices = await paymentService.listInvoices(req.user.id);
    res.json(invoices);
  } catch (err) { next(err); }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await paymentService.getInvoice(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) { next(err); }
};
