const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  const Korisnik = sequelize.define('Korisnik', {
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    admin: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'Korisnik', 
  });

  Korisnik.associate = function (models) {
    Korisnik.hasMany(models.Ponuda, { foreignKey: 'korisnikId' });
    Korisnik.hasMany(models.Upit, { foreignKey: 'korisnikId' });
    Korisnik.hasMany(models.Zahtjev, { foreignKey: 'korisnikId' });
  };

  return Korisnik;
};
