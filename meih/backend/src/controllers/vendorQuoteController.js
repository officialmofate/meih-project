const vendorQuoteService = require('../services/vendorQuoteService');

exports.submitQuote = async (req, res, next) => {
  try {
    const quote = await vendorQuoteService.submitQuote(req.user.id, req.params.eventId, req.body);
    if (!quote) return res.status(404).json({ message: 'Vendor profile not found' });
    res.status(201).json(quote);
  } catch (err) { next(err); }
};

exports.getMyQuotes = async (req, res, next) => {
  try {
    const quotes = await vendorQuoteService.getVendorQuotes(req.user.id);
    res.json(quotes);
  } catch (err) { next(err); }
};

exports.getEventQuotes = async (req, res, next) => {
  try {
    const quotes = await vendorQuoteService.getEventQuotes(req.params.eventId);
    res.json(quotes);
  } catch (err) { next(err); }
};

exports.updateQuoteStatus = async (req, res, next) => {
  try {
    const result = await vendorQuoteService.updateQuoteStatus(req.params.quoteId, req.body.status, req.user.id);
    if (!result) return res.status(404).json({ message: 'Quote not found' });
    if (result.unauthorized) return res.status(403).json({ message: 'Not your event' });
    res.json(result);
  } catch (err) { next(err); }
};

exports.hasQuoted = async (req, res, next) => {
  try {
    const existing = await vendorQuoteService.hasQuoted(req.user.id, req.params.eventId);
    res.json(existing || { quoted: false });
  } catch (err) { next(err); }
};
