// ==============================================================================
// SISGRANJA - CLIENTE Y CONECTIVIDAD SUPABASE
// ==============================================================================

import { APP_CONFIG } from './config.js';

let supabaseInstance = null;
let connectionState = {
  isConfigured: false,
  isConnected: false,
  mode: 'local', // 'supabase' | 'local'
  lastChecked: null,
  error: null
};

// Listeners para cambios de estado de conexión
const stateListeners = [];

export function onConnectionStateChange(listener) {
  stateListeners.push(listener);
  // Notificar estado actual inmediatamente
  listener(connectionState);
}

function notifyListeners() {
  stateListeners.forEach(listener => {
    try {
      listener({ ...connectionState });
    } catch (e) {
      console.error('Error en listener de conexión:', e);
    }
  });
}

/**
 * Obtiene las credenciales actuales guardadas en localStorage o por defecto
 */
export function getSavedCredentials() {
  try {
    const saved = localStorage.getItem(APP_CONFIG.storageKeys.SUPABASE_CREDENTIALS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey && !parsed.anonKey.includes('demo-anon-key') && !parsed.url.includes('ejemplo-tu-proyecto')) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('No se pudieron leer credenciales guardadas de Supabase:', e);
  }
  return {
    url: APP_CONFIG.supabaseDefaults.url,
    anonKey: APP_CONFIG.supabaseDefaults.anonKey
  };
}

/**
 * Guarda nuevas credenciales de Supabase en localStorage
 */
export function saveCredentials(url, anonKey) {
  const cleanUrl = (url || '').trim();
  const cleanKey = (anonKey || '').trim();
  
  localStorage.setItem(APP_CONFIG.storageKeys.SUPABASE_CREDENTIALS, JSON.stringify({
    url: cleanUrl,
    anonKey: cleanKey
  }));

  // Reinicializar cliente
  return initSupabaseClient(cleanUrl, cleanKey);
}

/**
 * Inicializa la instancia del cliente de Supabase
 */
export async function initSupabaseClient(explicitUrl = null, explicitKey = null) {
  const creds = explicitUrl && explicitKey 
    ? { url: explicitUrl, anonKey: explicitKey }
    : getSavedCredentials();

  // Validar si las credenciales tienen formato válido de Supabase
  const isValidUrl = creds.url && creds.url.startsWith('https://') && creds.url.includes('.supabase.co');
  const isValidKey = creds.anonKey && (creds.anonKey.startsWith('sb_publishable_') || creds.anonKey.startsWith('eyJ') || creds.anonKey.length > 20) && !creds.anonKey.includes('demo-anon-key');

  if (!isValidUrl || !isValidKey) {
    connectionState = {
      isConfigured: false,
      isConnected: false,
      mode: 'local',
      lastChecked: new Date(),
      error: 'Sin credenciales activas de Supabase. Operando en modo Local (LocalStorage).'
    };
    supabaseInstance = null;
    notifyListeners();
    return { success: false, mode: 'local', error: connectionState.error };
  }

  // Verificar si la librería CDN de Supabase está cargada en window
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    connectionState = {
      isConfigured: true,
      isConnected: false,
      mode: 'local',
      lastChecked: new Date(),
      error: 'Librería @supabase/supabase-js no detectada en el navegador. Usando modo Local.'
    };
    notifyListeners();
    return { success: false, mode: 'local', error: connectionState.error };
  }

  try {
    supabaseInstance = window.supabase.createClient(creds.url, creds.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });

    connectionState.isConfigured = true;

    // Testear conexión con un ping a la tabla de pozas o cuyes
    const testResult = await testConnection();
    return testResult;
  } catch (error) {
    console.error('Error inicializando Supabase:', error);
    connectionState = {
      isConfigured: true,
      isConnected: false,
      mode: 'local',
      lastChecked: new Date(),
      error: error.message || 'Fallo de conexión al inicializar cliente.'
    };
    supabaseInstance = null;
    notifyListeners();
    return { success: false, mode: 'local', error: connectionState.error };
  }
}

/**
 * Verifica la conectividad real con Supabase ejecutando una consulta ligera
 */
export async function testConnection() {
  if (!supabaseInstance) {
    return { success: false, mode: 'local', message: 'Cliente no instanciado.' };
  }

  try {
    // Intentar leer 1 registro de pozas con timeout de 4 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const { data, error } = await supabaseInstance
      .from('pozas')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      throw error;
    }

    connectionState = {
      isConfigured: true,
      isConnected: true,
      mode: 'supabase',
      lastChecked: new Date(),
      error: null
    };
    notifyListeners();
    return { success: true, mode: 'supabase', message: 'Conectado exitosamente con Supabase.' };
  } catch (error) {
    console.warn('Prueba de conexión con Supabase fallida. Conmutando a modo de Respaldo Local:', error);
    connectionState = {
      isConfigured: true,
      isConnected: false,
      mode: 'local',
      lastChecked: new Date(),
      error: error.message || 'No se pudo conectar a la base de datos Supabase.'
    };
    notifyListeners();
    return { success: false, mode: 'local', error: connectionState.error };
  }
}

/**
 * Retorna la instancia de Supabase actual (o null si está en modo local)
 */
export function getSupabase() {
  return connectionState.isConnected ? supabaseInstance : null;
}

/**
 * Retorna el estado actual de la conexión
 */
export function getConnectionState() {
  return { ...connectionState };
}
