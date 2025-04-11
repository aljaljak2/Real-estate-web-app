let SpisakNekretnina = function () {
    //privatni atributi modula
    let listaNekretnina = [];
    let listaKorisnika = [];


    //implementacija metoda
    let init = function (listaNekretnina, listaKorisnika) {
        this.listaNekretnina = listaNekretnina;
        this.listaKorisnika = listaKorisnika;
    }

    let filtrirajNekretnine = function (kriterij) {
        return this.listaNekretnina.filter(nekretnina => {
            // Filtriranje po tipu nekretnine
            if (kriterij.tip_nekretnine && nekretnina.tip_nekretnine !== kriterij.tip_nekretnine) {
                return false;
            }

            // Filtriranje po minimalnoj kvadraturi
            if (kriterij.min_kvadratura && nekretnina.kvadratura < kriterij.min_kvadratura) {
                return false;
            }

            // Filtriranje po maksimalnoj kvadraturi
            if (kriterij.max_kvadratura && nekretnina.kvadratura > kriterij.max_kvadratura) {
                return false;
            }

            // Filtriranje po minimalnoj cijeni
            if (kriterij.min_cijena && nekretnina.cijena < kriterij.min_cijena) {
                return false;
            }

            // Filtriranje po maksimalnoj cijeni
            if (kriterij.max_cijena && nekretnina.cijena > kriterij.max_cijena) {
                return false;
            }

            //dodatna filtriranja

            //tip_grijanja
            if(kriterij.tip_grijanja && nekretnina.tip_grijanja!==kriterij.tip_grijanja){
                return false;
            }
            // godina_izgradnje
        if (kriterij.godina_izgradnje && 
            nekretnina.godina_izgradnje !== parseInt(kriterij.godina_izgradnje)) {
            return false;
        }

        // datum_objave
        if (kriterij.datum_objave) {
            const kriterijDate = parseDateString(kriterij.datum_objave);
            const nekretninaDate = parseDateString(nekretnina.datum_objave);

            if (nekretninaDate.getTime() !== kriterijDate.getTime()) {
                return false;
            }
        }
            return true;
        });
    }

    //dodatna funkcija za parsiranje datuma
    function parseDateString(dateString) {
        const [day, month, year] = dateString.split('.').map(num => parseInt(num));
        return new Date(year, month - 1, day); 
    }

    let ucitajDetaljeNekretnine = function (id) {
        return listaNekretnina.find(nekretnina => nekretnina.id === id) || null;
    }


    return {
        init: init,
        filtrirajNekretnine: filtrirajNekretnine,
        ucitajDetaljeNekretnine: ucitajDetaljeNekretnine
    }
};