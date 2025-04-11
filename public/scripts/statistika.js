const listaNekretnina = [{
    id: 1,
    tip_nekretnine: "Stan",
    naziv: "Useljiv stan Sarajevo",
    kvadratura: 58,
    cijena: 232000,
    tip_grijanja: "plin",
    lokacija: "Novo Sarajevo",
    godina_izgradnje: 2019,
    datum_objave: "01.10.2023.",
    opis: "Sociis natoque penatibus.",
    upiti: [{
        korisnik_id: 1,
        tekst_upita: "Nullam eu pede mollis pretium."
    },
    {
        korisnik_id: 2,
        tekst_upita: "Phasellus viverra nulla."
    }]
},{
    id: 1,
    tip_nekretnine: "Stan",
    naziv: "Useljiv stan Sarajevo",
    kvadratura: 58,
    cijena: 32000,
    tip_grijanja: "plin",
    lokacija: "Novo Sarajevo",
    godina_izgradnje: 2019,
    datum_objave: "01.10.2009.",
    opis: "Sociis natoque penatibus.",
    upiti: [{
        korisnik_id: 1,
        tekst_upita: "Nullam eu pede mollis pretium."
    },
    {
        korisnik_id: 2,
        tekst_upita: "Phasellus viverra nulla."
    }]
},{
    id: 1,
    tip_nekretnine: "Stan",
    naziv: "Useljiv stan Sarajevo",
    kvadratura: 58,
    cijena: 232000,
    tip_grijanja: "plin",
    lokacija: "Novo Sarajevo",
    godina_izgradnje: 2019,
    datum_objave: "01.10.2003.",
    opis: "Sociis natoque penatibus.",
    upiti: [{
        korisnik_id: 1,
        tekst_upita: "Nullam eu pede mollis pretium."
    },
    {
        korisnik_id: 2,
        tekst_upita: "Phasellus viverra nulla."
    }]
},
{
    id: 2,
    tip_nekretnine: "Kuća",
    naziv: "Mali poslovni prostor",
    kvadratura: 20,
    cijena: 70000,
    tip_grijanja: "struja",
    lokacija: "Centar",
    godina_izgradnje: 2005,
    datum_objave: "20.08.2023.",
    opis: "Magnis dis parturient montes.",
    upiti: [{
        korisnik_id: 2,
        tekst_upita: "Integer tincidunt."
    }
    ]
},
{
    id: 3,
    tip_nekretnine: "Kuća",
    naziv: "Mali poslovni prostor",
    kvadratura: 20,
    cijena: 70000,
    tip_grijanja: "struja",
    lokacija: "Centar",
    godina_izgradnje: 2005,
    datum_objave: "20.08.2023.",
    opis: "Magnis dis parturient montes.",
    upiti: [{
        korisnik_id: 2,
        tekst_upita: "Integer tincidunt."
    }
    ]
},
{
    id: 4,
    tip_nekretnine: "Kuća",
    naziv: "Mali poslovni prostor",
    kvadratura: 20,
    cijena: 70000,
    tip_grijanja: "struja",
    lokacija: "Centar",
    godina_izgradnje: 2005,
    datum_objave: "20.08.2023.",
    opis: "Magnis dis parturient montes.",
    upiti: [{
        korisnik_id: 2,
        tekst_upita: "Integer tincidunt."
    }
    ]
}]

const listaKorisnika = [{
    id: 1,
    ime: "Neko",
    prezime: "Nekic",
    username: "username1",
},
{
    id: 2,
    ime: "Neko2",
    prezime: "Nekic2",
    username: "username2",
}]


let statistikaNekretnina = StatistikaNekretnina();
    statistikaNekretnina.init(listaNekretnina, listaKorisnika);
function izracunajProsjecnuKvadraturu() {
    
    const kriterijKey = document.getElementById("kriterij_pk").value;
    const kriterijValue = document.getElementById("vrijednost_pk").value;

    if (!kriterijValue) {
        alert("Unesite vrijednost kriterija!");
        return;
    }

   
    const kriterij = { [kriterijKey]: kriterijValue };

    
    let prosjecnaKvadratura = statistikaNekretnina.prosjecnaKvadratura(kriterij);

   
    const resultElement = document.getElementById("result-text-pk");
    resultElement.textContent = `Prosječna kvadratura: ${
        prosjecnaKvadratura ? prosjecnaKvadratura.toFixed(2) + " m²" : "Nema podataka za zadati kriterij"
    }`;
}

function izracunajOutlier() {
   
    const kriterijKey = document.getElementById("kriterij_ol").value;
    const kriterijValue = document.getElementById("vrijednost_ol").value;
    const nazivSvojstva = document.getElementById("nazivSvojstva").value;

    
    if (!kriterijValue) {
        alert("Unesite vrijednost kriterija!");
        return;
    }

    
    const kriterij = { [kriterijKey]: kriterijValue };

    try {
        
        const outlierNekretnina = statistikaNekretnina.outlier(kriterij, nazivSvojstva);

        
        const resultElement = document.getElementById("result-text-outlier");
        if (outlierNekretnina) {        
            const formattedResult = formatObject(outlierNekretnina, 0);
            resultElement.innerHTML = formattedResult.trim(); 
        } else {
            resultElement.textContent = "Nema podataka za zadati kriterij i svojstvo.";
        }
    } catch (error) {
        
        alert(error.message);
    }
}


