# 🐹 SisGranja - Sistema de Gestión para Granja de Cuyes

**SisGranja** es una aplicación web moderna, intuitiva y de alto rendimiento diseñada como solución integral para la gestión zootécnica de granjas y criaderos de cuyes (*Cavia porcellus*). Desarrollada con estándares limpios de arquitectura de software, desacoplamiento y alta resiliencia.

---

## 🚀 Características Principales

1. **Gestión Individual de Cuyes:**
   - Registro de aretes, códigos, razas (*Perú, Andina, Inti, Criollo Mejorado, California, Chota*), sexo y linaje genealógico (padre/madre).
   - Control de etapas productivas (*Cría, Recría, Reproductor, Engorde, Descarte*).
   - Registro ponderal (peso en gramos y kilogramos) con cálculo de edad en meses y días.
   - Estado de salud (*Sano, En Observación, Enfermo, Cuarentena, Fallecido*) con alerta visual.
   - Ficha técnica zootécnica individual con historial médico y de partos.

2. **Control de Reproducción y Camadas:**
   - **Empadres y Cruces:** Planificación de apareamientos por pozas o harenes.
   - **Cálculo Automático de Gestación:** Proyección a los **68 días** para alerta de fecha probable de parto.
   - **Registro de Partos:** Control estricto de crías vivas, crías muertas (mortalidad perinatal) y peso al nacer.
   - **Destete Automatizado:** Estimación a los **21 días** con la función **"Destetar / Incorporar al Inventario"** con 1 clic.

3. **Sanidad Animal y Registros Veterinarios:**
   - Seguimiento de eventos profilácticos, tratamientos antibióticos, desparasitaciones e inmunizaciones.
   - Registro de fármacos, dosis, costos veterinarios y fecha de revisión.
   - Botón de **"Dar de Alta Médica"** que retorna automáticamente el estado del animal a *Sano*.

4. **Infraestructura de Pozas / Galpones:**
   - Control de densidad y aforo por poza (Maternidad, Recría, Reproducción, Cuarentena).
   - Barras de progreso de ocupación y semáforo visual de capacidad máxima.

5. **Doble Motor de Datos (Supabase Cloud + LocalStorage Fallback):**
   - **Modo Supabase:** Integración con PostgreSQL 14+ en la nube vía `@supabase/supabase-js`.
   - **Modo de Respaldo Local:** Si no hay internet o no hay credenciales configuradas en el laboratorio, el sistema conmuta automáticamente a `localStorage` con datos de prueba realistas sin interrumpir la operación.

6. **Reportes y Respaldos:**
   - Exportación de base de datos a formato **JSON** para copias de seguridad.
   - Exportación del inventario pecuario a formato **CSV** compatible con Microsoft Excel.
   - Informe zootécnico formateado para **Impresión limpia / PDF** (`Ctrl + P`).

---

## 📁 Estructura del Proyecto

```text
SisGranja/
├── css/
│   └── styles.css              # Tipografía, animaciones y estilos de impresión
├── database/
│   └── supabase.sql            # Script SQL completo (tablas, RLS, triggers e índices)
├── js/
│   ├── components/
│   │   ├── dashboard.js        # KPIs, gráficos Chart.js y alertas tempranas
│   │   ├── cuyes.js            # Inventario, filtros dinámicos, modales y fichas
│   │   ├── reproduccion.js     # Empadres, gestación, partos y camadas
│   │   ├── salud.js            # Fichas veterinarias, tratamientos y altas
│   │   ├── pozas.js            # Supervisión de galpones y capacidad de pozas
│   │   └── reportes.js         # CSV/JSON, impresión y configuración Supabase
│   ├── app.js                  # Enrutador SPA, toasts y controlador global
│   ├── config.js               # Parámetros zootécnicos, razas y catálogos
│   ├── mockData.js             # Datos demo precargados para uso inmediato
│   ├── storageManager.js       # Capa DAO / Abstracción (Supabase & LocalStorage)
│   └── supabaseClient.js       # Cliente y detección automática de conectividad
├── index.html                  # Interfaz principal con Tailwind CDN y Lucide Icons
└── README.md                   # Documentación técnica de arquitectura y uso
```

---

## ⚡ Puesta en Marcha Inmediata

No requieres compilar ni instalar dependencias pesadas gracias al uso de módulos nativos ECMAScript (ESM) y CDNs optimizados:

### Opción 1: Abrir directamente en el navegador
Puedes abrir el archivo `index.html` directamente en tu navegador (Google Chrome, Microsoft Edge, Firefox, Brave) o usar una extensión como **Live Server** de VS Code.

### Opción 2: Usar un servidor local ligero
Desde PowerShell o terminal en la carpeta del proyecto:

```powershell
# Con Node.js (opcional)
npx serve .

# O con Python
python -m http.server 8000
```
Luego abre `http://localhost:8000` en tu navegador.

---

## 🗄️ Conexión con Supabase (Proyecto Preconfigurado)

El sistema ya viene vinculado y configurado con tu proyecto Supabase:
- **Project URL:** `https://mdfwmaxtjhtcuzwsqrci.supabase.co`
- **Publishable Key:** `sb_publishable_AjU9EvouA694BZwL-4Eglg_iI0rKo9I`

### Pasos para activar las tablas en tu base de datos:
1. Inicia sesión en tu panel de control de [Supabase](https://supabase.com/dashboard/project/mdfwmaxtjhtcuzwsqrci).
2. Ve a la sección **SQL Editor** en el menú lateral izquierdo.
3. Abre el archivo [`database/supabase.sql`](database/supabase.sql), copia todo su contenido y ejecútalo (**Run**).
   - *Este script creará las tablas `pozas`, `cuyes`, `empadres`, `partos_camadas`, `registros_medicos`, habilitará RLS con políticas de acceso e insertará los datos iniciales.*
4. Abre **SisGranja** en tu navegador (`index.html`). El sistema detectará las credenciales y se conectará automáticamente mostrando el badge **🟢 Supabase Cloud**.
5. Si en algún momento no tienes acceso a internet, el sistema conmutará automáticamente a **🟡 Modo Local (LocalStorage)** para que nunca pierdas datos ni operatividad en campo o laboratorio.

---

## 📐 Parámetros Zootécnicos Integrados

| Indicador Zootécnico | Valor por Defecto | Referencia Técnica |
| :--- | :--- | :--- |
| **Días de Gestación** | 68 días | Rango 65 a 72 días según camada |
| **Edad Óptima de Destete** | 21 días | Separación de madre a recría |
| **Peso Ideal al Nacer** | 120 - 140 g | Vigor perinatal óptimo |
| **Peso Óptimo de Empadre** | ≥ 900 g (hembras) / ≥ 1100 g (machos) | Madurez sexual reproductiva |
| **Relación de Empadre (Harén)** | 1 macho : 7 - 10 hembras | Sistema de empadre continuo o por lotes |

---

## 🛡️ Seguridad y Respaldo de Datos
- **Row Level Security (RLS):** Habilitado en todas las tablas para proteger la integridad relacional.
- **Exportación Local:** Descarga en cualquier momento un archivo `.json` con el estado completo del criadero para restaurarlo en cualquier computadora o laboratorio.
