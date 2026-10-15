// ==============================================================================
// SISGRANJA - CAPA DE ABSTRACCIÓN Y GESTIÓN DE DATOS (DATA ACCESS LAYER)
// Soporta Supabase y Modo de Respaldo LocalStorage transparente
// ==============================================================================

import { APP_CONFIG } from './config.js';
import { MOCK_POZAS, MOCK_CUYES, MOCK_EMPADRES, MOCK_PARTOS, MOCK_REGISTROS_MEDICOS } from './mockData.js';
import { getSupabase, getConnectionState } from './supabaseClient.js';

// Generador de UUID v4 para entorno de navegador local
function generateLocalUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Inicializa LocalStorage con datos semilla si las claves no existen
 */
export function initLocalStorageIfEmpty() {
  if (!localStorage.getItem(APP_CONFIG.storageKeys.POZAS)) {
    localStorage.setItem(APP_CONFIG.storageKeys.POZAS, JSON.stringify(MOCK_POZAS));
  }
  if (!localStorage.getItem(APP_CONFIG.storageKeys.CUYES)) {
    localStorage.setItem(APP_CONFIG.storageKeys.CUYES, JSON.stringify(MOCK_CUYES));
  }
  if (!localStorage.getItem(APP_CONFIG.storageKeys.EMPADRES)) {
    localStorage.setItem(APP_CONFIG.storageKeys.EMPADRES, JSON.stringify(MOCK_EMPADRES));
  }
  if (!localStorage.getItem(APP_CONFIG.storageKeys.PARTOS)) {
    localStorage.setItem(APP_CONFIG.storageKeys.PARTOS, JSON.stringify(MOCK_PARTOS));
  }
  if (!localStorage.getItem(APP_CONFIG.storageKeys.SALUD)) {
    localStorage.setItem(APP_CONFIG.storageKeys.SALUD, JSON.stringify(MOCK_REGISTROS_MEDICOS));
  }
}

/**
 * Helpers para lectura y escritura directa en LocalStorage
 */
function getLocalCollection(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error(`Error leyendo clave ${key} de LocalStorage:`, e);
    return [];
  }
}

