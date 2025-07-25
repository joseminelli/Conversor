// /js/common.js
document.addEventListener("DOMContentLoaded", () => {
    // Carrega o header reutilizável
    const templatePath = window.location.pathname.includes("/pages/")
        ? "../templates/header.html"
        : "./templates/header.html";

    fetch(templatePath)
        .then((response) => response.text())
        .then((data) => {
            const headerPlaceholder = document.getElementById("header-placeholder");
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = data;
                // Executa as funções de navegação APÓS o header ser carregado
                setupNavigation();
                setupDropdowns();
            }
        });

    // Marca o link/seção ativa na navegação
    function setupNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll(".main-nav .nav-link");
        navLinks.forEach((link) => {
            // Se o href do link for igual ao caminho da página atual...
            if (link.getAttribute("href") === currentPath) {
                // Adiciona 'active' ao próprio link <a>
                link.classList.add("active");
                // Procura o gatilho .nav-trigger pai e o marca como seção ativa
                const dropdownTrigger = link.closest(".dropdown")?.querySelector(".nav-trigger");
                if (dropdownTrigger) {
                    dropdownTrigger.classList.add("section-active"); 
                }
            }
        });
    }

    // Controla a abertura e fechamento dos menus
    function setupDropdowns() {
        const dropdownTriggers = document.querySelectorAll(".dropdown .nav-trigger");

        dropdownTriggers.forEach(trigger => {
            trigger.addEventListener("click", (e) => {
                e.stopPropagation(); // Impede que o clique se propague e feche o menu imediatamente

                const menu = trigger.nextElementSibling; // Pega o elemento .dropdown-menu
                const isAlreadyOpen = menu.classList.contains('show');

                // Primeiro, fecha todos os outros menus que possam estar abertos
                closeAllDropdowns();

                // Se o menu clicado não estava aberto, abre ele
                if (!isAlreadyOpen) {
                    menu.classList.add('show');
                }
                // Se já estava aberto, a função closeAllDropdowns() já o fechou.
            });
        });

        // Evento global para fechar os menus ao clicar em qualquer lugar fora deles
        window.addEventListener("click", () => {
            closeAllDropdowns();
        });
    }

    // Função auxiliar para fechar todos os menus que tiverem a classe .show
    function closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});