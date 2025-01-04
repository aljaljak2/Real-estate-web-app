document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const nekretninaId = urlParams.get('id');

    if (!nekretninaId) {
        console.error('No property ID provided');
        return;
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

        const upiti = document.getElementById('upiti');
        const upitiList = [];
        nekretnina.upiti.forEach(upit => {
            const upitElement = document.createElement('div');
            upitElement.className = 'upit';
            upitElement.innerHTML = `
                <p><strong>Korisnik ID ${upit.korisnik_id}:</strong></p>
                <p>${upit.tekst_upita}</p>
            `;
            upiti.appendChild(upitElement);
            upitiList.push(upitElement);
        });

        document.getElementById('lokacija-link').addEventListener('click', function (event) {
            event.preventDefault();
            const lokacija = nekretnina.lokacija;
            window.location.href = `nekretnine.html?lokacija=${encodeURIComponent(lokacija)}`;
        });

        // Initialize the carousel
        if (upitiList.length > 0) {
            const carousel = postaviCarousel(upiti, upitiList);
            if (carousel) {
                document.getElementById('carousel-left').addEventListener('click', carousel.fnLijevo);
                document.getElementById('carousel-right').addEventListener('click', carousel.fnDesno);
            }
        }
    });
});