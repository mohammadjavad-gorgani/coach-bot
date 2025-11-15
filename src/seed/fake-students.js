const sequelize = require("../config/sequelize.config");
const { StudentSession } = require("../models/student-session.model");
const { Student } = require("../models/student.model");


async function createFakeStudents() {
  const names = [
    "سارا", "مریم", "نازنین", "الهام", "نیلوفر", "شقایق", "راضیه", "سمانه", "زهرا", "ریحانه",
    "فاطمه", "فرزانه", "آزاده", "مهسا", "پگاه", "میترا", "هانیه", "حدیث", "نسرین", "شادی",
    "نازگل", "ساناز", "شکوفه", "سولماز", "ثنا", "صدف", "یلدا", "روژین", "نسترن", "نیایش",
    "نگار", "هلیا", "نازلی", "پرستو", "سحر", "مونا", "رویا", "نگین", "سهیلا", "صبا",
    "بهناز", "سوده", "ترانه", "شکیبا", "کیمیا", "ملیکا", "آیسان", "نازنین زهرا", "مریم سادات", "نازنین فاطمه"
  ];

  const club_id = 1;
  const session_id = 1;

  try {
    await sequelize.authenticate();
    console.log("✅ اتصال به دیتابیس برقرار شد.");

    for (let i = 0; i < 50; i++) {
      const name = names[i];
      const phone = "09" + Math.floor(100000000 + Math.random() * 899999999).toString();
      const age = Math.floor(10 + Math.random() * 10); // بین 10 تا 20 سال

      const student = await Student.create({
        full_name: name,
        phone_number: phone,
        age,
        gender: "مونث",
        club_id,
      });

      await StudentSession.create({
        student_id: student.id,
        session_id: session_id,
      });

      console.log(`✅ هنرجو ${name} ثبت شد و به کلاس لینک شد.`);
    }

    console.log("🎉 تمام 50 هنرجو با موفقیت اضافه شدند.");
    process.exit();
  } catch (error) {
    console.error("❌ خطا در درج هنرجو:", error);
    process.exit(1);
  }
}

createFakeStudents();
