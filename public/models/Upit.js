const Sequelize = require("sequelize");
const sequelize = require("./baza.js");

module.exports = function (sequelize, DataTypes) {
  const Upit = sequelize.define('Upit', {
    tekst: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
  }, {
    tableName: 'Upit',

  });

  Upit.associate = function (models) {
    Upit.belongsTo(models.Korisnik, { foreignKey: 'korisnikId' });
    Upit.belongsTo(models.Nekretnina, { foreignKey: 'nekretninaId' });
  };

  return Upit;
};