const express = require('express');
const session = require("express-session");
const path = require('path');
const fs = require('fs').promises; // Using asynchronus API for file read and write
const bcrypt = require('bcrypt');
const app = express();
const PORT = 3000;
const { sequelize, Korisnik, Nekretnina, Upit, Zahtjev, Ponuda } = require('./public/models/indexModel.js');


app.use(session({
  secret: 'tajna sifra',
  resave: true,
  saveUninitialized: true
}));

app.use(express.static(__dirname + '/public'));

// Enable JSON parsing without body-parser
app.use(express.json());

/* ---------------- SERVING HTML -------------------- */

// Async function for serving html files
async function serveHTMLFile(req, res, fileName) {
  const htmlPath = path.join(__dirname, 'public/html', fileName);
  try {
    const content = await fs.readFile(htmlPath, 'utf-8');
    res.send(content);
  } catch (error) {
    console.error('Error serving HTML file:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
}

// Array of HTML files and their routes
const routes = [
  { route: '/nekretnine.html', file: 'nekretnine.html' },
  { route: '/detalji.html', file: 'detalji.html' },
  { route: '/meni.html', file: 'meni.html' },
  { route: '/prijava.html', file: 'prijava.html' },
  { route: '/profil.html', file: 'profil.html' },
  { route: '/mojiUpiti.html', file: 'mojiUpiti.html'},
  {route: '/statistika.html', file:'statistika.html'},
  {route: '/vijesti.html', file:'vijesti.html'},
  // Practical for adding more .html files as the project grows
];


// Loop through the array so HTML can be served
routes.forEach(({ route, file }) => {
  app.get(route, async (req, res) => {
    await serveHTMLFile(req, res, file);
  });
});

/* ----------- SERVING OTHER ROUTES --------------- */

// Async function for reading json data from data folder 
async function readJsonFile(filename) {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  try {
    const rawdata = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(rawdata);
  } catch (error) {
    throw error;
  }
}

// Async function for reading json data from data folder 
async function saveJsonFile(filename, data) {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    throw error;
  }
}

// Helper function to log login attempts
async function logLoginAttempt(username, status) {
  const now = new Date();
  const offsetInHours = 1; // Adjust for UTC+1 (CET)
  const offsetInMilliseconds = offsetInHours * 60 * 60 * 1000;

  // Apply the offset
  const localTime = new Date(now.getTime() + offsetInMilliseconds);
  const logMessage = `${localTime.toISOString()} - username: "${username}" - status: "${status}"\n`;

  await fs.appendFile('prijave.txt', logMessage, 'utf-8');
}


// In-memory store for tracking login attempts
const loginAttempts = {};


app.post('/login', async (req, res) => {
  const jsonObj = req.body;
  const username = jsonObj.username;
  try {
    /*const data = await fs.readFile(path.join(__dirname, 'data', 'korisnici.json'), 'utf-8');
    const korisnici = JSON.parse(data);
    let found = false;*/
    const korisnici = await Korisnik.findAll(); // Fetch all users
        let found = false;
/*korisnici.forEach(element => {
    console.log(element);
    });*/

    // Check if the user is blocked
    if (loginAttempts[username]) {
      if (loginAttempts[username].blockedUntil > Date.now()) {
        await logLoginAttempt(username, 'neuspješno');
        return res.status(429).json({ greska: 'Previse neuspjesnih pokusaja. Pokusajte ponovo za 1 minutu.' });
      } else {
        // Reset attempts if the block period has passed
        //loginAttempts[username] = { attempts: 0, blockedUntil: 0 };
      }
    }

    for (const korisnik of korisnici) {
      if (korisnik.username == jsonObj.username) {
        const isPasswordMatched = await bcrypt.compare(jsonObj.password, korisnik.password);
        if (isPasswordMatched) {
          req.session.username = korisnik.username;
          found = true;
          loginAttempts[username] = { attempts: 0, blockedUntil: 0 }; // Reset attempts on successful login
          await logLoginAttempt(username, 'uspješno');
          break;
        }
      }
    }

    if (found) {
      res.json({ poruka: 'Uspješna prijava' });
    } else {
      // Increment login attempts
      if (!loginAttempts[username]) {
        loginAttempts[username] = { attempts: 0, blockedUntil: 0 };
      }
      loginAttempts[username].attempts += 1;

      // Block user after 3 failed attempts
      if (loginAttempts[username].attempts >= 3 && loginAttempts[username].blockedUntil <= Date.now()) {
        console.log('Blocked user:', username);

        loginAttempts[username].blockedUntil = Date.now() + 60000; // Block for 1 minute
        await logLoginAttempt(username, 'neuspješno');
        setTimeout(() => {
          loginAttempts[username] = { attempts: 0, blockedUntil: 0 }; // Reset attempts after 1 minute
        }, 60000);
        return res.status(429).json({ greska: 'Previse neuspjesnih pokusaja. Pokusajte ponovo za 1 minutu.' });
      }

      await logLoginAttempt(username, 'neuspješno');
      res.json({ poruka: 'Neuspješna prijava' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

/*
Delete everything from the session.
*/
app.post('/logout', (req, res) => {
  // Check if the user is authenticated
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // Clear all information from the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      res.status(500).json({ greska: 'Internal Server Error' });
    } else {
      res.status(200).json({ poruka: 'Uspješno ste se odjavili' });
    }
  });
});

/*
Returns currently logged user data. First takes the username from the session and grabs other data
from the .json file.
*/
app.get('/korisnik', async (req, res) => {
  // Check if the username is present in the session
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // User is logged in, fetch additional user data
  const username = req.session.username;

  try {
    // Read user data from the JSON file
    const users = await Korisnik.findAll();

    // Find the user by username
    const user = users.find((u) => u.username === username);

    if (!user) {
      // User not found (should not happen if users are correctly managed)
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    // Send user data
    const userData = {
      id: user.id,
      username: user.username,
      password: user.password,
      admin: user.admin
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.post('/upit', async (req, res) => {
  // Check if the user is authenticated

  if (!req.session.username) {
    // User is not logged in
    console.log("Ovdje sam");
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // Get data from the request body
  const { nekretnina_id, tekst_upita } = req.body;

  try {
    // Find the logged-in user
    const loggedInUser = await Korisnik.findOne({
      where: { username: req.session.username }
    });

    if (!loggedInUser) {
      return res.status(404).json({ greska: 'Korisnik nije pronađen' });
    }

    // Check if the property with nekretnina_id exists
    const nekretnina = await Nekretnina.findByPk(nekretnina_id);

    if (!nekretnina) {
      return res.status(400).json({ greska: `Nekretnina sa ID-em ${nekretnina_id} ne postoji` });
    }

    // Check if the user has already made 3 queries for the same property
    const userQueries = await Upit.findAll({
      where: {
        korisnikId: loggedInUser.id,
        nekretninaId: nekretnina_id
      }
    });

    if (userQueries.length >= 3) {
      return res.status(429).json({ greska: 'Previše upita za istu nekretninu.' });
    }

    // Create a new query (Upit) in the database
    const newUpit = await Upit.create({
      tekst: tekst_upita,
      korisnikId: loggedInUser.id,
      nekretninaId: nekretnina_id
    });

    res.status(200).json({ poruka: 'Upit je uspješno dodan', upit: newUpit });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


/*
Updates any user field
*/
app.put('/korisnik', async (req, res) => {
  // Check if the user is authenticated
  if (!req.session.username) {
    // User is not logged in
   
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // Get data from the request body
  const { ime, prezime, username, password } = req.body;

  try {
    // Read user data from the JSON file
    const users = await Korisnik.findAll();

    // Find the user by username
    const loggedInUser = users.find((user) => user.username === req.session.username);

    if (!loggedInUser) {
      // User not found (should not happen if users are correctly managed)
      return res.status(q).json({ greska: 'Neautorizovan pristup' });
    }

    // Update user data with the provided values
    if (ime) loggedInUser.ime = ime;
    if (prezime) loggedInUser.prezime = prezime;
    if (username) loggedInUser.username = username;
    if (password) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      loggedInUser.password = hashedPassword;
    }

    // Save the updated user data back to the JSON file
    await saveJsonFile('korisnici', users);
    res.status(200).json({ poruka: 'Podaci su uspješno ažurirani' });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

/*
Returns all properties from the file.
*/
app.get('/nekretnine', async (req, res) => {
  try {
    const nekretnineData = await Nekretnina.findAll();
    res.json(nekretnineData);
  } catch (error) {
    console.error('Error fetching properties data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});
app.get('/nekretnine/top5', async (req, res) => {
  const lokacija = req.query.lokacija;

  try {
    // Fetch properties from the database filtered by location, sorted by publication date
    const top5Nekretnine = await Nekretnina.findAll({
      where: { lokacija },
      order: [['datum_objave', 'DESC']],
      limit: 5, // Limit the results to 5
    });

    res.status(200).json(top5Nekretnine);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


app.get('/upiti/moji', async (req, res) => {
  // Check if the user is authenticated
  if (!req.session.username) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  try {
    // Find the logged-in user from the database
    const loggedInUser = await Korisnik.findOne({ where: { username: req.session.username } });

    if (!loggedInUser) {
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    // Fetch all queries (Upit) for the logged-in user, including the associated property (Nekretnina)
    const userQueries = await Upit.findAll({
      where: { korisnikId: loggedInUser.id },
      include: {
        model: Nekretnina,
        attributes: ['id', 'naziv', 'lokacija'], // Include relevant property details
      },
    });

    if (userQueries.length === 0) {
      return res.status(404).json([]);
    }

    // Transform the results into the desired response format
    const response = userQueries.map(upit => ({
      id_nekretnine: upit.Nekretnina.id,
      naziv_nekretnine: upit.Nekretnina.naziv,
      lokacija: upit.Nekretnina.lokacija,
      tekst_upita: upit.tekst,
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching user queries:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


app.get('/nekretnina/:id', async (req, res) => {
  const nekretninaId = parseInt(req.params.id, 10);

  try {
    const nekretnina = await Nekretnina.findOne({
      where: { id: nekretninaId },
      include: {
        model: Upit,
        attributes: ['tekst', 'createdAt', 'korisnikId'], // Include korisnik_id
        limit: 3,
        order: [['createdAt', 'DESC']],
      },
    });

    if (!nekretnina) {
      return res.status(404).json({ greska: 'Nekretnina nije pronađena' });
    }

    const response = {
      id: nekretnina.id,
      kvadratura: nekretnina.kvadratura,
      tip_grijanja:nekretnina.tip_grijanja,
      godina_izgradnje: nekretnina.godina_izgradnje,
      datum_objave: formatDate(nekretnina.datum_objave),
      naziv: nekretnina.naziv,
      lokacija: nekretnina.lokacija,
      cijena: nekretnina.cijena,
      opis: nekretnina.opis,
      upiti: nekretnina.Upits.map(upit => ({
        korisnik_id: upit.korisnikId, 
        tekst_upita: upit.tekst, // Rename tekst to tekst_upita for consistency
        datum: upit.createdAt,
      })),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching property details:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0'); // Ensure 2 digits
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getFullYear();
  return `${day}.${month}.${year}.`;
}


app.get('/next/upiti/nekretnina:id', async (req, res) => {
  const nekretninaId = parseInt(req.params.id, 10);
  const page = parseInt(req.query.page, 10);

  if (page < 0) {
    return res.status(400).json({ greska: 'Page must be >= 0' });
  }

  try {
    // Number of items per page
    const limit = 3;

    // Calculate offset for pagination
    const offset = page * limit;

    // Fetch the property with the specified ID and its associated queries
    const nekretnina = await Nekretnina.findOne({
      where: { id: nekretninaId },
      include: {
        model: Upit,
        attributes: ['tekst', 'createdAt', 'korisnikId'], // Fetch relevant fields
        limit: limit, // Limit to 3 queries per page
        offset: offset, // Offset for pagination
        order: [['createdAt', 'DESC']], // Order by creation date (most recent first)
      },
    });

    // If the property doesn't exist, return an empty array
    if (!nekretnina) {
      return res.status(404).json([]);
    }

    // Extract and format the queries
    const queries = nekretnina.Upits.map(upit => ({
      korisnik_id: upit.korisnikId,
      tekst_upita: upit.tekst,
      datum: upit.createdAt,
    }));

    // If no queries are found for the given page, return an empty array
    if (queries.length === 0) {
      return res.status(404).json([]);
    }

    res.status(200).json(queries);
  } catch (error) {
    console.error('Error fetching next queries:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});



/* ----------------- MARKETING ROUTES ----------------- */

// Route that increments value of pretrage for one based on list of ids in nizNekretnina
app.post('/marketing/nekretnine', async (req, res) => {
  const { nizNekretnina } = req.body;

  try {
    // Load JSON data
    let preferencije = await readJsonFile('preferencije');

    // Check format
    if (!preferencije || !Array.isArray(preferencije)) {
      console.error('Neispravan format podataka u preferencije.json.');
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    // Init object for search
    preferencije = preferencije.map((nekretnina) => {
      nekretnina.pretrage = nekretnina.pretrage || 0;
      return nekretnina;
    });

    // Update atribute pretraga
    nizNekretnina.forEach((id) => {
      const nekretnina = preferencije.find((item) => item.id === id);
      if (nekretnina) {
        nekretnina.pretrage += 1;
      }
    });

    // Save JSON file
    await saveJsonFile('preferencije', preferencije);

    res.status(200).json({});
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/nekretnina/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const nekretninaData = preferencije.find((item) => item.id === parseInt(id, 10));

    if (nekretninaData) {
      // Update clicks
      nekretninaData.klikovi = (nekretninaData.klikovi || 0) + 1;

      // Save JSON file
      await saveJsonFile('preferencije', preferencije);

      res.status(200).json({ success: true, message: 'Broj klikova ažuriran.' });
    } else {
      res.status(404).json({ error: 'Nekretnina nije pronađena.' });
    }
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/osvjezi/pretrage', async (req, res) => {
  const { nizNekretnina } = req.body || { nizNekretnina: [] };

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const promjene = nizNekretnina.map((id) => {
      const nekretninaData = preferencije.find((item) => item.id === id);
      return { id, pretrage: nekretninaData ? nekretninaData.pretrage : 0 };
    });

    res.status(200).json({ nizNekretnina: promjene });
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/osvjezi/klikovi', async (req, res) => {
  const { nizNekretnina } = req.body || { nizNekretnina: [] };

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const promjene = nizNekretnina.map((id) => {
      const nekretninaData = preferencije.find((item) => item.id === id);
      return { id, klikovi: nekretninaData ? nekretninaData.klikovi : 0 };
    });

    res.status(200).json({ nizNekretnina: promjene });
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/nekretnina/:id/interesovanja', async (req, res) => {
  try {
    const nekretninaId = req.params.id;

    // Fetch all interests
    const upiti = (await Upit.findAll({ where: { nekretninaId } })).map(upit => ({
      ...upit.dataValues,
      type: 'upit'
    }));

    const ponude = (await Ponuda.findAll({ where: { nekretninaId } })).map(ponuda => ({
      ...ponuda.dataValues,
      type: 'ponuda'
    }));

    let interesovanja = [...upiti, ...ponude];
    

    if (req.session && req.session.username) {
      // Fetch the logged-in user's details from the database
      const korisnik = await Korisnik.findOne({ where: { username: req.session.username } });

      if (!korisnik) {
        return res.status(401).json({ greska: 'Invalid user session' });
      }

    
      const isAdmin = korisnik.admin; 
    let zahtjevi = [];
      if (isAdmin) {
        // Admin user: Fetch all zahtjevi for the nekretnina
        zahtjevi = (await Zahtjev.findAll({ where: { nekretninaId } })).map(zahtjev => ({
          ...zahtjev.dataValues,
          type: 'zahtjev'
        }));
      } else {
        // Non-admin user: Fetch only the zahtjevi created by the logged-in user
        zahtjevi = (await Zahtjev.findAll({ where: { nekretninaId, korisnikId: korisnik.id } })).map(zahtjev => ({
          ...zahtjev.dataValues,
          type: 'zahtjev'
        }));
      }

      if (!korisnik) {
        zahtjevi = [];
      }
   
      /*const zahtjevi = (await Zahtjev.findAll({ where: { nekretninaId } })).map(zahtjev => ({
        ...zahtjev.dataValues,
        type: 'zahtjev'
      }));*/


      interesovanja = [...interesovanja, ...zahtjevi];

      if (!isAdmin) {

        const userPonudaIds = interesovanja
        .filter(interes => interes.type === 'ponuda' && interes.korisnikId === korisnik.id)
        .map(ponuda => ponuda.id);

        const userPonudaParents=interesovanja
        .filter(interes => interes.type === 'ponuda' && interes.korisnikId === korisnik.id)
        .map(ponuda => ponuda.parentPonudaId);
  
    interesovanja = interesovanja.map(interes => {
        if (interes.type === 'ponuda') {
            const isCreatedByUser = interes.korisnikId === korisnik.id;
            const isParentOfUserPonuda = userPonudaIds.includes(interes.id);
            const isReofferedByUser=userPonudaParents.includes(interes.id);
            if (!isCreatedByUser && !isParentOfUserPonuda && !isReofferedByUser) {
                const { cijenaPonude, ...rest } = interes;
                return rest;
            }
        }
        return interes;
       
    });
      }
    } else {
      // Unlogged users: Remove cijenaPonude from all Ponuda records
      interesovanja = interesovanja.map(interes => {
        if (interes.type ==='ponuda') {
          const { cijenaPonude, ...rest } = interes;
          return rest;
        }
        return interes;
      });
    }

    // Respond with the interests
    res.json(interesovanja);
  } catch (error) {
    console.error('Error fetching interests:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.post('/nekretnina/:id/ponuda', async (req, res) => {
  const { tekst, ponudaCijene, datumPonude, idVezanePonude, odbijenaPonuda } = req.body;
  const nekretninaId = req.params.id;

  if (!req.session || !req.session.username) {
    return res.status(401).json({ greska: 'Unauthorized access' });
  }

  try {
    const korisnik = await Korisnik.findOne({ where: { username: req.session.username } });

    if (!korisnik) {
      return res.status(401).json({ greska: 'Unauthorized user' });
    }

    const isAdmin = korisnik.admin;

    // Check if the related property exists
    const nekretnina = await Nekretnina.findByPk(nekretninaId);
    if (!nekretnina) {
      return res.status(404).json({ greska: 'Property not found' });
    }

    let rootPonuda = null;

    // Function to recursively find all offers in the chain
    async function findFullChain(rootPonudaId) {
      const chain = [];
      const queue = [rootPonudaId];

      while (queue.length > 0) {
        const currentParentId = queue.pop();
        const childPonude = await Ponuda.findAll({
          where: { parentPonudaId: currentParentId },
        });
        chain.push(...childPonude);
        queue.push(...childPonude.map((ponuda) => ponuda.id));
      }

      return chain;
    }

    // Validate and find the root parent offer
    if (idVezanePonude) {
      let currentPonuda = await Ponuda.findByPk(idVezanePonude);

      if (!currentPonuda) {
        return res.status(400).json({ greska: 'Related offer not found' });
      }

      // Traverse the chain to find the root offer
      while (currentPonuda.parentPonudaId) {
        currentPonuda = await Ponuda.findByPk(currentPonuda.parentPonudaId);
      }

      rootPonuda = currentPonuda;

      // Find the full chain of offers related to the root
      const chainPonude = await findFullChain(rootPonuda.id);

      // Check if any offer in the chain is rejected
      const hasRejected = chainPonude.some((ponuda) => ponuda.odbijenaPonuda);
      if (rootPonuda.odbijenaPonuda || hasRejected) {
        return res.status(400).json({
          greska: 'Cannot add a new offer to a chain with a rejected offer',
        });
      }

      // Admin can link to any chain as long as no rejected offer exists
      if (!isAdmin) {
        // Non-admin users can only link to chains where they own the root offer
        if (rootPonuda.korisnikId !== korisnik.id) {
          return res.status(403).json({
            greska: 'Forbidden: Non-admin users can only respond to chains they started',
          });
        }
      }
    }

    // Create a new offer
    const novaPonuda = await Ponuda.create({
      tekst,
      cijenaPonude: ponudaCijene,
      datumPonude,
      odbijenaPonuda,
      nekretninaId,
      korisnikId: korisnik.id,
      parentPonudaId: idVezanePonude || null,
    });

    res.status(201).json(novaPonuda);
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.post('/nekretnina/:id/zahtjev', async (req, res) => {
  const { tekst, trazeniDatum } = req.body;
  const nekretninaId = req.params.id;

  if (!req.session || !req.session.username) {
    return res.status(401).json({ greska: 'Unauthorized access' });
  }

  try {
    // Find the logged-in user
    const korisnik = await Korisnik.findOne({ where: { username: req.session.username } });

    if (!korisnik) {
      return res.status(401).json({ greska: 'Unauthorized user' });
    }

    // Check if the property exists
    const nekretnina = await Nekretnina.findByPk(nekretninaId);
    if (!nekretnina) {
      return res.status(404).json({ greska: 'Property not found' });
    }

    // Validate the requested date
    const currentDate = new Date();
    const requestedDate = new Date(trazeniDatum);

    if (isNaN(requestedDate.getTime()) || requestedDate < currentDate) {
      return res.status(400).json({ greska: 'Invalid requested date' });
    }

    // Create a new "zahtjev"
    const noviZahtjev = await Zahtjev.create({
      tekst,
      trazeniDatum: requestedDate,
      nekretninaId,
      korisnikId: korisnik.id,
    });

    res.status(200).json(noviZahtjev);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.put('/nekretnina/:id/zahtjev/:zid', async (req, res) => {
  const { odobren, addToTekst } = req.body;
  const { id, zid } = req.params;

  if (!req.session || !req.session.username) {
    return res.status(401).json({ greska: 'Unauthorized access' });
  }

  try {
    // Find the logged-in user
    const korisnik = await Korisnik.findOne({ where: { username: req.session.username } });

    if (!korisnik || !korisnik.admin) {
      return res.status(403).json({ greska: 'Forbidden: Only admins can respond to requests' });
    }

    // Check if the property exists
    const nekretnina = await Nekretnina.findByPk(id);
    if (!nekretnina) {
      return res.status(404).json({ greska: 'Property not found' });
    }

    // Find the specific request
    const zahtjev = await Zahtjev.findOne({ where: { id: zid, nekretninaId: id } });
    if (!zahtjev) {
      return res.status(404).json({ greska: 'Request not found' });
    }

    // Validate the request body
    if (odobren === false && (!addToTekst || addToTekst.trim() === '')) {
      return res.status(400).json({
        greska: "When 'odobren' is false, 'addToTekst' must be provided",
      });
    }

    // Update the request
    const updatedTekst = `${zahtjev.tekst} ODGOVOR ADMINA: ${addToTekst || ''}`;
    zahtjev.odobren = odobren;
    zahtjev.tekst = updatedTekst.trim();

    await zahtjev.save();

    res.status(200).json({ poruka: 'Request updated successfully', zahtjev });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


// Sync the models with the database and start the server
sequelize.sync()
  .then(async () => {
    console.log('Database & tables created!');

    // Seed the database with default data
    const defaultData = async () => {
      // Default data for Korisnik table
      const korisnici = [
        { username: 'admin', password: await bcrypt.hash('admin', 10), admin: true },
        { username: 'user', password: await bcrypt.hash('user', 10), admin: false },
      ];

      // Insert default data into Korisnik table using findOrCreate
      for (const korisnik of korisnici) {
        await Korisnik.findOrCreate({ where: { username: korisnik.username }, defaults: korisnik });
      }

      // Read and parse nekretnine.json
      const nekretnineData = await fs.readFile(path.join(__dirname, 'data/nekretnine.json'), 'utf-8');
      const nekretnine = JSON.parse(nekretnineData);

      // Insert default data into Nekretnina and Upit tables using findOrCreate
      for (const nekretnina of nekretnine) {
        const [createdNekretnina] = await Nekretnina.findOrCreate({
          where: { id: nekretnina.id },
          defaults: {
            tip_nekretnine: nekretnina.tip_nekretnine,
            naziv: nekretnina.naziv,
            kvadratura: nekretnina.kvadratura,
            cijena: nekretnina.cijena,
            tip_grijanja: nekretnina.tip_grijanja,
            lokacija: nekretnina.lokacija,
            godina_izgradnje: nekretnina.godina_izgradnje,
            datum_objave: new Date(nekretnina.datum_objave.split('.').reverse().join('-')), // Convert to Date object
            opis: nekretnina.opis
          }
        });

        for (const upit of nekretnina.upiti) {
          await Upit.findOrCreate({
            where: { tekst: upit.tekst_upita, nekretninaId: createdNekretnina.id },
            defaults: {
              tekst: upit.tekst_upita,
              korisnikId: upit.korisnik_id,
              nekretninaId: createdNekretnina.id
            }
          });
        }
      }

      console.log('Database seeded successfully!');
    };

    await defaultData();

    // Start the server after the database is synced and seeded
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });