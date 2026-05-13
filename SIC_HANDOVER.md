# 🚀 Handover Frontend: Módulo SIC (Sistema Integral de Calidad)

Este documento detalla la implementación del Frontend (React) para el módulo SIC de la Intranet Arpesof. 

## 1. Arquitectura de Interfaz y Navegación

### El Explorador Jerárquico Híbrido (`SicRepository.jsx`)
Se diseñó un componente que simula un sistema de carpetas sin necesidad de que estas existan físicamente en la base de datos.
La navegación utiliza una variable de estado `currentPath` que funciona como Breadcrumbs.

**Estructura Acordada:**
1. **DIRECCIÓN DEL SISTEMA (SGC)** -> Archivos en raíz + Subcarpeta (Perfiles).
2. **PROCESOS** -> Grupos (Misionales, etc.) -> Procesos Reales (Ventas, etc.) -> Tipos de Documento (Procedimientos, Instructivos, etc.).
3. **GESTIÓN DOCUMENTAL** -> Documentos obsoletos.
4. **MANUAL DE USUARIO** -> Archivos directos.

> 💡 **Decisión UI:** 
> La vista es "híbrida". Dependiendo de la ruta, el usuario puede ver la grilla de iconos de carpetas arriba y la tabla de documentos abajo simultáneamente (Ej: Entrar a un proceso muestra su Caracterización en la tabla y las carpetas de Procedimientos arriba).

---

## 2. Modal Inteligente de Subida (`SicUploadModal.jsx`)

Para evitar errores humanos en la clasificación de documentos, el modal de carga es **Contextual**.

### Mecanismos de Prevención de Errores:
1. **Bloqueo de Raíz:** El botón "Nuevo Documento" está oculto en el `root` (Inicio). El usuario está obligado a navegar a una categoría o proceso antes de poder subir algo.
2. **Auto-llenado (Inyección de Contexto):** Al pulsar "Nuevo Documento", el componente extrae el estado de navegación actual y lo pasa al Modal.
3. **Campos Bloqueados:** El Modal toma el contexto e inhabilita (con clase `disabled:opacity-50`) los `select` de "Categoría Principal", "Proceso" y "Ubicación Interna". El usuario solo debe colocar el Título y seleccionar el archivo.

### Flujo de Subida (3 Actos):
1. Pide la URL firmada de S3 (`requestUpload`).
2. Sube el archivo directo a Amazon con `axios.put(upload_url)`. **(En Localhost hay un Bypass que simula el éxito para no tener errores CORS por llaves falsas).**
3. Confirma la creación en el Backend (`confirmUpload`).

---

## 3. Lógica de Estados Visuales

La tabla renderiza indicadores dinámicos basados en la respuesta del Backend:
- **`PENDIENTE`:** Si el backend envía el `document_number` como null, el Front renderiza "PENDIENTE" en azul.
- **Etiquetas de Estado:** 
  - `published`: Badge verde "Vigente".
  - `under_review`: Badge naranja "En Revisión".
  - `draft`: Badge gris "Borrador".
- **Botones Dinámicos (Protegidos):**
  - **Publicar:** Solo se muestra a usuarios con permiso `sic.aprobar` o rol `Super_usuario` si el estado es draft o review.
  - **Nueva Versión:** Solo aparece si el documento está `published`. Al pulsar, abre el modal en modo `isVersionMode = true`, bloqueando el título y exigiendo un "Resumen de Cambios".

---

## 4. Integración en el Proyecto

### Servicios y Hooks
- `src/services/sicService.js`: Contiene todas las llamadas Axios al Backend SIC. Incluye un Bypass de Desarrollo para la subida a S3 si detecta la palabra `tu_access_key`.
- `src/hooks/useSic.js`: Hook para manejar el `loading`, `error`, y el estado global de `documents`. Contiene la función para abrir las URLs de descarga generadas por S3.

### Rutas (`App.jsx`)
- La vista principal se renderiza en `/sic/repositorio`.
- Protegida mediante el componente existente: `<PermissionGuard permission="sic.ver.propio">`.

### Sidebar (`Sidebar.jsx`)
- Se agregó el botón "Calidad (SIC)" en el menú lateral utilizando el icono `DocumentDuplicateIcon`.
- Visibilidad controlada mediante: `canAccess(user, 'sic.ver.propio')`.

---

## 5. Entorno Local y Docker
1. **Hot Reload en Windows:** Se modificó `vite.config.js` añadiendo `server: { watch: { usePolling: true } }` para que Docker detecte los cambios de archivo de inmediato.
2. **CORS Testing:** Si pruebas S3 en local con credenciales reales, asegúrate de configurar la regla CORS en el Bucket de AWS permitiendo el origen `http://localhost:5173`.
