const Joi = require("joi");

const clubNameRegex = /^[آ-یA-Za-z\s]+$/;
const clubAddressRegex = /^[آ-یa-zA-Z0-9\s\-،.#]{5,100}$/u;
const iranPhoneRegex = /^(09\d{9}|0\d{10})$/;

const clubValidationSchema = Joi.object({
    club_name: Joi.string()
        .trim()
        .pattern(clubNameRegex)
        .min(3)
        .max(50)
        .required()
        .messages({
            "string.empty": "نام باشگاه نباید خالی باشد.",
            "string.pattern.base": "نام فقط می تواند شامل حروف فارسی یا انگلیسی باشد.",
            "string.min": "نام باشگاه شما حداقل باید 3 حرف باشد.",
            "string.max": "نام باشگاه شما نباید بیش از 50 حرف باشد.",
            "any.required": "وارد کردن ادرس اجباری است.",
        }),

    club_address: Joi.string()
        .trim()
        .pattern(clubAddressRegex)
        .min(5)
        .max(100)
        .required()
        .messages({
            "string.empty": "آدرس نباید خالی باشد.",
            "string.pattern.base": "آدرس فقط می‌تواند شامل حروف، اعداد و علائم متداول باشد.",
            "string.min": "نام باشگاه شما حداقل باید 3 حرف باشد.",
            "string.max": "نام باشگاه شما نباید بیش از 100 حرف باشد.",
            "any.required": "وارد کردن ادرس اجباری است.",
        }),

    club_phone: Joi.string()
        .trim()
        .pattern(iranPhoneRegex)
        .required()
        .messages({
            "string.empty": "شماره نباید خالی باشد.",
            "string.pattern.base": "شماره وارد شده معتبر نیست (باید همراه یا ثابت ایران باشد).",
            "any.required": "وارد کردن شماره اجباری است."
        }),
});

module.exports = {
    clubValidationSchema
};