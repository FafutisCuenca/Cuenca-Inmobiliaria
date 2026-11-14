
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
  destacado: false,
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

/* =====================================================
   CONSULTA EN LÍNEA DE CÓDIGOS POSTALES
   Servicio: Postali
   ===================================================== */

let postalLookupSequence = 0;
let lastPostalLookup = "";

async function lookupPostalCode(cp, preserveColonia = false) {
  const form = $("#property-form");
  const postalStatus = $("#postal-lookup-status");

  if (!/^\d{5}$/.test(String(cp || ""))) return;

  const requestId = ++postalLookupSequence;

  if (postalStatus) {
    postalStatus.textContent = "Consultando código postal...";
  }

  try {
    const response = await fetch(
      `https://postali.app/api/v1/mx/cp/${encodeURIComponent(cp)}`
    );

    if (!response.ok) {
      throw new Error("No se encontró el código postal.");
    }

    const data = await response.json();

    // Ignorar respuestas de consultas anteriores.
    if (requestId !== postalLookupSequence) return;

    if (!data.estado || !Array.isArray(data.asentamientos)) {
      throw new Error("La respuesta del catálogo no es válida.");
    }

    form.elements.estadoUbicacion.value = data.estado;
    form.elements.municipio.value = data.municipio || "";

    const options = $("#colonia-options");

    options.innerHTML = data.asentamientos.map(item => `
      <option value="${escapeHtml(item.nombre)}"></option>
    `).join("");

    // Al editar conservamos la colonia ya registrada.
    // Al capturar un nuevo CP dejamos elegir la colonia correspondiente.
    if (!preserveColonia) {
      form.elements.colonia.value = "";
    }

    if (postalStatus) {
      postalStatus.textContent =
        `${data.asentamientos.length} colonia(s) encontrada(s). Selecciona una de la lista.`;
    }

  } catch (error) {
    if (requestId !== postalLookupSequence) return;

    if (postalStatus) {
      postalStatus.textContent =
        "No fue posible consultar el catálogo. Puedes capturar los datos manualmente.";
    }

    console.warn("Consulta postal:", error);
  }
}

// Consultar automáticamente al completar los cinco dígitos.
$("#property-form").elements.cp.addEventListener("input", event => {
  const cp = event.target.value.trim();

  if (!/^\d{5}$/.test(cp)) {
    lastPostalLookup = "";
    return;
  }

  if (cp === lastPostalLookup) return;

  lastPostalLookup = cp;
  lookupPostalCode(cp);
});

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

/* =====================================================
   DIRECTORIO DE FOTOGRAFÍAS POR INMUEBLE
   ===================================================== */

function propertyImagePath(path, folio) {
  if (!path || !folio) return path || "";

  const value = String(path).trim();

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const base = "img/casas/";
  const folder = `${base}${folio}/`;

  if (value.startsWith(folder)) return value;

  if (value.startsWith(base)) {
    const filename = value.substring(base.length).split("/").pop();
    return folder + filename;
  }

  return value;
}

function propertyFolder(folio) {
  return `img/casas/${folio}/`;
}

function normalizePropertyPaths(property) {
  if (!property || typeof property !== "object") return property;

  const folio = property.folio;
  if (!folio) return property;

  property.portada = propertyImagePath(property.portada, folio);

  property.fotos = (property.fotos || []).map(photo => {
    if (typeof photo === "string") {
      return propertyImagePath(photo, folio);
    }

    if (photo && typeof photo === "object") {
      return {
        ...photo,
        archivo: propertyImagePath(photo.archivo, folio)
      };
    }

    return photo;
  });

  property.espacios = (property.espacios || []).map(space => ({
    ...space,
    foto: propertyImagePath(space.foto, folio)
  }));

  // Los inmuebles anteriores se consideran no destacados.
  property.destacado = property.destacado === true;

  return property;
}

function normalizePhoto(photo, index, folio) {
  if (typeof photo === "string") {
    return {
      archivo: propertyImagePath(photo, folio),
      titulo: `Fotografía ${index + 1}`,
      principalImpresion: false,
      preview: ""
    };
  }

  if (photo && typeof photo === "object" && photo.archivo) {
    return {
      archivo: propertyImagePath(photo.archivo, folio),
      titulo: photo.titulo || `Fotografía ${index + 1}`,
      principalImpresion: photo.principalImpresion === true,
      preview: ""
    };
  }

  return null;
}

function currentFolio() {
  return $("#property-form")?.elements.folio?.value || nextFolio();
}

function currentImageFolder() {
  return propertyFolder(currentFolio());
}

/* =====================================================
   NAVEGACIÓN ENTRE INVENTARIO Y EDITOR
   ===================================================== */

function showInventory() {
  $("#admin-inventory-view").hidden = false;
  $("#admin-editor-view").hidden = true;
}

