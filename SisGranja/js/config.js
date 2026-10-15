// ==============================================================================
// SISGRANJA - CONFIGURACIÓN GLOBAL DEL SISTEMA
// ==============================================================================

export const APP_CONFIG = {
  appName: 'SisGranja',
  version: '1.0.0',
  storageKeys: {
    CUYES: 'sisgranja_cuyes',
    POZAS: 'sisgranja_pozas',
    EMPADRES: 'sisgranja_empadres',
    PARTOS: 'sisgranja_partos',
    SALUD: 'sisgranja_registros_medicos',
    CONFIG: 'sisgranja_app_settings',
    SUPABASE_CREDENTIALS: 'sisgranja_supabase_config'
  },
  
  // Parámetros zootécnicos por defecto para Cavia porcellus
  zootech: {
    diasGestacionPromedio: 68,     // Rango típico: 65 - 72 días
    diasDestetePromedio: 21,       // Edad óptima de destete: 14 a 21 días
    pesoIdealNacimientoG: 120,     // Gramos promedio al nacer
    pesoOptimoReproductorG: 1100,  // Gramos ideales para primer empadre
    edadOptimaEmpadreDias: 90      // ~3 meses
  },

  // Razas comerciales principales en los Andes
  razas: [
    { id: 'Perú', label: 'Raza Perú', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { id: 'Andina', label: 'Raza Andina', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { id: 'Inti', label: 'Raza Inti', color: 'bg-sky-100 text-sky-800 border-sky-300' },
    { id: 'Criollo', label: 'Criollo Mejorado', color: 'bg-stone-100 text-stone-800 border-stone-300' },
    { id: 'California', label: 'California', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    { id: 'Chota', label: 'Línea Chota', color: 'bg-orange-100 text-orange-800 border-orange-300' }
  ],

  // Etapas productivas del cuy
  etapas: [
    { id: 'Cría', label: 'Cría (Lactante)', minPeso: 0, maxPeso: 350, badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'Recría', label: 'Recría (Crecimiento)', minPeso: 351, maxPeso: 800, badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    { id: 'Reproductor', label: 'Reproductor(a)', minPeso: 801, maxPeso: 2500, badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'Engorde', label: 'Engorde / Venta', minPeso: 750, maxPeso: 1500, badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'Descarte', label: 'Descarte', minPeso: 0, maxPeso: 3000, badgeClass: 'bg-gray-100 text-gray-700 border-gray-300' }
  ],

  // Estados de salud
  estadosSalud: [
    { id: 'Sano', label: 'Sano', badgeClass: 'bg-green-100 text-green-800 border-green-300', dot: 'bg-green-500' },
    { id: 'En Observación', label: 'En Observación', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300', dot: 'bg-yellow-500' },
    { id: 'Enfermo', label: 'Enfermo', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500' },
    { id: 'Cuarentena', label: 'En Cuarentena', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300', dot: 'bg-purple-500' },
    { id: 'Fallecido', label: 'Baja / Fallecido', badgeClass: 'bg-slate-200 text-slate-800 border-slate-400', dot: 'bg-slate-500' }
  ],

  // Tipos de pozas
  tiposPozas: ['Maternidad', 'Recría', 'Reproducción', 'Cuarentena', 'Engorde', 'Destete'],

  // Eventos médicos comunes
  tiposEventosMedicos: ['Preventivo', 'Tratamiento', 'Vacunación', 'Desparasitación', 'Cuarentena', 'Otro'],

  // Supabase configuraciones (proyecto activo de Supabase)
  supabaseDefaults: {
    url: 'https://mdfwmaxtjhtcuzwsqrci.supabase.co',
    anonKey: 'sb_publishable_AjU9EvouA694BZwL-4Eglg_iI0rKo9I'
  }
};
