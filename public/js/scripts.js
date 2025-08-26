/*!
* Start Bootstrap - Agency v7.0.12 (https://startbootstrap.com/theme/agency)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-agency/blob/master/LICENSE)
*/
//
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {

    // Navbar shrink function
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink')
        } else {
            navbarCollapsible.classList.add('navbar-shrink')
        }
    };
    
    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // SOLUCIÓN AL PROBLEMA DEL SCROLLSPY
    // Configuración manual mejorada de ScrollSpy
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        // Remover ScrollSpy automático de Bootstrap
        // y implementar uno manual más preciso
        
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('section[id]');
        
        function updateActiveNav() {
            let currentSection = '';
            const scrollY = window.pageYOffset;
            
            // Encontrar la sección visible con mayor precisión
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.offsetHeight;
                
                if(scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                    currentSection = section.getAttribute('id');
                }
            });
            
            // Actualizar clases activas
            navLinks.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href');
                if (href && href.substring(1) === currentSection) {
                    link.classList.add('active');
                }
            });
            
            // Manejar caso especial del home
            if (scrollY < 100) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#page-top') {
                        link.classList.add('active');
                    }
                });
            }
        }
        
        // Actualizar al hacer scroll
        window.addEventListener('scroll', updateActiveNav);
        
        // Actualizar al hacer clic en los links
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // Pequeño delay para asegurar que el scroll haya terminado
                setTimeout(() => {
                    updateActiveNav();
                }, 100);
            });
        });
        
        // Inicializar
        updateActiveNav();
    }

});