function showEditor() {
  // Conservamos el inventario visible.
  $("#admin-inventory-view").hidden = false;

  // Abrimos el editor debajo del inventario.
  $("#admin-editor-view").hidden = false;

  // Desplazamos la vista hacia abajo, hasta el editor.
  requestAnimationFrame(() => {
    $("#admin-editor-view").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

function backToInventory() {
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

          ${p.destacado === true ? `
            <span class="admin-property-featured">
              ★ Inmueble destacado
            </span>
          ` : ""}

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

  normalizePropertyPaths(p);

  currentId = id;

  coverData = p.portada || "";
  coverPreview = "";

  spaces = (p.espacios || []).map(space => ({
    ...space,
    foto: propertyImagePath(space.foto, p.folio),
    preview: ""
  }));

  photos = (p.fotos || [])
    .map((photo, index) => normalizePhoto(photo, index, p.folio))
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

   // Recuperar también las opciones postales al editar un inmueble.
const savedCP = String(values.cp || "").trim();

if (/^\d{5}$/.test(savedCP)) {
  lastPostalLookup = savedCP;
  lookupPostalCode(savedCP, true);
} else {
  lastPostalLookup = "";
  postalLookupSequence++;
  $("#colonia-options").innerHTML = "";
}

  // La casilla se controla mediante checked, no mediante value.
  if (f.elements.destacado) {
    f.elements.destacado.checked = p.destacado === true;
  }

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
            placeholder="${escapeHtml(currentImageFolder())}nombre-foto.jpeg"
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

      photos[i].archivo = currentImageFolder() + file.name;
      photos[i].preview = URL.createObjectURL(file);

      renderPhotos();

      status(
        `Fotografía seleccionada. Copia ${file.name} a ${currentImageFolder()} y súbela a GitHub.`
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
          placeholder="${escapeHtml(currentImageFolder())}nombre-foto.jpeg"
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

          spaces[i].foto = currentImageFolder() + file.name;
          spaces[i].preview = URL.createObjectURL(file);

          renderSpaces();

          status(
            `Fotografía seleccionada. Copia ${file.name} a ${currentImageFolder()} y súbela a GitHub.`
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

    homes = parsed.map(normalizePropertyPaths);
    currentId = null;
    isNewProperty = false;

    renderList();
    showInventory();

    status(
      "Catálogo importado. Las rutas de fotografías se organizaron por folio en memoria. Los inmuebles sin selección de destacado aparecen desmarcados. Exporta casas.json para guardar los cambios."
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

  currentId = p.id;
  isNewProperty = true;

  selectProperty(p.id, p);

  $("#editor-heading").textContent = "Nuevo inmueble · " + p.folio;

  status(
    `Nuevo inmueble iniciado con el folio ${p.folio}. Sus fotografías deberán guardarse en ${propertyFolder(p.folio)}.`
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

  coverData = currentImageFolder() + file.name;
  coverPreview = URL.createObjectURL(file);

  renderCover();

  status(
    `Portada seleccionada. Copia ${file.name} a ${currentImageFolder()} y súbela a GitHub.`
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
  const folio = existing?.folio || d.folio || nextFolio();

  const p = {
    id: d.id || currentId,
    folio,
    estado: d.estado,

    // Solo se considera destacado cuando la casilla está marcada.
    destacado: f.elements.destacado?.checked === true,

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
    portada: propertyImagePath(coverData, folio),
    portadaTitulo: d.portadaTitulo || "Fachada principal",
    fotos: photos
      .filter(photo => photo.archivo)
      .map(photo => ({
        archivo: propertyImagePath(photo.archivo, folio),
        titulo: photo.titulo || "Fotografía de la propiedad",
        principalImpresion: photo.principalImpresion === true
      })),
    espacios: spaces
      .filter(s => s.nombre.trim())
      .map(s => ({
        nombre: s.nombre,
        descripcion: s.descripcion || "",
        foto: propertyImagePath(s.foto, folio)
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
    `Inmueble ${p.folio} guardado correctamente. ${p.destacado ? "Está marcado como destacado." : "No está marcado como destacado."} Sus fotografías utilizan ${propertyFolder(p.folio)}. Descarga casas.json para conservar los cambios.`
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
    "Se descargó casas.json con las rutas de fotografías organizadas por inmueble y la selección de inmuebles destacados."
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

    homes = data.map(normalizePropertyPaths);
    currentId = null;
    isNewProperty = false;

    renderList();
    showInventory();

    status(
      `Inventario cargado: ${homes.length} inmueble(s). Los inmuebles sin selección de destacado aparecen desmarcados. Las rutas de fotografías se organizaron en memoria por folio. Exporta casas.json para guardar los cambios.`
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
