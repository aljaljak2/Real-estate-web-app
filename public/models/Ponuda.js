const Sequelize = require("sequelize");
const sequelize = require("./baza.js");

module.exports = function (sequelize, DataTypes) {
  const Ponuda = sequelize.define('Ponuda', {
    tekst: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    cijenaPonude: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    datumPonude: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    odbijenaPonuda: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'Ponuda',

  });

  Ponuda.associate = function (models) {
    Ponuda.belongsTo(models.Korisnik, { foreignKey: 'korisnikId' });
    Ponuda.belongsTo(models.Nekretnina, { foreignKey: 'nekretninaId' });
    Ponuda.hasMany(models.Ponuda, { as: 'vezanePonude', foreignKey: 'parentPonudaId' });
  };

  return Ponuda;
};