function formatObject(obj, indentLevel) {
    const indent = "  ".repeat(indentLevel); 
    let formattedString = "";

    for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
            formattedString += `${indent}${key}:<br>`;
            value.forEach((item, index) => {
                formattedString += `${indent}  [${index + 1}]:<br>${formatObject(item, indentLevel + 2)}`;
            });
        } else if (typeof value === "object" && value !== null) {
            formattedString += `${indent}${key}:<br>${formatObject(value, indentLevel + 1)}`;
        } else {
            formattedString += `${indent}${key}: ${value}<br>`;
        }
    }

    return formattedString;
}

function izracunajMojeNekretnine() {
    
    const korisnikId = parseInt(document.getElementById("korisnik_id").value);
    const korisnikIme = document.getElementById("korisnik_ime").value;
    const korisnikPrezime = document.getElementById("korisnik_prezime").value;
    const korisnikUsername = document.getElementById("korisnik_username").value;

   
    if (!korisnikId || !korisnikIme || !korisnikPrezime || !korisnikUsername) {
        alert("Unesite sve podatke korisnika!");
        return;
    }

    
    const korisnik = {
        id: korisnikId,
        ime: korisnikIme,
        prezime: korisnikPrezime,
        username: korisnikUsername
    };
    
    
    
    const nekretnine = statistikaNekretnina.mojeNekretnine(korisnik);

   
    const resultElement = document.getElementById("result-text-mn");
    if (nekretnine.length > 0) {
        resultElement.innerHTML = nekretnine.map(nekretnina => formatObject(nekretnina, 0)).join('<br><br>');
    } else {
        resultElement.textContent = "Nema nekretnina za ovog korisnika.";
    }
}

let periodi = [];
let rasponiCijena = [];

function dodajPeriod() {
    const periodiContainer = document.getElementById('periodi-container');
    
    
    const index = periodiContainer.children.length;
    
    const div = document.createElement('div');
    
    div.innerHTML = `
        <input type="number" id="period-${index}-od" placeholder="Od godine">
        <input type="number" id="period-${index}-do" placeholder="Do godine">
    `;
    
    periodiContainer.appendChild(div);
}


function dodajRasponCijena() {
    const rasponiContainer = document.getElementById('rasponi-cijena-container');
    
   
    const index = rasponiContainer.children.length;
    
    const div = document.createElement('div');
    
    div.innerHTML = `
        <input type="number" id="raspon-${index}-od" placeholder="Min cijena">
        <input type="number" id="raspon-${index}-do" placeholder="Max cijena">
    `;
    
    rasponiContainer.appendChild(div);
}


function prikupljanjePodataka() {
    periodi = [];
    rasponiCijena = [];

    
    const periodiDivs = document.querySelectorAll('#periodi-container > div');
    periodiDivs.forEach((div, index) => {
        
        const odInput = document.getElementById(`period-${index}-od`);
        const doInput = document.getElementById(`period-${index}-do`);

        if (odInput && doInput) { 
            const od = parseInt(odInput.value);
            const do_ = parseInt(doInput.value);

            if (od && do_) {
                periodi.push({ od, do: do_ });
            }
        } else {
            console.error(`Inputs not found for period index: ${index}`);
        }
    });

    
    const rasponiDivs = document.querySelectorAll('#rasponi-cijena-container > div');
    rasponiDivs.forEach((div, index) => {
      
        const odInput = document.getElementById(`raspon-${index}-od`);
        const doInput = document.getElementById(`raspon-${index}-do`);

        if (odInput && doInput) { 
            const od = parseInt(odInput.value);
            const do_ = parseInt(doInput.value);

            if (od && do_) {
                rasponiCijena.push({ od, do: do_ });
            }
        } else {
            console.error(`Inputs not found for price range index: ${index}`);
        }
    });
}

function iscrtajHistogram() {
    prikupljanjePodataka();

    const ctx = document.getElementById('histogramChart').getContext('2d');

   
    if (window.histogramChart instanceof Chart) {
        window.histogramChart.destroy();
    }

    
    const chartData = statistikaNekretnina.histogramCijena(periodi, rasponiCijena);

   
    const labels = rasponiCijena.map(raspon => `${raspon.od} - ${raspon.do}`);

    
    const kontrastneBoje = [
        'rgba(255, 99, 132, 0.6)', // Jarko crvena
        'rgba(54, 162, 235, 0.6)', // Jarko plava
        'rgba(255, 206, 86, 0.6)', // Žuta
        'rgba(75, 192, 192, 0.6)', // Svetlo tirkizna
        'rgba(153, 102, 255, 0.6)' // Ljubičasta
    ];
    const kontrastneBojeIvice = kontrastneBoje.map(boja => boja.replace('0.6', '1')); 

    
    const datasets = periodi.map((period, periodIndex) => {
        const data = rasponiCijena.map((_, rasponIndex) => {
            const match = chartData.find(item => 
                item.indeksPerioda === periodIndex && 
                item.indeksRasporedaCijena === rasponIndex
            );
            return match ? match.brojNekretnina : 0;
        });

        return {
            label: `Period ${period.od}-${period.do}`,
            data: data,
            backgroundColor: kontrastneBoje[periodIndex % kontrastneBoje.length],
            borderColor: kontrastneBojeIvice[periodIndex % kontrastneBojeIvice.length],
            borderWidth: 1
        };
    });

    
    window.histogramChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true, 
                    title: {
                        display: true,
                        text: 'Rasponi cijena'
                    }
                },
                y: {
                    stacked: true, 
                    title: {
                        display: true,
                        text: 'Broj nekretnina'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1 
                    }
                }
            }
        }
    });
}



window.addEventListener('resize', function () {
    if (window.histogramChart instanceof Chart) {
        window.histogramChart.resize();
    }
});




