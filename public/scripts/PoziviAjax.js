
const PoziviAjax = (() => {

    // fnCallback se u svim metodama poziva kada stigne
    // odgovor sa servera putem Ajax-a
    // svaki callback kao parametre ima error i data,
    // error je null ako je status 200 i data je tijelo odgovora
    // ako postoji greška, poruka se prosljeđuje u error parametru
    // callback-a, a data je tada null

    function ajaxRequest(method, url, data, callback) {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status ===201) {
                    callback(null, xhr.responseText);
                } else {
                    callback({ status: xhr.status, statusText: xhr.statusText }, null);
                }
            }
        };
        xhr.send(data ? JSON.stringify(data) : null);
    }

    // vraća korisnika koji je trenutno prijavljen na sistem
    function impl_getKorisnik(fnCallback) {
        let ajax = new XMLHttpRequest();

        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4) {
                if (ajax.status == 200) {
                    console.log('Uspješan zahtjev, status 200');
                    fnCallback(null, JSON.parse(ajax.responseText));
                } else if (ajax.status == 401) {
                    console.log('Neuspješan zahtjev, status 401');
                    fnCallback("error", null);
                } else {
                    console.log('Nepoznat status:', ajax.status);
                }
            }
        };

        ajax.open("GET", "http://localhost:3000/korisnik/", true);
        ajax.setRequestHeader("Content-Type", "application/json");
        ajax.send();
    }

    // ažurira podatke loginovanog korisnika
    function impl_putKorisnik(noviPodaci, fnCallback) {
        // Check if user is authenticated
        if (!req.session.username) {
            // User is not logged in
            return fnCallback({ status: 401, statusText: 'Neautorizovan pristup' }, null);
        }

        // Get data from request body
        const { ime, prezime, username, password } = noviPodaci;

        // Read user data from the JSON file
        const users = readJsonFile('korisnici');

        // Find the user by username
        const loggedInUser = users.find((user) => user.username === req.session.username);

        if (!loggedInUser) {
            // User not found (should not happen if users are correctly managed)
            return fnCallback({ status: 401, statusText: 'Neautorizovan pristup' }, null);
        }

        // Update user data with the provided values
        if (ime) loggedInUser.ime = ime;
        if (prezime) loggedInUser.prezime = prezime;
        if (username) loggedInUser.adresa = adresa;
        if (password) loggedInUser.brojTelefona = brojTelefona;

        // Save the updated user data back to the JSON file
        saveJsonFile('korisnici', users);

        fnCallback(null, { poruka: 'Podaci su uspješno ažurirani' });
    }
            function impl_postUpit(nekretnina_id, tekst_upita, fnCallback) {
                const data = {
                    nekretnina_id,
                    tekst_upita,
                };
            
                ajaxRequest('POST', '/upit', data, (error, responseText) => {
                    if (error) {
                        console.error('Error: ', error);
                        return fnCallback({ status: error.status, statusText: error.statusText || 'Internal Server Error' }, null);
                    }
                    
                    try {
                        const responseData = JSON.parse(responseText);
                        fnCallback(null, responseData);
                    } catch (parseError) {
                        console.error('Parse error: ', parseError);
                        fnCallback({ status: 500, statusText: 'Failed to parse response' }, null);
                    }
                });
            }
            
            /*function ajaxRequest(method, url, data, callback) {
                const xhr = new XMLHttpRequest();
                xhr.open(method, url, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            callback(null, xhr.responseText);
                        } else {
                            callback({ status: xhr.status, statusText: xhr.statusText }, null);
                        }
                    }
                };
                
                xhr.send(data ? JSON.stringify(data) : null);
            }*/
            
            
        

    function impl_getNekretnine(fnCallback) {
        // Koristimo AJAX poziv da bismo dohvatili podatke s servera
        ajaxRequest('GET', '/nekretnine', null, (error, data) => {
            // Ako se dogodi greška pri dohvaćanju podataka, proslijedi grešku kroz callback
            if (error) {
                fnCallback(error, null);
            } else {
                // Ako su podaci uspješno dohvaćeni, parsiraj JSON i proslijedi ih kroz callback
                try {
                    const nekretnine = JSON.parse(data);
                    fnCallback(null, nekretnine);
                } catch (parseError) {
                    // Ako se dogodi greška pri parsiranju JSON-a, proslijedi grešku kroz callback
                    fnCallback(parseError, null);
                }
            }
        });
    }

    function impl_postLogin(username, password, fnCallback) {
        var ajax = new XMLHttpRequest()

        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4 && ajax.status == 200) {
                fnCallback(null, ajax.response)
            }
            else if (ajax.readyState == 4) {
                //desio se neki error
                fnCallback(ajax.statusText, null)
            }
        }
        ajax.open("POST", "http://localhost:3000/login", true)
        ajax.setRequestHeader("Content-Type", "application/json")
        var objekat = {
            "username": username,
            "password": password
        }
        forSend = JSON.stringify(objekat)
        ajax.send(forSend)
    }

    function impl_postLogout(fnCallback) {
        let ajax = new XMLHttpRequest()

        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4 && ajax.status == 200) {
                fnCallback(null, ajax.response)
            }
            else if (ajax.readyState == 4) {
                //desio se neki error
                fnCallback(ajax.statusText, null)
            }
        }
        ajax.open("POST", "http://localhost:3000/logout", true)
        ajax.send()
    }

    function getTop5Nekretnina(lokacija, fnCallback) {
        ajaxRequest('GET', `/nekretnine/top5?lokacija=${encodeURIComponent(lokacija)}`, null, (error, data) => {
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    const nekretnine = JSON.parse(data);
                    fnCallback(null, nekretnine);
                } catch (parseError) {
                    fnCallback(parseError, null);
                }
            }
        });
    }

    function getMojiUpiti(fnCallback) {
        ajaxRequest('GET', '/upiti/moji', null, (error, data) => {
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    const upiti = JSON.parse(data);
                    fnCallback(null, upiti);
                } catch (parseError) {
                    fnCallback(parseError, null);
                }
            }
        });
    }

    function getNekretnina(nekretnina_id, fnCallback) {
        ajaxRequest('GET', `/nekretnina/${nekretnina_id}`, null, (error, data) => {
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    const nekretnina = JSON.parse(data);
                    fnCallback(null, nekretnina);
                } catch (parseError) {
                    fnCallback(parseError, null);
                }
            }
        });
    }

    function getNextUpiti(nekretnina_id, page, fnCallback) {
        ajaxRequest('GET', `/next/upiti/nekretnina${nekretnina_id}?page=${page}`, null, (error, data) => {
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    const upiti = JSON.parse(data);
                    fnCallback(null, upiti);
                } catch (parseError) {
                    fnCallback(parseError, null);
                }
            }
        });
    }
    function getInteresovanja(nekretnina_id, fnCallback) {
        ajaxRequest('GET', `/nekretnina/${nekretnina_id}/interesovanja`, null, (error, data) => {
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    const interesovanja = JSON.parse(data);
                    fnCallback(null, interesovanja);
                } catch (parseError) {
                    fnCallback(parseError, null);
                }
            }
        });
    }
    function postPonuda(nekretninaId, tekst, ponudaCijene, datumPonude, idVezanePonude, odbijenaPonuda, fnCallback) {
        const data = {
            tekst,
            ponudaCijene: parseFloat(ponudaCijene), // Ensure the price is a float
            datumPonude,
            idVezanePonude: idVezanePonude ? parseInt(idVezanePonude) : null, // Ensure the ID is null or an integer
            odbijenaPonuda,
        };
        ajaxRequest('POST',`/nekretnina/${nekretninaId}/ponuda`,data,
            (error, data) => {
                if (error) {
                    fnCallback(error, null);
                } else {
                    try {
                        const createdPonuda = JSON.parse(data);
                        fnCallback(null, createdPonuda);
                    } catch (parseError) {
                        fnCallback(parseError, null);
                    }
                }
            }
        );
    }
    
    function postZahtjev(nekretninaId, tekst, trazeniDatum, fnCallback) {
        ajaxRequest('POST', `/nekretnina/${nekretninaId}/zahtjev`, tekst, trazeniDatum, (error, data) => {
            if (error) {
                return fnCallback(error, null);
            } else {
                try {
                    const createdZahtjev = JSON.parse(data);
                    return fnCallback(null, createdZahtjev);
                } catch (parseError) {
                    return fnCallback(parseError, null);
                }
            }
        });
    }
        
    
    
    
    function updateZahtjev(nekretnina_id, zahtjev_id, updateData, fnCallback) {
        ajaxRequest('PUT', `/nekretnina/${nekretnina_id}/zahtjev/${zahtjev_id}`, JSON.stringify(updateData), (error, data) => {
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    const updatedZahtjev = JSON.parse(data);
                    fnCallback(null, updatedZahtjev);
                } catch (parseError) {
                    fnCallback(parseError, null);
                }
            }
        });
    }
    

    return {
        postLogin: impl_postLogin,
        postLogout: impl_postLogout,
        getKorisnik: impl_getKorisnik,
        putKorisnik: impl_putKorisnik,
        postUpit: impl_postUpit,
        getNekretnine: impl_getNekretnine,
        getTop5Nekretnina: getTop5Nekretnina,
        getMojiUpiti: getMojiUpiti,
        getNekretnina: getNekretnina,
        getNextUpiti: getNextUpiti,
        getInteresovanja: getInteresovanja,
        postPonuda: postPonuda,
        postZahtjev: postZahtjev,
        updateZahtjev: updateZahtjev
    };
})();