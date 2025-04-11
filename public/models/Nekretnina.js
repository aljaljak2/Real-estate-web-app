const Sequelize = require("sequelize");
const sequelize = require("./baza.js");

module.exports = function (sequelize, DataTypes) {
  const Nekretnina = sequelize.define('Nekretnina', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tip_nekretnine: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    naziv: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    kvadratura: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    cijena: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    tip_grijanja: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lokacija: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    godina_izgradnje: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    datum_objave: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    opis: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
  }, {
    tableName: 'Nekretnina',
  });

  Nekretnina.associate = function (models) {
    Nekretnina.hasMany(models.Upit, { foreignKey: 'nekretninaId' });
    Nekretnina.hasMany(models.Zahtjev, { foreignKey: 'nekretninaId' });
    Nekretnina.hasMany(models.Ponuda, { foreignKey: 'nekretninaId' });

    Nekretnina.prototype.getInteresovanja = async function () {
      const upiti = await this.getUpiti();
      const zahtjevi = await this.getZahtjevi();
      const ponude = await this.getPonude();
      return [...upiti, ...zahtjevi, ...ponude];
    };
  };

  return Nekretnina;
};