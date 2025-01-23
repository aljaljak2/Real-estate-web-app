const Sequelize = require("sequelize");
const sequelize = require("./baza.js");

module.exports = function (sequelize, DataTypes) {
  const Zahtjev = sequelize.define('Zahtjev', {
    tekst: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    trazeniDatum: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    odobren: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'Zahtjev',

  });

  Zahtjev.associate = function (models) {
    Zahtjev.belongsTo(models.Korisnik, { foreignKey: 'korisnikId' });
    Zahtjev.belongsTo(models.Nekretnina, { foreignKey: 'nekretninaId' });
  };

  return Zahtjev;
};