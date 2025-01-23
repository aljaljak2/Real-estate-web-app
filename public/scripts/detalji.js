document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const nekretninaId = urlParams.get('id');
    let currentPage = 1; // Start from page 1 for subsequent calls
    let allUpitiLoaded = false;
    let currentUpiti = [];
    let currentIndex = 0;

    if (!nekretninaId) {
        console.error('No property ID provided');
        return;
    }

    const interesovanjaDetalji = document.getElementById('interesovanja-detalji');
    const tipInteresovanja = document.getElementById('tip-interesovanja');
    const posaljiInteresovanje = document.getElementById('posalji-interesovanje');
    // Event listener for changing the type of interest
    tipInteresovanja.addEventListener('change', function () {
        const selectedTip = tipInteresovanja.value;

        if (selectedTip === 'upit') {
            interesovanjaDetalji.innerHTML = `
                <label for="tekst-upita">Tekst upita:</label>
                <textarea id="tekst-upita" name="tekst" required></textarea>
            `;
        } else if (selectedTip === 'zahtjev') {
            interesovanjaDetalji.innerHTML = `
                <label for="tekst-zahtjeva">Tekst zahtjeva:</label>
                <textarea id="tekst-zahtjeva" name="tekst" required></textarea>
                <label for="trazeni-datum">Traženi datum:</label>
                <input type="date" id="trazeni-datum" name="trazeniDatum" required>
            `;
        } else if (selectedTip === 'ponuda') {
            // Load user data
            PoziviAjax.getKorisnik(async function (error, korisnik) {
                if (error) {
                    console.error('Error fetching korisnik:', error);
                    return;
                }
        
                // Load interests for the property
                PoziviAjax.getInteresovanja(nekretninaId, async function (error, interesovanja) {
                    if (error) {
                        console.error('Error fetching interesovanja:', error);
                        return;
                    }
        
                    // Filter only ponuda from interesovanja
                    const ponude = interesovanja.filter(interes => interes.hasOwnProperty('parentPonudaId'));
        
                    // Admin sees all ponudas; user sees only their ponudas and connected chains
                    let relevantPonude = [];
                    if (korisnik.admin) {
                        relevantPonude = ponude;
                        console.log("interesovanja ", interesovanja);
                    } else {
                        
                        const userPonude = ponude.filter(p => p.korisnikId === korisnik.id);
                        console.log("UserPonude: ", userPonude);
                        
                        // Add user's ponudas to relevantPonude
                        relevantPonude = [...userPonude];
                        console.log("RelevantPonude: ", relevantPonude);
        
                        // Filter ostale ponude (ponudas not created by the user)
                        const ostalePonude = ponude.filter(p => p.korisnikId != korisnik.id);
                        console.log("OstalePonude: ", ostalePonude);
        
                        // Add ponudas linked to user's ponudas to relevantPonude
                        ostalePonude.forEach(ponuda => {
                            const isLinkedToUser = userPonude.some(userPonuda => userPonuda.id === ponuda.parentPonudaId);
        
                            // If linked to a user, add to relevantPonude
                            if (isLinkedToUser) {
                                relevantPonude.push(ponuda);
                            }
                        });
        
                        console.log("Relevant Ponude: ", relevantPonude);
                    }
        
                    // Map ponude into dropdown options
                    const options = relevantPonude
                        .map(p => `<option value="${p.id}">Ponuda ${p.id} - ${p.tekst || 'No Text'}</option>`)
                        .join('');
        
                    interesovanjaDetalji.innerHTML = `
                        <label for="tekst-ponude">Tekst ponude:</label>
                        <textarea id="tekst-ponude" name="tekst" required></textarea>
                        <label for="cijena-ponude">Cijena ponude:</label>
                        <input type="number" id="cijena-ponude" name="ponudaCijene" required>
                        <label for="datum-ponude">Datum ponude:</label>
                        <input type="date" id="datum-ponude" name="datumPonude" required>
                        <label for="id-vezane-ponude">ID vezane ponude:</label>
                        <select id="id-vezane-ponude" name="idVezanePonude" ${relevantPonude.length === 0 ? 'disabled' : ''}>
                            <option value="">None</option>
                            ${options}
                        </select>
                        <label for="odbijena-ponuda">Odbijena ponuda:</label>
                        <input type="checkbox" id="odbijena-ponuda" name="odbijenaPonuda">
                    `;
                });
            });
        }
        



    });

    // Initial form state
    tipInteresovanja.dispatchEvent(new Event('change'));

    // Handle form submission
    posaljiInteresovanje.addEventListener('click', function () {
        const selectedTip = tipInteresovanja.value;
        console.log(selectedTip);
        if (selectedTip === 'upit') {
            const tekst = document.getElementById('tekst-upita').value;

            console.log(tekst);
            PoziviAjax.postUpit(nekretninaId, tekst, function (error, response) {
                if (error) {
                    console.log("error");
                    console.error('Error sending upit:', error);
                } else {
                    alert('Upit successfully sent!');
                    location.reload();
                }
            });
        } else if (selectedTip === 'zahtjev') {
            const tekst = document.getElementById('tekst-zahtjeva').value;
            const trazeniDatum = document.getElementById('trazeni-datum').value;

            PoziviAjax.postZahtjev(nekretninaId, { tekst, trazeniDatum }, function (error, response) {
                if (error) {
                    console.error('Error sending zahtjev:', error);
                } else {
                    alert('Zahtjev successfully sent!');
                    location.reload();
                }
            });

        } else if (selectedTip === 'ponuda') {
            const tekst = document.getElementById('tekst-ponude').value;
            const ponudaCijene = document.getElementById('cijena-ponude').value;
            const datumPonude = document.getElementById('datum-ponude').value;
            const idVezanePonude = document.getElementById('id-vezane-ponude').value || null; // Default to null if no related offer is selected
            const odbijenaPonuda = document.getElementById('odbijena-ponuda').checked;

            const ponudaData = {
                tekst,
                ponudaCijene: parseFloat(ponudaCijene), // Ensure it's a number
                datumPonude,
                idVezanePonude: idVezanePonude ? parseInt(idVezanePonude) : null, // Ensure it's null or an integer
                odbijenaPonuda,
            };

            PoziviAjax.postPonuda(nekretninaId, tekst, ponudaCijene, datumPonude, idVezanePonude, odbijenaPonuda, function (error, response) {
                if (error) {
                    //console.error('Error sending ponuda:', error);
                    // Check if the error response has a detailed message
            const errorMessage = error.greska || 'Error sending ponuda';
            console.error('Error:', errorMessage);
            alert(`Error: ${errorMessage}`);
                } else {
                    alert('Ponuda successfully sent!');
                    location.reload();
                }
            });
        }

    });
    function displayInteresovanja(interesovanja) {
        const upitiContainer = document.getElementById('upiti');
        upitiContainer.innerHTML = ''; // Clear existing upiti
        
        interesovanja.forEach(interes => {
            const interesElement = document.createElement('div');
            interesElement.className = 'interes';
    
            // Display the common fields
            interesElement.innerHTML = `<p><strong>ID ${interes.id}:</strong></p>`;
    
            if (interes instanceof Upit) {
                interesElement.innerHTML += `
                    <p><strong>Korisnik ID ${interes.korisnik_id}:</strong></p>
                    <p>${interes.tekst_upita}</p>
                `;
            } else if (interes instanceof Ponuda) {
                interesElement.innerHTML += `
                    <p>${interes.tekst}</p>
                    <p>Status: ${interes.status === 'odobrena' ? 'Odobrena' : 'Odbijena'}</p>
                `;
            } else if (interes instanceof Zahtjev) {
                interesElement.innerHTML += `
                    <p>${interes.tekst}</p>
                    <p>Datum: ${new Date(interes.datum).toLocaleDateString()}</p>
                    <p>Status: ${interes.status}</p>
                `;
            }
    
            upitiContainer.appendChild(interesElement);
        });
    }
    

    function initializeCarousel() {
        const carousel = postaviCarousel(document.getElementById('upiti'), currentUpiti);
        if (carousel) {
            document.getElementById('carousel-left').addEventListener('click', function () {
                currentIndex = (currentIndex - 1 + currentUpiti.length) % currentUpiti.length;
                displayInteresovanja([currentUpiti[currentIndex]]);
            });
            document.getElementById('carousel-right').addEventListener('click', function () {
                    currentIndex = (currentIndex + 1) % currentUpiti.length;
                    displayInteresovanja([currentUpiti[currentIndex]]);
                
            });
        }
    }

    PoziviAjax.getNekretnina(nekretninaId, function (error, nekretnina) {
        if (error) {
            console.error('Error fetching property details:', error);
            return;
        }

        PoziviAjax.getInteresovanja(nekretninaId, function (error, upiti) {
            if (error) {
                console.error('Error fetching upiti:', error);
                return;
            }

        const osnovno = document.getElementById('osnovno');
        osnovno.innerHTML = `
            <img src="../resources/${nekretnina.id}.jpg" alt="Nekretnina">
            <p><strong>Naziv:</strong> ${nekretnina.naziv}</p>
            <p><strong>Kvadratura:</strong> ${nekretnina.kvadratura} m²</p>
            <p><strong>Cijena:</strong> ${nekretnina.cijena} KM</p>
        `;

        const detalji = document.getElementById('detalji');
        detalji.innerHTML = `
            <div id="kolona1">
                <p><strong>Tip grijanja:</strong> ${nekretnina.tip_grijanja}</p>
                <p><strong>Lokacija:</strong> <a href="#" id="lokacija-link">${nekretnina.lokacija}</a></p>
            </div>
            <div id="kolona2">
                <p><strong>Godina izgradnje:</strong> ${nekretnina.godina_izgradnje}</p>
                <p><strong>Datum objave oglasa:</strong> ${nekretnina.datum_objave}</p>
            </div>
            <div id="opis">
                <p><strong>Opis:</strong> ${nekretnina.opis}</p>
            </div>
        `;

        currentUpiti = upiti; // Get the initial upiti
        initializeCarousel();
        if (currentUpiti.length > 0) {
            displayInteresovanja([currentUpiti[currentIndex]]);
        } else {
            displayInteresovanja([]);
        }


        document.getElementById('lokacija-link').addEventListener('click', function (event) {
            event.preventDefault();
            const lokacija = nekretnina.lokacija;
            window.location.href = `nekretnine.html?lokacija=${encodeURIComponent(lokacija)}`;
        });
    });
});
});


