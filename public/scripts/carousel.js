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
        glavniElement.innerHTML = sviElementi[indeks].outerHTML;
    }

    function fnLijevo() {
        indeks = (indeks - 1 + sviElementi.length) % sviElementi.length;
        azurirajPrikaz();
    }

    function fnDesno() {
        indeks = (indeks + 1) % sviElementi.length;
        azurirajPrikaz();
       /* if (indeks === sviElementi.length - 1 && typeof loadNextUpiti === 'function') {
            loadNextUpiti();
        }*/
    }

    azurirajPrikaz();

    return { fnLijevo, fnDesno };
}