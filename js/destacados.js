
(() => {
  const container = document.getElementById("featured-homes");
  if (!container) return;

  let slides = [];
  let current = 0;
  let timer = null;

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  const money = value => new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

  function imagePath(property) {
    return property.portada || "";
  }

  function locationText(property) {
    return [
      property.colonia,
      property.municipio,
      property.estadoUbicacion
    ].filter(Boolean).join(", ");
  }

  function description(property) {
    return property.descripcionBreve ||
      property.descripcion ||
      property.titulo ||
      "Conoce esta propiedad.";
  }

  function render() {
    if (!slides.length) {
      container.innerHTML =
        '<p class="muted">Próximamente encontrarás aquí nuestros inmuebles destacados.</p>';
      return;
    }

    const property = slides[current];
    const image = imagePath(property);
    const title = escapeHTML(property.titulo || "Casa habitación");
    const location = escapeHTML(locationText(property));
    const summary = escapeHTML(description(property));
    const price = money(property.precio);
    const detailURL = `casa.html?id=${encodeURIComponent(property.id)}`;

    container.innerHTML = `
      <div class="featured-carousel" aria-roledescription="carrusel">
        <article class="featured-slide">
          <div class="featured-slide-image">
            ${image
              ? `<img src="${escapeHTML(image)}" alt="${title}" loading="eager">`
              : '<div class="featured-no-image">CUENCA INMOBILIARIA</div>'}
          </div>

          <div class="featured-slide-content">
            <p class="eyebrow">INMUEBLE DESTACADO</p>
            <h3>${title}</h3>
            ${location ? `<p class="featured-location">${location}</p>` : ""}
            <p class="featured-description">${summary}</p>
            <p class="featured-price">${price}</p>
            <a class="btn btn-dark" href="${detailURL}">Ver inmueble</a>
          </div>
        </article>

        ${slides.length > 1 ? `
          <div class="featured-controls">
            <button type="button" class="featured-arrow" data-direction="-1" aria-label="Inmueble anterior">‹</button>
            <div class="featured-dots" aria-label="Seleccionar inmueble">
              ${slides.map((_, index) => `
                <button type="button"
                  class="featured-dot ${index === current ? "active" : ""}"
                  data-index="${index}"
                  aria-label="Mostrar inmueble ${index + 1}"
                  aria-current="${index === current ? "true" : "false"}"></button>
              `).join("")}
            </div>
            <button type="button" class="featured-arrow" data-direction="1" aria-label="Inmueble siguiente">›</button>
          </div>
        ` : ""}
      </div>
    `;

    container.querySelectorAll("[data-direction]").forEach(button => {
      button.addEventListener("click", () => {
        move(Number(button.dataset.direction));
        restart();
      });
    });

    container.querySelectorAll("[data-index]").forEach(button => {
      button.addEventListener("click", () => {
        current = Number(button.dataset.index);
        render();
        restart();
      });
    });
  }

  function move(direction) {
    if (slides.length < 2) return;
    current = (current + direction + slides.length) % slides.length;
    render();
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function start() {
    stop();
    if (slides.length < 2) return;

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timer = setInterval(() => move(1), 6000);
    }
  }

  function restart() {
    start();
  }

  async function init() {
    try {
      const homes = await loadHomes();

      slides = homes.filter(property =>
        property.estado === "publicada" &&
        property.destacado === true
      );

      render();
      start();

      container.addEventListener("mouseenter", stop);
      container.addEventListener("mouseleave", start);
      container.addEventListener("focusin", stop);
      container.addEventListener("focusout", start);
      container.addEventListener("touchstart", stop, { passive: true });
      container.addEventListener("touchend", start, { passive: true });

    } catch (error) {
      console.error("Error al cargar inmuebles destacados:", error);
      container.innerHTML =
        '<p class="muted">No fue posible cargar los inmuebles destacados.</p>';
    }
  }

  init();
})();
