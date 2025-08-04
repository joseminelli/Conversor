// /js/common.js
document.addEventListener("DOMContentLoaded", () => {
  function getBasePath() {
    return window.location.hostname.includes("github.io") ? "/Conversor" : "";
  }

  const basePath = getBasePath();

  const templatePath = window.location.pathname.includes("/pages/")
    ? "../templates/header.html"
    : "./templates/header.html";

  fetch(templatePath)
    .then((response) => response.text())
    .then((data) => {
      const headerPlaceholder = document.getElementById("header-placeholder");
      if (headerPlaceholder) {
        headerPlaceholder.innerHTML = data;

        // ✅ Corrige os hrefs após o header ser carregado
        document.querySelectorAll(".main-nav a.nav-link").forEach((link) => {
          const href = link.getAttribute("href");

          if (href.startsWith("/")) {
            link.setAttribute("href", basePath + href);
          } else if (!href.startsWith("http")) {
            link.setAttribute("href", basePath + "/" + href);
          }
        });

        // Só chama essas funções depois de os links estarem ajustados
        setupNavigation();
        setupDropdowns();
      }
    });

  // Marca o link/seção ativa na navegação
  function setupNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".main-nav .nav-link");
    navLinks.forEach((link) => {
      if (link.getAttribute("href") === currentPath) {
        link.classList.add("active");
        const dropdownTrigger = link
          .closest(".dropdown")
          ?.querySelector(".nav-trigger");
        if (dropdownTrigger) {
          dropdownTrigger.classList.add("section-active");
        }
      }
    });
  }

  // Controla a abertura e fechamento dos menus
  function setupDropdowns() {
    const dropdownTriggers = document.querySelectorAll(
      ".dropdown .nav-trigger"
    );

    dropdownTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();

        const menu = trigger.nextElementSibling;
        const isAlreadyOpen = menu.classList.contains("show");

        closeAllDropdowns();

        if (!isAlreadyOpen) {
          menu.classList.add("show");
        }
      });
    });

    window.addEventListener("click", () => {
      closeAllDropdowns();
    });
  }

  function closeAllDropdowns() {
    document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
      menu.classList.remove("show");
    });
  }
});
