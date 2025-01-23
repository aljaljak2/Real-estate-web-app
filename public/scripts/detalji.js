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
        }else if (selectedTip === 'zahtjev') {
                const tekst = document.getElementById('tekst-zahtjeva').value;
                const trazeniDatum = document.getElementById('trazeni-datum').value;
            
                PoziviAjax.postZahtjev(nekretninaId, {tekst, trazeniDatum}, function (error, response) {
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
    function displayUpiti(upiti) {
        const upitiContainer = document.getElementById('upiti');
        upitiContainer.innerHTML = ''; // Clear existing upiti
        upiti.forEach(upit => {
            const upitElement = document.createElement('div');
            upitElement.className = 'upit';
            upitElement.innerHTML = `
                <p><strong>Korisnik ID ${upit.korisnik_id}:</strong></p>
                <p>${upit.tekst_upita}</p>
            `;
            upitiContainer.appendChild(upitElement);
        });
    }
    let jednom=false;
    function loadNextUpiti(callback) {
        if (allUpitiLoaded) return;

        PoziviAjax.getNextUpiti(nekretninaId, currentPage, function (error, nextUpiti) {
            if (error) {
                console.error('Error fetching next upiti:', error);
                return;
            }

            if (nextUpiti.length < 3) {

                allUpitiLoaded = true;
                if (jednom==false){
                    jednom=true;
                }else{
                    return;
                }
                   
                
            }else if (nextUpiti.length ===3){
               PoziviAjax.getNextUpiti(nekretninaId, currentPage+1, function (error, nextUpiti) {
                    if (error) {
                        allUpitiLoaded = true;
                        return;
                    }
               });
            }

            currentUpiti = currentUpiti.concat(nextUpiti);
            
            currentPage++;
            if (callback) callback();
        });
    }

    function initializeCarousel() {
        const carousel = postaviCarousel(document.getElementById('upiti'), currentUpiti, loadNextUpiti);
        if (carousel) {
            document.getElementById('carousel-left').addEventListener('click', function () {
                currentIndex = (currentIndex - 1 + currentUpiti.length) % currentUpiti.length;
                displayUpiti([currentUpiti[currentIndex]]);
            });
            document.getElementById('carousel-right').addEventListener('click', function () {
                if (currentIndex === currentUpiti.length - 1 && !allUpitiLoaded) {
                    loadNextUpiti(function () {
                        currentIndex = (currentIndex + 1) % currentUpiti.length;
                        displayUpiti([currentUpiti[currentIndex]]);
                    });
                } else {
                    currentIndex = (currentIndex + 1) % currentUpiti.length;
                    displayUpiti([currentUpiti[currentIndex]]);
                }
            });
        }
    }

    PoziviAjax.getNekretnina(nekretninaId, function (error, nekretnina) {
        if (error) {
            console.error('Error fetching property details:', error);
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

        currentUpiti = nekretnina.upiti; // Get the initial upiti
        initializeCarousel();
        if (currentUpiti.length > 0) {
            displayUpiti([currentUpiti[currentIndex]]);
        } else {
            displayUpiti([]);
        }
        

        document.getElementById('lokacija-link').addEventListener('click', function (event) {
            event.preventDefault();
            const lokacija = nekretnina.lokacija;
            window.location.href = `nekretnine.html?lokacija=${encodeURIComponent(lokacija)}`;
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