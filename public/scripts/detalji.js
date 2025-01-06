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