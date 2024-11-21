document.addEventListener('DOMContentLoaded', () => {
    const upitiContainer = document.getElementById('upiti'); 
    const leftButton = document.getElementById('carouselLeft'); 
    const rightButton = document.getElementById('carouselRight'); 

    
    const sviElementi = Array.from(upitiContainer.querySelectorAll('.upit'));

    let carousel = null; 

   
    const updateButtonsAndEvents = () => {
        const screenWidth = window.innerWidth;

        if (screenWidth <= 599) {
           
            if (!carousel) {
                carousel = postaviCarousel(upitiContainer, sviElementi); 
            }

           
            sviElementi.forEach((element, index) => {
                element.style.display = (index === 0) ? 'block' : 'none';
            });

            leftButton.style.display = 'block'; 
            rightButton.style.display = 'block';

          
            leftButton.addEventListener('click', carousel.fnLijevo);
            rightButton.addEventListener('click', carousel.fnDesno);
        } else {
            
            if (carousel) {
                leftButton.style.display = 'none'; 
                rightButton.style.display = 'none';

                
                leftButton.removeEventListener('click', carousel.fnLijevo);
                rightButton.removeEventListener('click', carousel.fnDesno);

                carousel = null; 
            }

            
            sviElementi.forEach(element => {
                element.style.display = 'block'; 
            });
        }
    };

    
    window.addEventListener('resize', updateButtonsAndEvents);

    
    updateButtonsAndEvents(); 
});
