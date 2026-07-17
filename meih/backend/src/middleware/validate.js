const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().min(8).max(128).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { name: 'password strength' }),
  fullName: Joi.string().min(1).max(200).trim().optional(),
  role: Joi.string().valid('client', 'planner', 'vendor', 'innovator', 'public_voter').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required(),
});

const eventSchema = Joi.object({
  title: Joi.string().min(1).max(300).trim().required(),
  description: Joi.string().max(5000).trim().optional().allow(''),
  date: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('date')).optional(),
  location: Joi.string().max(500).trim().optional().allow(''),
  capacity: Joi.number().integer().min(1).max(100000).optional(),
  category: Joi.string().max(100).trim().optional().allow(''),
  tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  status: Joi.string().valid('draft', 'published', 'cancelled', 'completed').optional(),
});

const innovationSchema = Joi.object({
  title: Joi.string().min(1).max(300).trim().required(),
  description: Joi.string().min(10).max(5000).trim().required(),
  category: Joi.string().max(100).trim().optional().allow(''),
  tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  status: Joi.string().valid('draft', 'submitted', 'under_review', 'approved', 'rejected').optional(),
  attachments: Joi.array().items(Joi.string().uri()).max(10).optional(),
});

function validate(schema) {
  return function (req, res, next) {
    var result = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (result.error) {
      var errors = result.error.details.map(function (d) {
        return {
          field: d.path.join('.'),
          message: d.message.replace(/"/g, ''),
          type: d.type,
        };
      });
      return res.status(422).json({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: errors,
      });
    }

    req.body = result.value;
    next();
  };
}

module.exports = validate;
module.exports.registerSchema = registerSchema;
module.exports.loginSchema = loginSchema;
module.exports.eventSchema = eventSchema;
module.exports.innovationSchema = innovationSchema;
