const Joi = require('joi');

const planSchema = Joi.object({
    planname: Joi.string().required(),
    description: Joi.string().required(),
    plantype: Joi.array().items(Joi.object({
        country: Joi.string(),
        amount: Joi.number()
    })),

});

module.exports = planSchema;
