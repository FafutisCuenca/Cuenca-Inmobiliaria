
const $ = s => document.querySelector(s);

let homes = [];
let currentId = null;
let coverData = "";
let coverPreview = "";
let spaces = [];
let photos = [];

const blank = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  folio: "INM-" + String(homes.length + 1).padStart(4, "0"),
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
  $("#admin-status").textContent = t;
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

function normalizePhoto(photo, index) {
  if (typeof photo === "string") {
    return {
      archivo: photo,
      titulo: `Fotografía ${index + 1}`,
      preview: ""
    };
  }

  if (photo && typeof photo === "object" && photo.archivo) {
    return {
      archivo: photo.archivo,
      titulo: photo.titulo || `Fotografía ${index + 1}`,
      preview: ""
    };
  }

  return null;
}

function renderList() {
  const box = $("#property-list");

  box.innerHTML = homes.length
    ? homes.map(p => `
        <button class="admin-property ${p.id === currentId ? "active" : ""}" data-id="${escapeHtml(p.id)}">
          ${escapeHtml(p.titulo || "Nueva propiedad")}
          <small>${escapeHtml(p.folio)} · ${escapeHtml(p.estado)}</small>
        </button>
      `).join("")
    : "<p class='muted'>Aún no hay propiedades.</p>";

  box.querySelectorAll("button").forEach(b => {
    b.onclick = () => selectProperty(b.dataset.id);
  });
}

function selectProperty(id) {
  const p = homes.find(x => x.id === id);
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

  Object.entries(values).forEach(([k, v]) => {
    if (f.elements[k]) f.elements[k].value = v ?? "";
  });

  f.elements.portada.value = "";

  renderCover();
  renderPhotos();
  renderSpaces();
  renderList();

  $("#editor-heading").textContent = "Editar " + (p.folio || "propiedad");
}

function renderCover() {
  const preview = coverPreview || coverData;

  $("#cover-preview").innerHTML = preview
    ? `<img src="${escapeHtml(preview)}" alt="Portada actual">`
    : "";
}

function renderPhotos() {
  $("#photos-list").innerHTML = photos.map((photo, i) => `
    <div class="admin-photo-row" data-index="${i}">
      <div class="admin-photo-preview">
        ${photo.preview || photo.archivo
          ? `<img src="${escapeHtml(photo.preview || photo.archivo)}" alt="Fotografía ${i + 1}">`
          : "<span>Sin fotografía</span>"
        }
      </div>

      <div class="admin-photo-fields">
        <label>Título de la fotografía
          <input data-field="titulo" value="${escapeHtml(photo.titulo)}" placeholder="Ej. Sala y comedor">
        </label>

        <label>Ruta del archivo
          <input data-field="archivo" value="${escapeHtml(photo.archivo)}" placeholder="img/casas/nombre-foto.jpeg">
        </label>

        <label>Seleccionar fotografía
          <input type="file" data-file accept="image/*">
        </label>

        <button type="button" class="btn btn-danger btn-small remove-photo">
          Quitar fotografía
        </button>
      </div>
    </div>
  `).join("");

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

    row.querySelector(".remove-photo").onclick = () => {
      photos.splice(i, 1);
      renderPhotos();
    };
  });
}

function renderSpaces() {
  $("#spaces-list").innerHTML = spaces.map((s, i) => `
    <div class="space-row" data-index="${i}">
      <label>Nombre del espacio
        <input data-field="nombre" value="${escapeHtml(s.nombre)}" placeholder="Ej. Recámara principal">
      </label>

      <label>Descripción
        <input data-field="descripcion" value="${escapeHtml(s.descripcion || "")}" placeholder="Opcional">
      </label>

      <div class="space-photo-cell">
        <label>Fotografía opcional
          <input data-field="foto" type="file" accept="image/*">
        </label>

        ${s.foto
          ? `<img src="${escapeHtml(s.preview || s.foto)}" alt="Foto del espacio">`
          : ""
        }

        <input data-field="rutaFoto" value="${escapeHtml(s.foto || "")}" placeholder="img/casas/archivo.jpeg">
      </div>

      <button class="btn btn-danger btn-small remove-space" type="button">Quitar</button>
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

$("#import-json").onchange = async e => {
  try {
    const file = e.target.files[0];
    if (!file) return;

    const parsed = JSON.parse(await file.text());

    if (!Array.isArray(parsed)) {
      throw Error("El archivo debe contener un arreglo JSON.");
    }

    homes = parsed;
    currentId = homes[0]?.id || null;

    renderList();

    if (currentId) selectProperty(currentId);
    else resetForm();

    status("Catálogo importado correctamente. Recuerda descargar el JSON al terminar.");

  } catch (err) {
    status("No se pudo importar: " + err.message);
  }
};

function resetForm() {
  const p = blank();

  currentId = p.id;
  homes.push(p);

  selectProperty(p.id);
  status("Nueva propiedad creada. Completa sus datos y guarda.");
}

$("#new-property").onclick = resetForm;

$("#add-photo").onclick = () => {
  photos.push({
    archivo: "",
    titulo: "",
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

$("#property-form").onsubmit = e => {
  e.preventDefault();

  const f = e.currentTarget;
  const d = Object.fromEntries(new FormData(f).entries());

  const p = {
    id: d.id || currentId,
    folio: d.folio,
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
    servicios: d.servicios.split(",").map(x => x.trim()).filter(Boolean),
    entorno: d.entorno.split(",").map(x => x.trim()).filter(Boolean),
    portada: coverData,
    portadaTitulo: d.portadaTitulo || "Fachada principal",
    fotos: photos
      .filter(photo => photo.archivo)
      .map(photo => ({
        archivo: photo.archivo,
        titulo: photo.titulo || "Fotografía de la propiedad"
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

  if (ix >= 0) homes[ix] = p;
  else homes.push(p);

  currentId = p.id;

  renderList();
  selectProperty(p.id);

  status(
    "Propiedad guardada en esta sesión. Descarga casas.json para conservar los cambios."
  );
};

$("#delete-property").onclick = () => {
  if (!currentId) return;

  if (!confirm("¿Eliminar esta propiedad del catálogo local?")) return;

  homes = homes.filter(p => p.id !== currentId);
  currentId = homes[0]?.id || null;

  renderList();

  if (currentId) {
    selectProperty(currentId);
  } else {
    $("#property-form").reset();
    spaces = [];
    photos = [];
    coverData = "";
    coverPreview = "";
    $("#spaces-list").innerHTML = "";
    $("#photos-list").innerHTML = "";
    $("#cover-preview").innerHTML = "";
  }

  status("Propiedad eliminada de la sesión. Descarga el JSON para conservar el cambio.");
};

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

  status("Se descargó casas.json.");
};

fetch("data/casas.json")
  .then(r => {
    if (!r.ok) throw new Error("No se pudo leer casas.json");
    return r.json();
  })
  .then(data => {
    homes = data;
    renderList();

    if (homes[0]) selectProperty(homes[0].id);
    else resetForm();
  })
  .catch(() => {
    homes = [];
    renderList();
    status("No se pudo cargar automáticamente. Usa Importar casas.json o Nueva casa.");
  });
