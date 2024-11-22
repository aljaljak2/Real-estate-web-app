let StatistikaNekretnina = function () {
    let listaNekretnina = [];
    let listaKorisnika = [];

    // Create an instance of SpisakNekretnina
    const spisakNekretnina = SpisakNekretnina();

    let init = function (nekretnineData, korisniciData) {
        listaNekretnina = nekretnineData;
        listaKorisnika = korisniciData;

        // Use SpisakNekretnina's init to set up internal functionality
        spisakNekretnina.init(listaNekretnina, listaKorisnika);
    };

    // Use SpisakNekretnina's filtering for average square footage
    let prosjecnaKvadratura = function (kriterij) {
        const filtrirane = spisakNekretnina.filtrirajNekretnine(kriterij);
        if (filtrirane.length === 0) return 0;

        let ukupnaKvadratura = filtrirane.reduce(
            (sum, nekretnina) => sum + nekretnina.kvadratura,
            0
        );
        return ukupnaKvadratura / filtrirane.length;
    };

    // Outlier detection using SpisakNekretnina filtering
    let outlier = function (kriterij, nazivSvojstva) {
        const filtrirane = spisakNekretnina.filtrirajNekretnine(kriterij);
        if (filtrirane.length === 0) return null;

        const srednjaVrijednost =
            filtrirane.reduce((sum, nekretnina) => sum + nekretnina[nazivSvojstva], 0) /
            filtrirane.length;

        let maxDist = -Infinity;
        let outlierNekretnina = null;

        filtrirane.forEach(nekretnina => {
            const dist = Math.abs(nekretnina[nazivSvojstva] - srednjaVrijednost);
            if (dist > maxDist) {
                maxDist = dist;
                outlierNekretnina = nekretnina;
            }
        });

        return outlierNekretnina;
    };

    // My properties logic
    let mojeNekretnine = function (korisnik) {
        return listaNekretnina
            .filter(nekretnina =>
                nekretnina.upiti.some(upit => upit.korisnik_id === korisnik.id)
            )
            .sort((a, b) => b.upiti.length - a.upiti.length);
    };

    // Histogram calculation
    let histogramCijena = function (periodi, rasponiCijena) {
        return periodi
            .map((period, periodIndex) =>
                rasponiCijena.map((raspon, rasponIndex) => {
                    let brojNekretnina = listaNekretnina.filter(nekretnina => {
                        const godinaObjave = new Date(nekretnina.datum_objave).getFullYear();
                        return (
                            godinaObjave >= period.od &&
                            godinaObjave <= period.do &&
                            nekretnina.cijena >= raspon.od &&
                            nekretnina.cijena <= raspon.do
                        );
                    }).length;

                    return {
                        indeksPerioda: periodIndex,
                        indeksRasporedaCijena: rasponIndex,
                        brojNekretnina: brojNekretnina,
                    };
                })
            )
            .flat();
    };

    return {
        init: init,
        prosjecnaKvadratura: prosjecnaKvadratura,
        outlier: outlier,
        mojeNekretnine: mojeNekretnine,
        histogramCijena: histogramCijena,
    };
};
