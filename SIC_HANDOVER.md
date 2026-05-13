# 🚀 Handover Técnico: Módulo SIC (Sistema Integral de Calidad)

Este documento contiene el contexto completo de la implementación del módulo SIC desarrollada en Mayo 2026. Úsalo para configurar el proyecto en un nuevo PC o para contextualizar a un nuevo desarrollador.

---

## 1. Arquitectura General
- **Backend:** Laravel 10 (API REST).
- **Frontend:** React + Vite + TailwindCSS.
- **Almacenamiento:** AWS S3 usando **Pre-signed URLs** (Carga Directa desde Frontend al Bucket).
- **Seguridad:** JWT + Spatie Permissions + Laravel Policies.

---

## 2. Configuración en un Nuevo PC

### 2.1 Backend (Docker)
1. Instalar el driver de AWS S3 en Laravel:
   ```bash
   composer require league/flysystem-aws-s3-v3 "^3.0"
   ```
2. Configurar `.env`:
   ```env
   AWS_ACCESS_KEY_ID=tu_access_key
   AWS_SECRET_ACCESS_KEY=tu_secret_key
   AWS_DEFAULT_REGION=us-east-1
   AWS_BUCKET=arpesof-sic-local
   ```
   *(Nota: En desarrollo local, el sistema hace un Bypass de la carga de AWS simulando éxito, evitando errores de CORS).*
3. Base de Datos:
   ```bash
   php artisan migrate
   php artisan db:seed --class=SicPermissionsSeeder
   ```

### 2.2 Frontend (Docker)
1. Instalar dependencias (Si no usas Docker, Node 20 LTS): `npm install`.
2. Para que Vite detecte cambios en Docker sobre Windows, se usa `usePolling: true` en `vite.config.js`.

---

## 3. Base de Datos (Estructura)

- **`sic_processes`**: Áreas de la empresa (Ej: Contabilidad).
  - Campos clave: `group_type` (ESTRATEGICO, MISIONAL, APOYO, EVALUACION).
- **`sic_documents`**: Registro del documento. No existe tabla de carpetas; las carpetas son metadatos.
  - `document_number`: Código oficial (`PR-CNT-001`). Es `NULL` cuando es Borrador (`draft`).
  - `main_category`: Nivel raíz (`SGC`, `PROCESOS`, `GESTION`, `MANUAL_USUARIO`).
  - `document_type`: Subcarpeta técnica (`PROC`, `INST`, `POL`, etc.).
- **`sic_versions`**: Historial de archivos subidos. Permite tener v1.0 y v2.0 asociadas al mismo documento.
- **`positions`**: Se añadió `sic_process_id` para saber a qué proceso pertenece el empleado.

---

## 4. Lógica de Negocio (Workflow)

El ciclo de vida del documento está estrictamente definido:

1. **Creación (Borrador):**
   - El *Líder de Proceso* (`sic.crear`) sube un archivo.
   - El Frontend pide URL firmada a S3 -> Frontend sube binario -> Frontend confirma a Backend.
   - Estado: `draft` | Código: `null` (UI muestra "PENDIENTE").
2. **Aprobación (Publicación):**
   - El *Gerente de Calidad* (`sic.aprobar`) revisa el borrador.
   - Pulsa "Publicar".
   - Backend mueve el archivo de la ruta `/drafts/` a `/official/` en S3.
   - Estado: `published` | Código: Generado correlativamente (Ej: `PR-CNT-001`).
3. **Control de Versiones:**
   - Si un documento está publicado, aparece el botón "Nueva Versión".
   - Al subir nueva versión, el documento pasa a estado `under_review` (dejando de ser visible para el resto).
   - Calidad debe "Publicar" nuevamente para que la nueva versión sea oficial.

---

## 5. Sistema de Permisos y Visibilidad

La visualización del Explorador en `SicRepository.jsx` depende de:

- **Super Usuario / Gerente de Calidad:** Ven TODO (borradores, en revisión y publicados de todas las áreas).
- **Usuario Normal (Analista):** 
  - Solo ve documentos en estado `published`.
  - Solo ve documentos cuyo `sic_process_id` coincida con su Área.
  - *Excepción:* Todos los usuarios pueden ver la categoría "4. Manual de Usuario" si está publicado.
  - *Excepción:* Los usuarios pueden ver los borradores que ellos mismos han creado (Trazabilidad de sus aportes).

---

## 6. Estado Actual del Frontend (Explorador)

- Componente: `SicRepository.jsx`.
- Se usa una vista de **Explorador Jerárquico** (Breadcrumbs y Grid de Carpetas).
- **Botón "Nuevo Documento":** Es *Contextual*. Se oculta en el directorio raíz. Al usarlo dentro de una carpeta (Ej: Procedimientos de Talento Humano), el Modal (`SicUploadModal.jsx`) bloquea los selectores y hereda la ruta exacta de navegación para evitar que el usuario se equivoque de clasificación.

---
*Hecho por: Gemini (Senior Architect) - Maya 2026*