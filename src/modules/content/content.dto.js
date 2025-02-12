const Joi = require('joi');

const contentValidationSchema = Joi.object({
    title: Joi.string().required(),

    description: Joi.string().required()
});

module.exports = contentValidationSchema;
