function postaviCarousel(glavniElement, sviElementi, indeks = 0) {
    if (
        !glavniElement ||
        !sviElementi ||
        sviElementi.length === 0 ||
        typeof indeks !== "number" ||
        indeks < 0 ||
        indeks >= sviElementi.length
    ) {
        return null;
    }

    
    function azurirajPrikaz() {
        sviElementi.forEach((element, index) => {
            element.style.display = 'none';
        });
        sviElementi[indeks].style.display = 'block';
    }

    
    function fnLijevo() {
        indeks = (indeks - 1 + sviElementi.length) % sviElementi.length;
        azurirajPrikaz();
    }

    
    function fnDesno() {
        indeks = (indeks + 1) % sviElementi.length;
        azurirajPrikaz();
    }

   
    azurirajPrikaz();

    return { fnLijevo, fnDesno };
}
