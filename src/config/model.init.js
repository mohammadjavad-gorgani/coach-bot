const { Attendance } = require("../models/attendance.model");
const { Club } = require("../models/club.model");
const { Payment } = require("../models/payment.model");
const { Session } = require("../models/session.model");
const { StudentSession } = require("../models/student-session.model");
const { Student } = require("../models/student.model");
const { User } = require("../models/user.model");
const sequelize = require("./sequelize.config");

async function initDatabase() {
  User.hasOne(Club, { foreignKey: "user_id", sourceKey: "id", as: "club" });
  Club.belongsTo(User, { foreignKey: "user_id", targetKey: "id", as: "owner" });

  // Club -> Students, Sessions (One-to-Many)
  Club.hasMany(Session, {
    foreignKey: "club_id",
    sourceKey: "id",
    as: "sessions",
  });
  Session.belongsTo(Club, {
    foreignKey: "club_id",
    targetKey: "id",
    as: "club",
  });

  Club.hasMany(Student, {
    foreignKey: "club_id",
    sourceKey: "id",
    as: "students",
  });
  Student.belongsTo(Club, {
    foreignKey: "club_id",
    targetKey: "id",
    as: "club",
  });

  // Student <-> Session (Many-to-Many)
  Student.belongsToMany(Session, {
    through: StudentSession,
    foreignKey: "student_id",
    otherKey: "session_id",
    as: "sessions",
  });
  Session.belongsToMany(Student, {
    through: StudentSession,
    foreignKey: "session_id",
    otherKey: "student_id",
    as: "students",
  });

  Student.hasMany(StudentSession, {
    foreignKey: "student_id",
    as: "studentSessions",
  });
  StudentSession.belongsTo(Student, {
    foreignKey: "student_id",
    as: "students",
  });

  Session.hasMany(StudentSession, {
    foreignKey: "session_id",
    as: "sessionStudents",
  });
  StudentSession.belongsTo(Session, {
    foreignKey: "session_id",
    as: "sessions",
  });

  // Student, Session -> attendances (One-to-Many)
  Student.hasMany(Attendance, {
    foreignKey: "student_id",
    sourceKey: "id",
    as: "attendances",
  });
  Attendance.belongsTo(Student, {
    foreignKey: "student_id",
    targetKey: "id",
    as: "student",
  });
  Session.hasMany(Attendance, {
    foreignKey: "session_id",
    sourceKey: "id",
    as: "attendances",
  });
  Attendance.belongsTo(Session, {
    foreignKey: "session_id",
    targetKey: "id",
    as: "session",
  });

  // Club -> Payments (One-to-Many)
  Club.hasMany(Payment, { foreignKey: "club_id", as: "payments" });
  Payment.belongsTo(Club, { foreignKey: "club_id", as: "club" });

  // Student -> Payments (One-to-Many)
  Student.hasMany(Payment, { foreignKey: "student_id", as: "payments" });
  Payment.belongsTo(Student, { foreignKey: "student_id", as: "student" });

  // User (Coach) -> Payments (One-to-Many)
  User.hasMany(Payment, { foreignKey: "user_id", as: "payments" });
  Payment.belongsTo(User, { foreignKey: "user_id", as: "user" });

  // Club.sync({});
  // Session.sync({});

  // Attendance.sync({force: true});

  //   await sequelize.sync({ force: true });
  // await sequelize.sync({alter: true});
}

module.exports = initDatabase;
