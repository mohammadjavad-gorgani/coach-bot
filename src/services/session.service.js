const { Session } = require("../models/session.model");

async function findAllSessionsByClubId(clubId) {
    return Session.findAll({ where: { club_id: clubId }, attributes: ["name", "description"] });
};

module.exports = {
    findAllSessionsByClubId
};
