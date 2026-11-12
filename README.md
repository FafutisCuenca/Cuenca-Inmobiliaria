# CUENCA INMOBILIARIA

**Catálogo digital de casas habitación en venta.**

## 1. Descripción

CUENCA INMOBILIARIA es un sitio web diseñado para presentar y promocionar propiedades inmobiliarias, comenzando con casas habitación en venta.

Su objetivo es ofrecer a los visitantes una experiencia visual, sencilla y profesional, donde puedan consultar las características de cada propiedad, fotografías, distribución, ubicación y servicios cercanos.

La plataforma facilita el contacto directo con la inmobiliaria mediante WhatsApp y correo electrónico.

## 2. Objetivos del proyecto

- Presentar propiedades de manera profesional.
- Mostrar fotografías generales y de cada espacio.
- Publicar información detallada de los inmuebles.
- Facilitar la búsqueda y consulta de propiedades.
- Permitir contacto directo para solicitar mayores informes.
- Administrar el catálogo sin utilizar bases de datos.

## 3. Funcionalidades

### Sitio público
- Página principal.
- Catálogo de casas en venta.
- Búsqueda y filtros.
- Fichas individuales de propiedades.
- Galerías fotográficas.
- Características de construcción y terreno.
- Distribución de habitaciones.
- Servicios y equipamiento.
- Información comercial de los alrededores.
- Contacto por WhatsApp y correo.

### Administrador local
- Crear propiedades.
- Modificar información.
- Eliminar propiedades.
- Publicar, mantener como borrador o marcar como vendidas.
- Cargar fotografías de portada.
- Asociar fotografías opcionales a cada habitación o espacio.
- Importar y exportar archivos JSON.

## 4. Tecnologías

- HTML5
- CSS3
- JavaScript
- JSON
- GitHub Pages

No requiere:
- Base de datos.
- Servidor propio.
- Registro de usuarios.
- CRM.
- Almacenamiento de prospectos.

## 5. Estructura de archivos

```text
Cuenca-Inmobiliaria/
├── index.html
├── casas.html
├── casa.html
├── contacto.html
├── admin.html
├── css/
│   ├── styles.css
│   ├── admin.css
│   └── print.css
├── js/
│   ├── app.js
│   ├── casas.js
│   ├── casa.js
│   └── admin.js
├── data/
│   ├── casas.json
│   └── configuracion.json
└── README.md
```

## 6. Información de contacto

**Marca:** CUENCA INMOBILIARIA

**Correo:** ljcuenca@yahoo.com

**WhatsApp:** +52 55 2027 5145

Los datos de contacto se configuran en `js/app.js`.

## 7. Administración

La información de las propiedades se almacena en `data/casas.json`.

El administrador local permite modificar el catálogo y descargar una nueva versión del archivo JSON.

Para publicar los cambios:

1. Abrir el administrador.
2. Importar el catálogo vigente.
3. Registrar o modificar propiedades.
4. Descargar el nuevo archivo JSON.
5. Reemplazar `data/casas.json` en el repositorio.
6. Publicar los cambios en GitHub.

Las fotografías se optimizan y se incorporan al JSON.

## 8. Publicación

El proyecto está preparado para publicarse mediante GitHub Pages.

Repositorio propuesto: `Cuenca-Inmobiliaria`.

## 9. Privacidad

El sitio no almacena información de visitantes ni administra prospectos.

Las solicitudes de información se realizan directamente mediante WhatsApp o correo electrónico. El visitante decide si envía sus datos.

## 10. Crecimiento futuro

La arquitectura permitirá incorporar posteriormente:

- Departamentos.
- Terrenos.
- Locales comerciales.
- Oficinas.
- Bodegas.
- Propiedades para inversión.

Estas ampliaciones se realizarán sin necesidad de implementar una base de datos.

---

**CUENCA INMOBILIARIA**

*Espacios para vivir, inversiones para crecer.*
