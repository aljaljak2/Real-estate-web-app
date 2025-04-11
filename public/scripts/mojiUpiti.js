document.addEventListener('DOMContentLoaded', function () {
    PoziviAjax.getMojiUpiti(function (error, upiti) {
        if (error) {
            console.error('Error fetching user queries:', error);
            return;
        }

        const upitiContainer = document.getElementById('upiti-container');
        if (upiti.length === 0) {
            upitiContainer.innerHTML = '<p>Nema upita.</p>';
            return;
        }

        upiti.forEach(upit => {
            const upitElement = document.createElement('div');
            upitElement.className = 'upit';
            upitElement.innerHTML = `
                <p>ID Nekretnine: ${upit.id_nekretnine}</p>
                <p>Tekst Upita: ${upit.tekst_upita}</p>
            `;
            upitiContainer.appendChild(upitElement);
        });
    });
});