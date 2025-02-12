const Joi = require('joi');

const registrationSchema = Joi.object({
    phone_no: Joi.string().required(),
    country_code: Joi.string().required(),
    country_name: Joi.string().required(),
});

const verifySchema = Joi.object({
    otp: Joi.string().required()
})

module.exports = {
    registrationSchema, verifySchema
};
