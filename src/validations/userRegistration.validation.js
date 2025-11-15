const Joi = require("joi");

const nameRegex = /^[آ-یA-Za-z\s]+$/;
const iranPhoneRegex = /^09\d{9}$/;

const userValidationSchema = Joi.object({
    full_name: Joi.string()
        .trim()
        .pattern(nameRegex)
        .min(3)
        .max(50)
        .required()
        .messages({
            "string.empty": "لطفا نام کامل خود را وارد کنید.",
            "string.pattern.base": "نام فقط می تواند شامل حروف فارسی یا انگلیسی باشد.",
            "string.min": "نام کامل شما حداقل باید 3 حرف باشد.",
            "string.max": "نام کامل شما نباید بیش از 50 حرف باشد."
        }),

    phone_number: Joi.string()
        .trim()
        .pattern(iranPhoneRegex)
        .required()
        .messages({
            "string.empty": "لطفا شماره موبایل خود را وارد کنید.",
            "string.pattern.base": "شماره موبایل معتبر نیست، لطفا با 09 شروع و 11 رقم باشد."
        }),
});

module.exports = {
    userValidationSchema
};