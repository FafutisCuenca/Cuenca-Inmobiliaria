
const $ = s => document.querySelector(s);

let homes = [];
let currentId = null;
let isNewProperty = false;

let coverData = "";
let coverPreview = "";
let spaces = [];
let photos = [];

/* =====================================================
   UTILIDADES
   ===================================================== */

function nextFolio() {
  const highest = homes.reduce((max, home) => {
    const match = String(home.folio || "").match(/^INM-(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return "INM-" + String(highest + 1).padStart(4, "0");
}

const blank = () => ({
  id: crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2),
  folio: nextFolio(),
  estado: "borrador",
  titulo: "",
  precio: "",
  negociable: true,
  descripcion: "",
  estadoUbicacion: "",
  municipio: "",
  colonia: "",
  cp: "",
  direccion: "",
  terreno: "",
  construccion: "",
  recamaras: "",
  banos: "",
  mediosBanos: "",
  estacionamientos: "",
  niveles: "",
  antiguedad: "",
  servicios: [],
  entorno: [],
  portada: "",
  portadaTitulo: "Fachada principal",
  fotos: [],
  espacios: []
});

function status(t) {
  const element = $("#admin-status");
  if (element) element.textContent = t;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return "Precio por definir";

  return price.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  });
}

function normalizePhoto(photo, index) {
  if (typeof photo === "string") {
    return {
      archivo: photo,
      titulo: `Fotografía ${index + 1}`,
      principalImpresion: false,
      preview: ""
    };
  }

  if (photo && typeof photo === "object" && photo.archivo) {
    return {
      archivo: photo.archivo,
      titulo: photo.titulo || `Fotografía ${index + 1}`,
      principalImpresion: photo.principalImpresion === true,
      preview: ""
    };
  }

  return null;
}

/* =====================================================
   NAVEGACIÓN ENTRE INVENTARIO Y EDITOR
   ===================================================== */

function showInventory() {
  $("#admin-inventory-view").hidden = false;
  $("#admin-editor-view").hidden = true;
}

function showEditor() {
  $("#admin-inventory-view").hidden = true;
  $("#admin-editor-view").hidden = false;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function backToInventory() {
  // Si era un inmueble nuevo y no se guardó, se descarta.
  if (isNewProperty) {
    currentId = null;
    isNewProperty = false;
  }

  renderList();
  showInventory();

  status("Inventario de inmuebles. Selecciona una propiedad para editarla.");
}

$("#back-to-inventory").onclick = backToInventory;

/* =====================================================
   INVENTARIO DE INMUEBLES
   ===================================================== */

function renderList() {
  const box = $("#property-list");
  if (!box) return;

  if (!homes.length) {
    box.innerHTML = `
      <p class="muted">
        Aún no hay inmuebles en el inventario.
        Puedes importar casas.json o crear un nuevo inmueble.
      </p>
    `;
    return;
  }

  box.innerHTML = homes.map(p => {
    const cover = p.portada || "";
    const selected = p.id === currentId;

    const location = [
      p.colonia,
      p.municipio,
      p.estadoUbicacion
    ].filter(Boolean).join(", ");

    const statusLabel = p.estado || "borrador";

    return `
      <button
        type="button"
        class="admin-property ${selected ? "active" : ""}"
        data-id="${escapeHtml(p.id)}"
        aria-label="Editar ${escapeHtml(p.folio || "inmueble")}"
      >
        <span class="admin-property-image">
          ${
            cover
              ? `<img src="${escapeHtml(cover)}" alt="Fotografía de ${escapeHtml(p.titulo || "inmueble")}">`
              : `<span class="admin-property-no-image">Sin fotografía</span>`
          }
        </span>

        <span class="admin-property-content">
          <span class="admin-property-topline">
            <strong class="admin-property-folio">
              ${escapeHtml(p.folio || "Sin folio")}
            </strong>

            <span class="admin-property-status status-${escapeHtml(statusLabel)}">
              ${escapeHtml(statusLabel)}
            </span>
          </span>

          <span class="admin-property-title">
            ${escapeHtml(p.titulo || "Inmueble sin título")}
          </span>

          <span class="admin-property-price">
            ${escapeHtml(formatPrice(p.precio))}
          </span>

          <span class="admin-property-location">
            ${escapeHtml(location || "Ubicación pendiente")}
          </span>

          <span class="admin-property-action">
            Editar inmueble →
          </span>
        </span>
      </button>
    `;
  }).join("");

  box.querySelectorAll(".admin-property").forEach(button => {
    button.onclick = () => selectProperty(button.dataset.id);
  });
}

/* =====================================================
   SELECCIONAR INMUEBLE
   ===================================================== */

function selectProperty(id, draft = null) {
  const p = draft || homes.find(x => x.id === id);
  if (!p) return;

  currentId = id;

  coverData = p.portada || "";
  coverPreview = "";

  spaces = structuredClone(p.espacios || []);

  photos = (p.fotos || [])
    .map(normalizePhoto)
    .filter(Boolean);

  const f = $("#property-form");

  const values = {
    id: p.id,
    folio: p.folio,
    estado: p.estado,
    titulo: p.titulo,
    precio: p.precio,
    negociable: String(p.negociable ?? true),
    descripcion: p.descripcion,
    estadoUbicacion: p.estadoUbicacion,
    municipio: p.municipio,
    colonia: p.colonia,
    cp: p.cp,
    direccion: p.direccion,
    terreno: p.terreno,
    construccion: p.construccion,
    recamaras: p.recamaras,
    banos: p.banos,
    mediosBanos: p.mediosBanos,
    estacionamientos: p.estacionamientos,
    niveles: p.niveles,
    antiguedad: p.antiguedad,
    servicios: (p.servicios || []).join(", "),
    entorno: (p.entorno || []).join(", "),
    portadaTitulo: p.portadaTitulo || "Fachada principal"
  };

  Object.entries(values).forEach(([key, value]) => {
    if (f.elements[key]) {
      f.elements[key].value = value ?? "";
    }
  });

  f.elements.portada.value = "";

  renderCover();
  renderPhotos();
  renderSpaces();
  renderList();

  $("#editor-heading").textContent =
    (isNewProperty ? "Nuevo inmueble · " : "Editar inmueble · ") +
    (p.folio || "Sin folio");

  showEditor();
}

/* =====================================================
   FOTOGRAFÍA DE PORTADA
   ===================================================== */

function renderCover() {
  const preview = coverPreview || coverData;
  const element = $("#cover-preview");

  if (!element) return;

  element.innerHTML = preview
    ? `<img src="${escapeHtml(preview)}" alt="Fotografía de portada">`
    : "";
}

/* =====================================================
   GALERÍA DE FOTOGRAFÍAS
   ===================================================== */

function renderPhotos() {
  const selectedCount = photos.filter(
    photo => photo.principalImpresion
  ).length;

  const summary = `
    <div class="admin-photo-print-summary">
      <strong>Fotografías para impresión: ${selectedCount} de 7</strong>
      <small>
        La portada se imprime automáticamente. Puedes elegir hasta
        7 fotografías adicionales.
      </small>
    </div>
  `;

  const rows = photos.map((photo, i) => `
    <div class="admin-photo-row" data-index="${i}">
      <div class="admin-photo-preview">
        ${
          photo.preview || photo.archivo
            ? `<img src="${escapeHtml(photo.preview || photo.archivo)}" alt="Fotografía ${i + 1}">`
            : "<span>Sin fotografía</span>"
        }
      </div>

      <div class="admin-photo-fields">
        <label>Título de la fotografía
          <input
            data-field="titulo"
            value="${escapeHtml(photo.titulo)}"
            placeholder="Ej. Sala y comedor"
          >
        </label>

        <label>Ruta del archivo
          <input
            data-field="archivo"
            value="${escapeHtml(photo.archivo)}"
            placeholder="img/casas/nombre-foto.jpeg"
          >
        </label>

        <label>Seleccionar fotografía
          <input type="file" data-file accept="image/*">
        </label>

        <label class="admin-print-photo-option">
          <input
            type="checkbox"
            data-print-photo
            ${photo.principalImpresion ? "checked" : ""}
          >
          Fotografía principal para impresión
        </label>

        <button type="button" class="btn btn-danger btn-small remove-photo">
          Quitar fotografía
        </button>
      </div>
    </div>
  `).join("");

  $("#photos-list").innerHTML = summary + rows;

  $("#photos-list").querySelectorAll(".admin-photo-row").forEach(row => {
    const i = Number(row.dataset.index);

    row.querySelectorAll("[data-field]").forEach(input => {
      input.oninput = () => {
        photos[i][input.dataset.field] = input.value;
      };
    });

    row.querySelector("[data-file]").onchange = e => {
      const file = e.target.files[0];
      if (!file) return;

      photos[i].archivo = "img/casas/" + file.name;
      photos[i].preview = URL.createObjectURL(file);

      renderPhotos();

      status(
        `Fotografía seleccionada. Recuerda copiar ${file.name} a img/casas/ y subirla a GitHub.`
      );
    };

    row.querySelector("[data-print-photo]").onchange = e => {
      const count = photos.filter(
        photo => photo.principalImpresion
      ).length;

      if (e.target.checked && count >= 7) {
        e.target.checked = false;
        status(
          "Puedes seleccionar como máximo 7 fotografías adicionales. La portada se incluye automáticamente en la impresión."
        );
        return;
      }

      photos[i].principalImpresion = e.target.checked;
      renderPhotos();

      status(
        `Selección de impresión actualizada: ${photos.filter(photo => photo.principalImpresion).length} de 7 fotografías adicionales.`
      );
    };

    row.querySelector(".remove-photo").onclick = () => {
      photos.splice(i, 1);
      renderPhotos();
    };
  });
}

/* =====================================================
   ESPACIOS ADICIONALES
   Se conserva el funcionamiento que ya tienes.
   ===================================================== */

function renderSpaces() {
  $("#spaces-list").innerHTML = spaces.map((s, i) => `
    <div class="space-row" data-index="${i}">
      <label>Nombre del espacio
        <input
          data-field="nombre"
          value="${escapeHtml(s.nombre)}"
          placeholder="Ej. Recámara principal"
        >
      </label>

      <label>Descripción
        <input
          data-field="descripcion"
          value="${escapeHtml(s.descripcion || "")}"
          placeholder="Opcional"
        >
      </label>

      <div class="space-photo-cell">
        <label>Fotografía opcional
          <input data-field="foto" type="file" accept="image/*">
        </label>

        ${
          s.foto
            ? `<img src="${escapeHtml(s.preview || s.foto)}" alt="Foto del espacio">`
            : ""
        }

        <input
          data-field="rutaFoto"
          value="${escapeHtml(s.foto || "")}"
          placeholder="img/casas/archivo.jpeg"
        >
      </div>

      <button class="btn btn-danger btn-small remove-space" type="button">
        Quitar
      </button>
    </div>
  `).join("");

  $("#spaces-list").querySelectorAll(".space-row").forEach(row => {
    const i = Number(row.dataset.index);

    row.querySelectorAll("[data-field]").forEach(el => {
      if (el.type === "file") {
        el.onchange = () => {
          const file = el.files[0];
          if (!file) return;

          spaces[i].foto = "img/casas/" + file.name;
          spaces[i].preview = URL.createObjectURL(file);

          renderSpaces();

          status(
            `Fotografía seleccionada. Copia ${file.name} a img/casas/ y súbela a GitHub.`
          );
        };
      } else if (el.dataset.field === "rutaFoto") {
        el.oninput = () => spaces[i].foto = el.value;
      } else {
        el.oninput = () => spaces[i][el.dataset.field] = el.value;
      }
    });

    row.querySelector(".remove-space").onclick = () => {
      spaces.splice(i, 1);
      renderSpaces();
    };
  });
}

/* =====================================================
   IMPORTAR CATÁLOGO JSON
   ===================================================== */

$("#import-json").onchange = async e => {
  try {
    const file = e.target.files[0];
    if (!file) return;

    const parsed = JSON.parse(await file.text());

    if (!Array.isArray(parsed)) {
      throw Error("El archivo debe contener un arreglo JSON.");
    }

    homes = parsed;
    currentId = null;
    isNewProperty = false;

    renderList();
    showInventory();

    status(
      "Catálogo importado correctamente. Selecciona un inmueble para editarlo."
    );

  } catch (err) {
    status("No se pudo importar: " + err.message);
  }

  e.target.value = "";
};

/* =====================================================
   NUEVO INMUEBLE
   ===================================================== */

function resetForm() {
  const p = blank();

  // El inmueble nuevo todavía no se agrega al inventario.
  // Se incorpora al arreglo homes únicamente al guardarlo.
  currentId = p.id;
  isNewProperty = true;

  selectProperty(p.id, p);

  $("#editor-heading").textContent = "Nuevo inmueble · " + p.folio;

  status(
    `Nuevo inmueble iniciado con el folio ${p.folio}. Completa sus datos y guarda para incorporarlo al inventario.`
  );
}

$("#new-property").onclick = resetForm;

/* =====================================================
   AGREGAR FOTOGRAFÍAS Y ESPACIOS
   ===================================================== */

$("#add-photo").onclick = () => {
  photos.push({
    archivo: "",
    titulo: "",
    principalImpresion: false,
    preview: ""
  });

  renderPhotos();
};

$("#add-space").onclick = () => {
  spaces.push({
    nombre: "",
    descripcion: "",
    foto: "",
    preview: ""
  });

  renderSpaces();
};

/* =====================================================
   SELECCIÓN DE PORTADA
   ===================================================== */

$("#property-form").elements.portada.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  coverData = "img/casas/" + file.name;
  coverPreview = URL.createObjectURL(file);

  renderCover();

  status(
    `Portada seleccionada. Copia ${file.name} a img/casas/ y súbela a GitHub.`
  );
};

/* =====================================================
   GUARDAR INMUEBLE
   ===================================================== */

$("#property-form").onsubmit = e => {
  e.preventDefault();

  const f = e.currentTarget;
  const d = Object.fromEntries(new FormData(f).entries());

  const existing = homes.find(x => x.id === (d.id || currentId));

  const p = {
    id: d.id || currentId,
    folio: existing?.folio || d.folio || nextFolio(),
    estado: d.estado,
    titulo: d.titulo,
    precio: Number(d.precio) || 0,
    negociable: d.negociable === "true",
    descripcion: d.descripcion,
    estadoUbicacion: d.estadoUbicacion,
    municipio: d.municipio,
    colonia: d.colonia,
    cp: d.cp,
    direccion: d.direccion,
    terreno: Number(d.terreno) || 0,
    construccion: Number(d.construccion) || 0,
    recamaras: Number(d.recamaras) || 0,
    banos: Number(d.banos) || 0,
    mediosBanos: Number(d.mediosBanos) || 0,
    estacionamientos: Number(d.estacionamientos) || 0,
    niveles: Number(d.niveles) || 0,
    antiguedad: d.antiguedad === "" ? null : Number(d.antiguedad),
    servicios: (d.servicios || "").split(",").map(x => x.trim()).filter(Boolean),
    entorno: (d.entorno || "").split(",").map(x => x.trim()).filter(Boolean),
    portada: coverData,
    portadaTitulo: d.portadaTitulo || "Fachada principal",
    fotos: photos
      .filter(photo => photo.archivo)
      .map(photo => ({
        archivo: photo.archivo,
        titulo: photo.titulo || "Fotografía de la propiedad",
        principalImpresion: photo.principalImpresion === true
      })),
    espacios: spaces
      .filter(s => s.nombre.trim())
      .map(s => ({
        nombre: s.nombre,
        descripcion: s.descripcion || "",
        foto: s.foto || ""
      }))
  };

  const ix = homes.findIndex(x => x.id === p.id);

  if (ix >= 0) {
    homes[ix] = p;
  } else {
    homes.push(p);
  }

  currentId = null;
  isNewProperty = false;

  renderList();
  showInventory();

  status(
    `Inmueble ${p.folio} guardado correctamente en esta sesión. El inventario está actualizado. Descarga casas.json al terminar para conservar los cambios.`
  );
};

/* =====================================================
   ELIMINAR INMUEBLE
   ===================================================== */

$("#delete-property").onclick = () => {
  if (!currentId) return;

  if (isNewProperty) {
    if (!confirm("¿Cancelar la creación de este inmueble?")) return;

    currentId = null;
    isNewProperty = false;

    renderList();
    showInventory();

    status("Se canceló la creación del nuevo inmueble.");
    return;
  }

  if (!confirm("¿Eliminar este inmueble del catálogo local?")) return;

  const deleted = homes.find(p => p.id === currentId);
  homes = homes.filter(p => p.id !== currentId);

  currentId = null;
  isNewProperty = false;

  renderList();
  showInventory();

  status(
    `Inmueble ${deleted?.folio || ""} eliminado de esta sesión. Descarga el JSON para conservar el cambio.`
  );
};

/* =====================================================
   DESCARGAR CATÁLOGO JSON
   ===================================================== */

$("#export-json").onclick = () => {
  const blob = new Blob(
    [JSON.stringify(homes, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "casas.json";
  a.click();

  URL.revokeObjectURL(url);

  status(
    "Se descargó casas.json con los inmuebles guardados en esta sesión."
  );
};

/* =====================================================
   CARGA INICIAL
   ===================================================== */

fetch("data/casas.json")
  .then(r => {
    if (!r.ok) throw new Error("No se pudo leer casas.json");
    return r.json();
  })
  .then(data => {
    if (!Array.isArray(data)) {
      throw new Error("El archivo no contiene un catálogo válido.");
    }

    homes = data;
    currentId = null;
    isNewProperty = false;

    renderList();
    showInventory();

    status(
      `Inventario cargado correctamente: ${homes.length} inmueble(s). Selecciona uno para editarlo.`
    );
  })
  .catch(() => {
    homes = [];
    currentId = null;
    isNewProperty = false;

    renderList();
    showInventory();

    status(
      "No se pudo cargar automáticamente. Usa Importar casas.json o Nuevo inmueble."
    );
  });
