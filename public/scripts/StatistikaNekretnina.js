let StatistikaNekretnina = function () {
    let listaNekretnina = [];
    let listaKorisnika = [];

    
    const spisakNekretnina = SpisakNekretnina();

    let init = function (nekretnineData, korisniciData) {
        listaNekretnina = nekretnineData;
        listaKorisnika = korisniciData;

       
        spisakNekretnina.init(listaNekretnina, listaKorisnika);
    };

   
    let prosjecnaKvadratura = function (kriterij) {
        const filtrirane = spisakNekretnina.filtrirajNekretnine(kriterij);
        if (filtrirane.length === 0) return 0;

        let ukupnaKvadratura = filtrirane.reduce(
            (sum, nekretnina) => sum + nekretnina.kvadratura,
            0
        );
        return ukupnaKvadratura / filtrirane.length;
    };

    let outlier = function (kriterij, nazivSvojstva) {
        if (listaNekretnina.length === 0) return null;
        const prvoValidnoSvojstvo = listaNekretnina.find(nekretnina =>
            typeof nekretnina[nazivSvojstva] === 'number'
        );
    
        if (!prvoValidnoSvojstvo) {
            throw new Error(`Svojstvo "${nazivSvojstva}" ne postoji ili nije brojčanog tipa.`);
        }

        const filtrirane = spisakNekretnina.filtrirajNekretnine(kriterij);
        if (filtrirane.length === 0) return null;
    
        const srednjaVrijednost =
            listaNekretnina.reduce((sum, nekretnina) => sum + nekretnina[nazivSvojstva], 0) /
            listaNekretnina.length;
    
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
    

   
    let mojeNekretnine = function (korisnik) {
        return listaNekretnina
            .filter(nekretnina =>
                nekretnina.upiti.some(upit => upit.korisnik_id === korisnik.id)
            )
            .sort((a, b) => b.upiti.length - a.upiti.length);
    };

  
    let histogramCijena = function (periodi, rasponiCijena) {
        return periodi
            .map((period, periodIndex) =>
                rasponiCijena.map((raspon, rasponIndex) => {
                    let brojNekretnina = listaNekretnina.filter(nekretnina => {
                        const datumParts = nekretnina.datum_objave.split('.');
                        const godinaObjave = parseInt(datumParts[2]);
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
