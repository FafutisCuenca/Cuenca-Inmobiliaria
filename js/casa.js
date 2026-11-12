
(() => {
  const root = document.getElementById("property-detail");

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
    return `<svg class="detail-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.ruler}</svg>`;
  }

  function formatValue(value) {
    if (value === null || value === undefined || value === "") return null;

    const number = Number(value);

    if (!Number.isFinite(number) || number <= 0) return null;

    return new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 2
    }).format(number);
  }

  function specification(label, value, unit, iconName) {
    const formatted = formatValue(value);

    if (!formatted) return "";

    return `
      <div class="spec">
        ${icon(iconName)}
        <b>${formatted}${unit ? ` ${unit}` : ""}</b>
        <span>${label}</span>
      </div>
    `;
  }

  function specifications(p) {
    return [
      specification("Terreno", p.terreno, "m²", "ruler"),
      specification("Construcción", p.construccion, "m²", "ruler"),
      specification("Recámaras", p.recamaras, "", "bed"),
      specification("Baños", p.banos, "", "bath"),
      specification("Medios baños", p.mediosBanos, "", "shower"),
      specification("Estacionamientos", p.estacionamientos, "", "car"),
      specification("Niveles", p.niveles, "", "layers"),
      specification("Antigüedad", p.antiguedad, "años", "calendar")
    ].filter(Boolean).join("");
  }

  async function init() {
    try {
      const id = new URLSearchParams(location.search).get("id");
      const homes = await loadHomes();

      const p = homes.find(
        x => x.id === id && x.estado === "publicada"
      );

      if (!p) {
        root.innerHTML = `
          <h1>Propiedad no disponible</h1>
          <p>La propiedad solicitada no existe o no está publicada.</p>
          <a class="btn btn-dark" href="casas.html">Volver al catálogo</a>
        `;
        return;
      }

      const imgs = (p.fotos || []).filter(Boolean);
      const spaces = p.espacios || [];

      const locationText = [
        p.direccion,
        p.colonia,
        p.municipio,
        p.estadoUbicacion,
        p.cp
      ].filter(Boolean).join(", ");

      const message =
        `Hola, me interesa recibir información sobre ${p.titulo} (${p.folio}).`;

      root.innerHTML = `
        <p class="eyebrow">${esc(p.folio)} · CASA HABITACIÓN EN VENTA</p>

        <div class="detail-header">
          <div>
            <h1>${esc(p.titulo)}</h1>
            <p class="muted">${esc(locationText)}</p>
          </div>
          <div class="detail-price">${money(p.precio)}</div>
        </div>

        <div class="property-detail-hero">
          <div class="detail-main-photo">
            ${
              p.portada
                ? `<img src="${esc(p.portada)}" alt="Fotografía principal de ${esc(p.titulo)}">`
                : "<div class='property-image'></div>"
            }
          </div>

          <div class="detail-thumbs">
            ${imgs.slice(0, 2).map(x =>
              `<img src="${esc(x)}" alt="Fotografía de la propiedad">`
            ).join("")}
          </div>
        </div>

        ${
          imgs.length > 2
            ? `<div class="gallery-strip">
                ${imgs.slice(2).map(x =>
                  `<img src="${esc(x)}" alt="Fotografía adicional">`
                ).join("")}
              </div>`
            : ""
        }

        <div class="detail-columns">
          <div>
            <section class="detail-section">
              <h2>Descripción</h2>
              <p>${esc(p.descripcion || "Solicita mayores informes sobre esta propiedad.")}</p>
            </section>

            <section class="detail-section">
              <h2>Características</h2>
              <div class="spec-grid">
                ${specifications(p)}
              </div>
            </section>

            ${
              spaces.length
                ? `<section class="detail-section">
                    <h2>Conoce sus espacios</h2>
                    <div class="space-grid">
                      ${spaces.map(s => `
                        <article class="space-card">
                          ${s.foto
                            ? `<img src="${esc(s.foto)}" alt="${esc(s.nombre)}">`
                            : ""
                          }
                          <div>
                            <h3>${esc(s.nombre)}</h3>
                            ${s.descripcion
                              ? `<p>${esc(s.descripcion)}</p>`
                              : ""
                            }
                          </div>
                        </article>
                      `).join("")}
                    </div>
                  </section>`
                : ""
            }

            ${
              p.servicios?.length
                ? `<section class="detail-section">
                    <h2>Servicios y equipamiento</h2>
                    <p>${p.servicios.map(esc).join(" · ")}</p>
                  </section>`
                : ""
            }

            ${
              p.entorno?.length
                ? `<section class="detail-section">
                    <h2>Alrededores y servicios cercanos</h2>
                    <p>${p.entorno.map(esc).join(" · ")}</p>
                  </section>`
                : ""
            }

            ${
              locationText
                ? `<section class="detail-section">
                    <h2>Ubicación</h2>
                    <p>${esc(locationText)}</p>
                    ${p.mapa
                      ? `<a class="text-link" target="_blank" rel="noopener" href="${esc(p.mapa)}">Consultar mapa →</a>`
                      : ""
                    }
                  </section>`
                : ""
            }
          </div>

          <aside class="detail-aside">
            <h3>¿Te interesa esta propiedad?</h3>
            <p>Contáctanos para solicitar información, conocer detalles o coordinar una visita.</p>

            <a class="btn btn-dark" target="_blank" rel="noopener" href="${waLink(message)}">
              Consultar por WhatsApp
            </a>

            <a class="btn btn-outline" href="${emailLink("Información: " + p.titulo, message)}">
              Solicitar por correo
            </a>

            <button class="btn btn-outline" onclick="window.print()">
              Imprimir ficha
            </button>
          </aside>
        </div>
      `;

      document.title = p.titulo + " | CUENCA";
    } catch (error) {
      root.innerHTML =
        "<p>No fue posible cargar la información de la propiedad.</p>";

      console.error("Error al cargar la ficha:", error);
    }
  }

  init();
})();
