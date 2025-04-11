const Sequelize = require('sequelize');
const sequelize = require('./baza.js');

const Korisnik = require('./Korisnik')(sequelize, Sequelize.DataTypes);
const Nekretnina = require('./Nekretnina')(sequelize, Sequelize.DataTypes);
const Upit = require('./Upit')(sequelize, Sequelize.DataTypes);
const Zahtjev = require('./Zahtjev')(sequelize, Sequelize.DataTypes);
const Ponuda = require('./Ponuda')(sequelize, Sequelize.DataTypes);

const models = {
  Korisnik,
  Nekretnina,
  Upit,
  Zahtjev,
  Ponuda,
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;