function setLocalCollection(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error escribiendo en clave ${key} de LocalStorage:`, e);
  }
}

// Inicializar almacenamiento local inmediatamente
initLocalStorageIfEmpty();

// ==============================================================================
// GESTIÓN DE POZAS
// ==============================================================================
export async function getPozas() {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('pozas').select('*').order('codigo');
      if (error) throw error;
      setLocalCollection(APP_CONFIG.storageKeys.POZAS, data); // espejo local
      return data;
    } catch (err) {
      console.warn('Fallo consulta Supabase pozas, usando LocalStorage:', err);
    }
  }
  return getLocalCollection(APP_CONFIG.storageKeys.POZAS);
}

export async function createPoza(pozaData) {
  const newPoza = {
    id: pozaData.id || generateLocalUUID(),
    codigo: (pozaData.codigo || `PZ-${Date.now().toString().slice(-4)}`).toUpperCase(),
    nombre: pozaData.nombre,
    tipo: pozaData.tipo || 'Reproducción',
    capacidad_maxima: parseInt(pozaData.capacidad_maxima) || 10,
    ubicacion_galpon: pozaData.ubicacion_galpon || 'Galpón 1',
    estado: pozaData.estado || 'Activa',
    observaciones: pozaData.observaciones || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('pozas').insert([newPoza]).select().single();
      if (error) throw error;
      // Actualizar también localmente
      const local = getLocalCollection(APP_CONFIG.storageKeys.POZAS);
      local.push(data || newPoza);
      setLocalCollection(APP_CONFIG.storageKeys.POZAS, local);
      return data || newPoza;
    } catch (err) {
      console.warn('Fallo insert Supabase poza, guardando localmente:', err);
    }
  }

  const list = getLocalCollection(APP_CONFIG.storageKeys.POZAS);
  list.push(newPoza);
  setLocalCollection(APP_CONFIG.storageKeys.POZAS, list);
  return newPoza;
}

// ==============================================================================
// GESTIÓN DE CUYES
// ==============================================================================
export async function getCuyes(filters = {}) {
  const sb = getSupabase();
  let list = [];

  if (sb) {
    try {
      let query = sb.from('cuyes').select(`
        *,
        poza:pozas(id, codigo, nombre)
      `).order('codigo', { ascending: true });

      if (filters.etapa) query = query.eq('etapa', filters.etapa);
      if (filters.genero) query = query.eq('genero', filters.genero);
      if (filters.estado_salud) query = query.eq('estado_salud', filters.estado_salud);
      if (filters.raza) query = query.eq('raza', filters.raza);
      if (filters.poza_id) query = query.eq('poza_id', filters.poza_id);

      const { data, error } = await query;
      if (error) throw error;
      setLocalCollection(APP_CONFIG.storageKeys.CUYES, data);
      list = data;
    } catch (err) {
      console.warn('Fallo consulta Supabase cuyes, usando LocalStorage:', err);
      list = getLocalCollection(APP_CONFIG.storageKeys.CUYES);
    }
  } else {
    list = getLocalCollection(APP_CONFIG.storageKeys.CUYES);
  }

  // Si estamos en modo local, resolver relación con poza
  const pozas = getLocalCollection(APP_CONFIG.storageKeys.POZAS);
  const pozaMap = new Map(pozas.map(p => [p.id, p]));

  let enriched = list.map(cuy => {
    return {
      ...cuy,
      poza: cuy.poza || (cuy.poza_id ? pozaMap.get(cuy.poza_id) : null)
    };
  });

  // Aplicar filtros en memoria si es local
  if (!sb) {
    if (filters.etapa) enriched = enriched.filter(c => c.etapa === filters.etapa);
    if (filters.genero) enriched = enriched.filter(c => c.genero === filters.genero);
    if (filters.estado_salud) enriched = enriched.filter(c => c.estado_salud === filters.estado_salud);
    if (filters.raza) enriched = enriched.filter(c => c.raza === filters.raza);
    if (filters.poza_id) enriched = enriched.filter(c => c.poza_id === filters.poza_id);
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      enriched = enriched.filter(c => 
        (c.codigo && c.codigo.toLowerCase().includes(q)) ||
        (c.nombre && c.nombre.toLowerCase().includes(q)) ||
        (c.raza && c.raza.toLowerCase().includes(q))
      );
    }
  }

  return enriched;
}

export async function getCuyById(id) {
  const cuyes = await getCuyes();
  return cuyes.find(c => c.id === id) || null;
}

export async function createCuy(cuyData) {
  const newCuy = {
    id: cuyData.id || generateLocalUUID(),
    codigo: (cuyData.codigo || `CUY-${Date.now().toString().slice(-4)}`).toUpperCase(),
    nombre: cuyData.nombre || '',
    raza: cuyData.raza || 'Perú',
    genero: cuyData.genero || 'Hembra',
    etapa: cuyData.etapa || 'Recría',
    peso_actual_g: parseFloat(cuyData.peso_actual_g) || 300,
    fecha_nacimiento: cuyData.fecha_nacimiento || new Date().toISOString().split('T')[0],
    poza_id: cuyData.poza_id || null,
    padre_id: cuyData.padre_id || null,
    madre_id: cuyData.madre_id || null,
    estado_salud: cuyData.estado_salud || 'Sano',
    activo: cuyData.activo !== undefined ? cuyData.activo : true,
    observaciones: cuyData.observaciones || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('cuyes').insert([newCuy]).select().single();
      if (error) throw error;
      const local = getLocalCollection(APP_CONFIG.storageKeys.CUYES);
      local.push(data || newCuy);
      setLocalCollection(APP_CONFIG.storageKeys.CUYES, local);
      return data || newCuy;
    } catch (err) {
      console.warn('Fallo insert Supabase cuy, guardando localmente:', err);
    }
  }

  const list = getLocalCollection(APP_CONFIG.storageKeys.CUYES);
  list.push(newCuy);
  setLocalCollection(APP_CONFIG.storageKeys.CUYES, list);
  return newCuy;
}

export async function updateCuy(id, updates) {
  const updatedData = {
    ...updates,
    updated_at: new Date().toISOString()
  };
  if (updatedData.peso_actual_g) {
    updatedData.peso_actual_g = parseFloat(updatedData.peso_actual_g);
  }

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('cuyes').update(updatedData).eq('id', id).select().single();
      if (error) throw error;
      const list = getLocalCollection(APP_CONFIG.storageKeys.CUYES);
      const index = list.findIndex(c => c.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...(data || updatedData) };
        setLocalCollection(APP_CONFIG.storageKeys.CUYES, list);
      }
      return data || list[index];
    } catch (err) {
      console.warn('Fallo update Supabase cuy, actualizando localmente:', err);
    }
  }

  const list = getLocalCollection(APP_CONFIG.storageKeys.CUYES);
  const index = list.findIndex(c => c.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updatedData };
    setLocalCollection(APP_CONFIG.storageKeys.CUYES, list);
    return list[index];
  }
  return null;
}

export async function deleteCuy(id) {
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('cuyes').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Fallo delete Supabase cuy, aplicando localmente:', err);
    }
  }

  const list = getLocalCollection(APP_CONFIG.storageKeys.CUYES);
  const filtered = list.filter(c => c.id !== id);
  setLocalCollection(APP_CONFIG.storageKeys.CUYES, filtered);
  return true;
}

// ==============================================================================
// GESTIÓN DE REPRODUCCIÓN (EMPADRES Y PARTOS)
// ==============================================================================
export async function getEmpadres() {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('empadres').select(`
        *,
        macho:cuyes!macho_id(id, codigo, nombre, raza),
        poza:pozas(id, codigo, nombre)
      `).order('fecha_inicio', { ascending: false });
      if (error) throw error;
      setLocalCollection(APP_CONFIG.storageKeys.EMPADRES, data);
      return data;
    } catch (err) {
      console.warn('Fallo consulta Supabase empadres, usando LocalStorage:', err);
    }
  }

  const list = getLocalCollection(APP_CONFIG.storageKeys.EMPADRES);
  const cuyes = getLocalCollection(APP_CONFIG.storageKeys.CUYES);
  const pozas = getLocalCollection(APP_CONFIG.storageKeys.POZAS);
  const cuyMap = new Map(cuyes.map(c => [c.id, c]));
  const pozaMap = new Map(pozas.map(p => [p.id, p]));

  return list.map(e => ({
    ...e,
    macho: cuyMap.get(e.macho_id) || null,
    poza: pozaMap.get(e.poza_id) || null
  }));
}

export async function createEmpadre(empadreData) {
  // Cálculo automático de fecha estimada de parto (68 días después de fecha_inicio)
  const fechaInicio = new Date(empadreData.fecha_inicio || new Date());
  const fechaPartoEstimada = new Date(fechaInicio);
  fechaPartoEstimada.setDate(fechaPartoEstimada.getDate() + APP_CONFIG.zootech.diasGestacionPromedio);

  const newEmpadre = {
    id: empadreData.id || generateLocalUUID(),
    codigo: (empadreData.codigo || `EMP-${Date.now().toString().slice(-4)}`).toUpperCase(),
    macho_id: empadreData.macho_id,
    poza_id: empadreData.poza_id || null,
    fecha_inicio: empadreData.fecha_inicio || new Date().toISOString().split('T')[0],
    fecha_fin: empadreData.fecha_fin || null,
    fecha_estimada_parto: empadreData.fecha_estimada_parto || fechaPartoEstimada.toISOString().split('T')[0],
    estado: empadreData.estado || 'Activo',
    observaciones: empadreData.observaciones || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('empadres').insert([newEmpadre]).select().single();
      if (error) throw error;
      const local = getLocalCollection(APP_CONFIG.storageKeys.EMPADRES);
      local.push(data || newEmpadre);
      setLocalCollection(APP_CONFIG.storageKeys.EMPADRES, local);
      return data || newEmpadre;
    } catch (err) {
      console.warn('Fallo insert Supabase empadre, guardando localmente:', err);
    }
  }

  const list = getLocalCollection(APP_CONFIG.storageKeys.EMPADRES);
  list.push(newEmpadre);
  setLocalCollection(APP_CONFIG.storageKeys.EMPADRES, list);
  return newEmpadre;
}

export async function updateEmpadre(id, updates) {
  const updatedData = { ...updates, updated_at: new Date().toISOString() };
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('empadres').update(updatedData).eq('id', id).select().single();
      if (error) throw error;
      const list = getLocalCollection(APP_CONFIG.storageKeys.EMPADRES);
      const idx = list.findIndex(e => e.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...(data || updatedData) };
        setLocalCollection(APP_CONFIG.storageKeys.EMPADRES, list);
      }
      return data || list[idx];
    } catch (err) {
      console.warn('Fallo update Supabase empadre:', err);
    }
  }

  const list = getLocalCollection(APP_CONFIG.storageKeys.EMPADRES);
  const idx = list.findIndex(e => e.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedData };
    setLocalCollection(APP_CONFIG.storageKeys.EMPADRES, list);
    return list[idx];
  }
  return null;
}

export async function getPartos() {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('partos_camadas').select(`
        *,
        madre:cuyes!madre_id(id, codigo, nombre, raza),
        empadre:empadres(id, codigo)
      `).order('fecha_parto', { ascending: false });
      if (error) throw error;
      setLocalCollection(APP_CONFIG.storageKeys.PARTOS, data);
      return data;
    } catch (err) {
      console.warn('Fallo consulta Supabase partos, usando LocalStorage:', err);
    }
  }

  const list = getLocalCollection(APP_CONFIG.storageKeys.PARTOS);
  const cuyes = getLocalCollection(APP_CONFIG.storageKeys.CUYES);
  const empadres = getLocalCollection(APP_CONFIG.storageKeys.EMPADRES);
  const cuyMap = new Map(cuyes.map(c => [c.id, c]));
  const empadreMap = new Map(empadres.map(e => [e.id, e]));

  return list.map(p => ({
    ...p,
    madre: cuyMap.get(p.madre_id) || null,
    empadre: empadreMap.get(p.empadre_id) || null
  }));
}

export async function createParto(partoData) {
  const fechaParto = new Date(partoData.fecha_parto || new Date());
  const fechaDestete = new Date(fechaParto);
  fechaDestete.setDate(fechaDestete.getDate() + APP_CONFIG.zootech.diasDestetePromedio);

  const newParto = {
    id: partoData.id || generateLocalUUID(),
    codigo: (partoData.codigo || `CAM-${Date.now().toString().slice(-4)}`).toUpperCase(),
    empadre_id: partoData.empadre_id || null,
    madre_id: partoData.madre_id,
    fecha_parto: partoData.fecha_parto || new Date().toISOString().split('T')[0],
    crias_vivas: parseInt(partoData.crias_vivas) || 0,
    crias_muertas: parseInt(partoData.crias_muertas) || 0,
    peso_promedio_nacimiento_g: parseFloat(partoData.peso_promedio_nacimiento_g) || APP_CONFIG.zootech.pesoIdealNacimientoG,
    fecha_destete_programada: partoData.fecha_destete_programada || fechaDestete.toISOString().split('T')[0],
    estado_destete: partoData.estado_destete || 'Pendiente',
    observaciones: partoData.observaciones || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('partos_camadas').insert([newParto]).select().single();
      if (error) throw error;
      const local = getLocalCollection(APP_CONFIG.storageKeys.PARTOS);
      local.push(data || newParto);
      setLocalCollection(APP_CONFIG.storageKeys.PARTOS, local);
      return data || newParto;
    } catch (err) {
      console.warn('Fallo insert Supabase parto:', err);
    }
  }

  const list = getLocalCollection(APP_CONFIG.storageKeys.PARTOS);
  list.push(newParto);
  setLocalCollection(APP_CONFIG.storageKeys.PARTOS, list);
  return newParto;
}

// ==============================================================================
// GESTIÓN DE REGISTROS MÉDICOS Y SANIDAD
// ==============================================================================
export async function getRegistrosMedicos() {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('registros_medicos').select(`
        *,
        cuy:cuyes(id, codigo, nombre, estado_salud, poza_id)
      `).order('fecha_diagnostico', { ascending: false });
      if (error) throw error;
      setLocalCollection(APP_CONFIG.storageKeys.SALUD, data);
      return data;
    } catch (err) {
      console.warn('Fallo consulta Supabase registros médicos:', err);
    }
  }

  const list = getLocalCollection(APP_CONFIG.storageKeys.SALUD);
  const cuyes = getLocalCollection(APP_CONFIG.storageKeys.CUYES);
  const cuyMap = new Map(cuyes.map(c => [c.id, c]));

  return list.map(r => ({
    ...r,
    cuy: cuyMap.get(r.cuy_id) || null
  }));
}

export async function createRegistroMedico(registroData) {
  const newRegistro = {
    id: registroData.id || generateLocalUUID(),
    cuy_id: registroData.cuy_id,
    fecha_diagnostico: registroData.fecha_diagnostico || new Date().toISOString().split('T')[0],
    tipo_evento: registroData.tipo_evento || 'Tratamiento',
    diagnostico: registroData.diagnostico || '',
    medicamento: registroData.medicamento || '',
    dosis: registroData.dosis || '',
    veterinario_responsable: registroData.veterinario_responsable || 'Personal Veterinario',
    fecha_seguimiento: registroData.fecha_seguimiento || null,
    estado: registroData.estado || 'En Tratamiento',
    costo_tratamiento: parseFloat(registroData.costo_tratamiento) || 0.00,
    observaciones: registroData.observaciones || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('registros_medicos').insert([newRegistro]).select().single();
      if (error) throw error;
      const local = getLocalCollection(APP_CONFIG.storageKeys.SALUD);
      local.push(data || newRegistro);
      setLocalCollection(APP_CONFIG.storageKeys.SALUD, local);

      // Si el estado es "En Tratamiento", actualizar estado de salud del cuy a "Enfermo"
      if (newRegistro.estado === 'En Tratamiento') {
        await updateCuy(newRegistro.cuy_id, { estado_salud: 'Enfermo' });
      }
      return data || newRegistro;
    } catch (err) {
      console.warn('Fallo insert Supabase registro médico:', err);
    }
  }

  const list = getLocalCollection(APP_CONFIG.storageKeys.SALUD);
  list.push(newRegistro);
  setLocalCollection(APP_CONFIG.storageKeys.SALUD, list);

  // Actualizar estado del cuy en memoria/local
  if (newRegistro.estado === 'En Tratamiento') {
    await updateCuy(newRegistro.cuy_id, { estado_salud: 'Enfermo' });
  }

  return newRegistro;
}

export async function updateRegistroMedico(id, updates) {
  const updatedData = { ...updates, updated_at: new Date().toISOString() };
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('registros_medicos').update(updatedData).eq('id', id).select().single();
      if (error) throw error;
      const list = getLocalCollection(APP_CONFIG.storageKeys.SALUD);
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...(data || updatedData) };
        setLocalCollection(APP_CONFIG.storageKeys.SALUD, list);
      }
      return data || list[idx];
    } catch (err) {
      console.warn('Fallo update Supabase registro médico:', err);
    }
  }

  const list = getLocalCollection(APP_CONFIG.storageKeys.SALUD);
  const idx = list.findIndex(r => r.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedData };
    setLocalCollection(APP_CONFIG.storageKeys.SALUD, list);
    return list[idx];
  }
  return null;
}

// ==============================================================================
// CÁLCULO DE MÉTRICAS Y KPIS PARA EL DASHBOARD
// ==============================================================================
export async function getDashboardStats() {
  const [cuyes, empadres, partos, salud, pozas] = await Promise.all([
    getCuyes(),
    getEmpadres(),
    getPartos(),
    getRegistrosMedicos(),
    getPozas()
  ]);

  const cuyesActivos = cuyes.filter(c => c.activo !== false);
  const totalCuyes = cuyesActivos.length;

  const machos = cuyesActivos.filter(c => c.genero === 'Macho').length;
  const hembras = cuyesActivos.filter(c => c.genero === 'Hembra').length;

  // Por etapas
  const crias = cuyesActivos.filter(c => c.etapa === 'Cría').length;
  const recrias = cuyesActivos.filter(c => c.etapa === 'Recría').length;
  const reproductores = cuyesActivos.filter(c => c.etapa === 'Reproductor').length;
  const engorde = cuyesActivos.filter(c => c.etapa === 'Engorde').length;

  // Salud
  const enfermos = cuyesActivos.filter(c => c.estado_salud === 'Enfermo' || c.estado_salud === 'Cuarentena').length;
  const enObservacion = cuyesActivos.filter(c => c.estado_salud === 'En Observación').length;
  const tratamientosActivos = salud.filter(s => s.estado === 'En Tratamiento').length;

  // Reproducción y camadas
  const totalNacidosVivos = partos.reduce((acc, p) => acc + (parseInt(p.crias_vivas) || 0), 0);
  const totalNacidosMuertos = partos.reduce((acc, p) => acc + (parseInt(p.crias_muertas) || 0), 0);
  const totalNacimientos = totalNacidosVivos + totalNacidosMuertos;
  const tasaMortalidadPerinatal = totalNacimientos > 0 
    ? ((totalNacidosMuertos / totalNacimientos) * 100).toFixed(1) 
    : '0.0';
  const promedioCriasPorCamada = partos.length > 0 
    ? (totalNacidosVivos / partos.length).toFixed(1) 
    : '0.0';

  const empadresActivos = empadres.filter(e => e.estado === 'Activo' || e.estado === 'Gestación').length;

  // Capacidad de Pozas
  const capacidadTotalPozas = pozas.reduce((acc, p) => acc + (parseInt(p.capacidad_maxima) || 0), 0);
  const ocupacionPorcentaje = capacidadTotalPozas > 0 
    ? Math.round((totalCuyes / capacidadTotalPozas) * 100) 
    : 0;

  // Distribución por Razas
  const razasMap = {};
  cuyesActivos.forEach(c => {
    const raza = c.raza || 'Otra';
    razasMap[raza] = (razasMap[raza] || 0) + 1;
  });

  return {
    totalCuyes,
    machos,
    hembras,
    etapas: {
      crias,
      recrias,
      reproductores,
      engorde
    },
    salud: {
      enfermos,
      enObservacion,
      tratamientosActivos
    },
    reproduccion: {
      empadresActivos,
      totalPartos: partos.length,
      totalNacidosVivos,
      totalNacidosMuertos,
      tasaMortalidadPerinatal,
      promedioCriasPorCamada
    },
    pozas: {
      totalPozas: pozas.length,
      capacidadTotalPozas,
      ocupacionPorcentaje
    },
    distribucionRazas: razasMap
  };
}

// ==============================================================================
// UTILIDADES DE RESPALDO Y RESTAURACIÓN
// ==============================================================================
export function resetToDemoData() {
  localStorage.setItem(APP_CONFIG.storageKeys.POZAS, JSON.stringify(MOCK_POZAS));
  localStorage.setItem(APP_CONFIG.storageKeys.CUYES, JSON.stringify(MOCK_CUYES));
  localStorage.setItem(APP_CONFIG.storageKeys.EMPADRES, JSON.stringify(MOCK_EMPADRES));
  localStorage.setItem(APP_CONFIG.storageKeys.PARTOS, JSON.stringify(MOCK_PARTOS));
  localStorage.setItem(APP_CONFIG.storageKeys.SALUD, JSON.stringify(MOCK_REGISTROS_MEDICOS));
  return true;
}

export function exportAllData() {
  return {
    version: APP_CONFIG.version,
    exportDate: new Date().toISOString(),
    pozas: getLocalCollection(APP_CONFIG.storageKeys.POZAS),
    cuyes: getLocalCollection(APP_CONFIG.storageKeys.CUYES),
    empadres: getLocalCollection(APP_CONFIG.storageKeys.EMPADRES),
    partos: getLocalCollection(APP_CONFIG.storageKeys.PARTOS),
    registrosMedicos: getLocalCollection(APP_CONFIG.storageKeys.SALUD)
  };
}

export function importAllData(jsonData) {
  try {
    if (jsonData.pozas) setLocalCollection(APP_CONFIG.storageKeys.POZAS, jsonData.pozas);
    if (jsonData.cuyes) setLocalCollection(APP_CONFIG.storageKeys.CUYES, jsonData.cuyes);
    if (jsonData.empadres) setLocalCollection(APP_CONFIG.storageKeys.EMPADRES, jsonData.empadres);
    if (jsonData.partos) setLocalCollection(APP_CONFIG.storageKeys.PARTOS, jsonData.partos);
    if (jsonData.registrosMedicos) setLocalCollection(APP_CONFIG.storageKeys.SALUD, jsonData.registrosMedicos);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
