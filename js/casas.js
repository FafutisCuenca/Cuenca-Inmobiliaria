
(() => {
  const featured = document.getElementById("featured-homes");
  const all = document.getElementById("all-homes");

  const iconPaths = {
    ruler: '<path d="M21.3 8.7 15.3 2.7a1 1 0 0 0-1.4 0L2.7 13.9a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0L21.3 10.1a1 1 0 0 0 0-1.4Z"/><path d="m7.5 10.5 2 2m1-5 2 2m1-5 2 2m-7 9 2 2"/>',
    bed: '<path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 14h18M5 10V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3"/><path d="M3 18v2m18-2v2"/>',
    bath: '<path d="M9 6 7.5 4.5a2.1 2.1 0 0 0-3 3L6 9"/><path d="M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-3Z"/><path d="M7 20v1m10-1v1"/>',
    shower: '<path d="M5 12h14M7 12V8a5 5 0 0 1 10 0v4"/><path d="M7 16v1m5-1v1m5-1v1m-8 3v1m6-1v1"/>',
    car: '<path d="M5 17h14l1-5-2-5H6l-2 5 1 5Z"/><path d="M4 12h16M7 17v2m10-2v2M7 7l1-3h8l1 3"/><circle cx="7.5" cy="14.5" r="1"/><circle cx="16.5" cy="14.5" r="1"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>'
  };

  function icon(name) {
    return `<svg class="property-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.ruler}</svg>`;
  }

  function formatValue(value) {
    if (value === null || value === undefined || value === "") return null;

    const number = Number(value);

    if (!Number.isFinite(number) || number <= 0) return null;

    return new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 2
    }).format(number);
  }

  function cardSpecs(p) {
    const items = [
      ["terreno", p.terreno, "m²", "ruler", "Terreno"],
      ["construccion", p.construccion, "m²", "ruler", "Construcción"],
      ["recamaras", p.recamaras, "", "bed", "Recámaras"],
      ["banos", p.banos, "", "bath", "Baños"],
      ["mediosBanos", p.mediosBanos, "", "shower", "Medios baños"],
      ["estacionamientos", p.estacionamientos, "", "car", "Estacionamientos"],
      ["niveles", p.niveles, "", "layers", "Niveles"]
    ];

    return items
      .map(([key, value, unit, iconName, label]) => {
        const formatted = formatValue(value);
        if (!formatted) return "";

        return `
          <span class="property-spec" title="${label}">
            ${icon(iconName)}
            <span class="property-spec-value">${formatted}${unit ? ` ${unit}` : ""}</span>
            <span class="property-spec-label">${label}</span>
          </span>
        `;
      })
      .filter(Boolean)
      .join("");
  }

  function homeCardWithSpecs(p) {
    const html = homeCard(p);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();

    const card = wrapper.firstElementChild;

    if (!card) return html;

    let meta = card.querySelector(".property-meta");

    if (!meta) {
      meta = document.createElement("div");
      meta.className = "property-meta";

      const info = card.querySelector(".property-info") || card;
      info.appendChild(meta);
    }

    meta.innerHTML = cardSpecs(p);

    return card.outerHTML;
  }

  function render(target, list) {
    if (!target) return;

    target.innerHTML = list.length
      ? list.map(homeCardWithSpecs).join("")
      : '<p class="muted">Por el momento no hay casas publicadas.</p>';
  }

  async function init() {
    try {
      const homes = (await loadHomes()).filter(
        p => p.estado === "publicada"
      );

      if (featured) {
        render(featured, homes.slice(0, 3));
      }

      if (all) {
        const searchInput = document.getElementById("search-text");
        const priceInput = document.getElementById("max-price");
        const bedroomsInput = document.getElementById("bedrooms");

        const update = () => {
          const q = (searchInput?.value || "").toLowerCase().trim();
          const max = Number(priceInput?.value) || Infinity;
          const beds = Number(bedroomsInput?.value) || 0;

          const filtered = homes.filter(p => {
            const text = [
              p.titulo,
              p.descripcion,
              p.colonia,
              p.municipio,
              p.estadoUbicacion
            ].join(" ").toLowerCase();

            return (
              text.includes(q) &&
              Number(p.precio) <= max &&
              Number(p.recamaras || 0) >= beds
            );
          });

          render(all, filtered);
        };

        [searchInput, priceInput, bedroomsInput].forEach(input => {
          if (input) input.addEventListener("input", update);
        });

        update();
      }
    } catch (error) {
      if (featured) {
        featured.innerHTML =
          '<p class="muted">No fue posible cargar el catálogo.</p>';
      }

      if (all) {
        all.innerHTML =
          '<p class="muted">No fue posible cargar el catálogo.</p>';
      }

      console.error("Error al cargar propiedades:", error);
    }
  }

  init();
})();
