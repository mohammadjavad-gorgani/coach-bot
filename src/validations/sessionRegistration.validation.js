const Joi = require("joi");

const sessionValidationSchema = Joi.object({
    session_name: Joi.string()
        .trim()
        .pattern(/[^\s\u200c]+/)
        .max(50)
        .required()
        .messages({
            "string.empty": "نام کلاس نباید خالی باشد.",
            "string.max": "نام کلاس شما نباید بیش از 50 حرف باشد.",
            "string.pattern.base": "نام کلاس نمی‌تواند فقط شامل فاصله یا نیم‌فاصله باشد.",
            "any.required": "وارد کردن نام کلاس اجباری است."
        }),

    session_description: Joi.string()
        .trim()
        .max(100)
        .allow(null)
        .messages({
            "string.empty": "توضیحات کلاس نباید خالی باشد.",
            "string.max": "توضیحات کلاس شما نباید بیش از 100 حرف باشد."
        }),
});

module.exports = {
    sessionValidationSchema
};