const Joi = require("joi");

const studentNameRegex = /^[آ-یA-Za-z\s]+$/;
const iranPhoneRegex = /^(09\d{9}|0\d{10})$/;

const studentValidationSchema = Joi.object({
    student_name: Joi.string()
        .trim()
        .pattern(studentNameRegex)
        .min(3)
        .max(50)
        .required()
        .messages({
            "string.empty": "نام هنرجو نباید خالی باشد.",
            "string.pattern.base": "نام فقط می تواند شامل حروف فارسی یا انگلیسی باشد.",
            "string.min": "نام هنرجو شما حداقل باید 3 حرف باشد.",
            "string.max": "نام هنرجو شما نباید بیش از 50 حرف باشد.",
            "any.required": "وارد کردن ادرس اجباری است.",
        }),

    student_phone: Joi.string()
        .trim()
        .pattern(iranPhoneRegex)
        .required()
        .messages({
            "string.empty": "شماره نباید خالی باشد.",
            "string.pattern.base": "شماره وارد شده معتبر نیست (باید همراه یا ثابت ایران باشد).",
            "any.required": "وارد کردن شماره اجباری است."
        }),

    student_age: Joi.number()
        .integer()
        .min(3)
        .max(100)
        .required()
        .messages({
            "number.base": "سن باید یک عدد معتبر باشد.",
            "number.integer": "سن باید یک عدد صحیح باشد.",
            "number.min": "سن هنرجو نباید کمتر از ۳ سال باشد.",
            "number.max": "سن هنرجو نباید بیشتر از ۱۰۰ سال باشد.",
            "any.required": "وارد کردن سن هنرجو الزامی است."
        }),

    student_gender: Joi.string()
        .valid("مذکر", "مونث")
        .optional()
        .allow(null)
        .messages({
            "any.only": "اگر جنسیت وارد می‌شود، فقط باید 'مذکر' یا 'مونث' باشد.",
            "string.base": "جنسیت باید به صورت متن وارد شود."
        })
});

module.exports = {
    studentValidationSchema
};