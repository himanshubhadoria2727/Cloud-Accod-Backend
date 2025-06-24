const Joi = require("joi");

exports.register = Joi.object({
  phone: Joi.string().required().min(10).max(10),
});

const userValidator = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  countryCode: Joi.string(),
});

module.exports = userValidator;