/*
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const nekretninaId = urlParams.get('id');

    if (!nekretninaId) {
        console.error('No property ID provided');
        return;
    }

    const interesovanjaDetalji = document.getElementById('interesovanja-detalji');
    const tipInteresovanja = document.getElementById('tip-interesovanja');
    const posaljiInteresovanje = document.getElementById('posalji-interesovanje');

    // Event listener for changing the type of interest
    tipInteresovanja.addEventListener('change', function () {
        const selectedTip = tipInteresovanja.value;

        if (selectedTip === 'upit') {
            interesovanjaDetalji.innerHTML = `
                <label for="tekst-upita">Tekst upita:</label>
                <textarea id="tekst-upita" name="tekst" required></textarea>
            `;
        } else if (selectedTip === 'zahtjev') {
            interesovanjaDetalji.innerHTML = `
                <label for="tekst-zahtjeva">Tekst zahtjeva:</label>
                <textarea id="tekst-zahtjeva" name="tekst" required></textarea>
                <label for="trazeni-datum">Traženi datum:</label>
                <input type="date" id="trazeni-datum" name="trazeniDatum" required>
            `;
        } else if (selectedTip === 'ponuda') {
            // Load ponude for dropdown
            PoziviAjax.getKorisnik(function (error, korisnik) {
                if (error) {
                    console.error('Error fetching korisnik:', error);
                    return;
                }

                PoziviAjax.getPonudeZaNekretninu(nekretninaId, function (error, ponude) {
                    if (error) {
                        console.error('Error fetching ponude:', error);
                        return;
                    }

                    const relevantPonude = korisnik.admin
                        ? ponude // Admin sees all offers
                        : ponude.filter(p => p.korisnikId === korisnik.id); // User sees only their offers

                    const options = relevantPonude.map(p => `<option value="${p.id}">Ponuda ${p.id}</option>`).join('');

                    interesovanjaDetalji.innerHTML = `
                        <label for="tekst-ponude">Tekst ponude:</label>
                        <textarea id="tekst-ponude" name="tekst" required></textarea>
                        <label for="cijena-ponude">Cijena ponude:</label>
                        <input type="number" id="cijena-ponude" name="ponudaCijene" required>
                        <label for="id-vezane-ponude">ID vezane ponude:</label>
                        <select id="id-vezane-ponude" name="idVezanePonude" ${relevantPonude.length === 0 ? 'disabled' : ''}>
                            ${options}
                        </select>
                    `;
                });
            });
        }
    });

    // Initial form state
    tipInteresovanja.dispatchEvent(new Event('change'));

    // Handle form submission
    posaljiInteresovanje.addEventListener('click', function () {
        const selectedTip = tipInteresovanja.value;

        if (selectedTip === 'upit') {
            const tekst = document.getElementById('tekst-upita').value;

            PoziviAjax.postUpit(nekretninaId, { tekst }, function (error, response) {
                if (error) {
                    console.error('Error sending upit:', error);
                } else {
                    alert('Upit successfully sent!');
                    location.reload();
                }
            });
        } else if (selectedTip === 'zahtjev') {
            const tekst = document.getElementById('tekst-zahtjeva').value;
            const trazeniDatum = document.getElementById('trazeni-datum').value;

            PoziviAjax.postZahtjev(nekretninaId, { tekst, trazeniDatum }, function (error, response) {
                if (error) {
                    console.error('Error sending zahtjev:', error);
                } else {
                    alert('Zahtjev successfully sent!');
                    location.reload();
                }
            });
        } else if (selectedTip === 'ponuda') {
            const tekst = document.getElementById('tekst-ponude').value;
            const ponudaCijene = document.getElementById('cijena-ponude').value;
            const idVezanePonude = document.getElementById('id-vezane-ponude').value;

            PoziviAjax.postPonuda(nekretninaId, { tekst, ponudaCijene, idVezanePonude }, function (error, response) {
                if (error) {
                    console.error('Error sending ponuda:', error);
                } else {
                    alert('Ponuda successfully sent!');
                    location.reload();
                }
            });
        }
    });
});*/