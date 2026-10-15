// ==============================================================================
// SISGRANJA - CONTROLADOR PRINCIPAL Y ENRUTADOR DE LA APLICACIÓN
// ==============================================================================

import { initSupabaseClient, onConnectionStateChange } from './supabaseClient.js';
import { renderDashboard } from './components/dashboard.js';
import { renderCuyes } from './components/cuyes.js';
import { renderReproduccion } from './components/reproduccion.js';
import { renderSalud } from './components/salud.js';
import { renderPozas } from './components/pozas.js';
import { renderReportes } from './components/reportes.js';

// Mapeo de rutas por Hash
const ROUTES = {
  '#dashboard': { title: 'Dashboard', render: renderDashboard },
  '#cuyes': { title: 'Gestión de Cuyes', render: renderCuyes },
  '#reproduccion': { title: 'Reproducción & Camadas', render: renderReproduccion },
  '#salud': { title: 'Sanidad & Veterinaria', render: renderSalud },
  '#pozas': { title: 'Pozas & Lotes', render: renderPozas },
  '#reportes': { title: 'Reportes & Conectividad', render: renderReportes }
};

// Sistema Global de Toasts / Notificaciones
window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const id = `toast-${Date.now()}`;
  toast.id = id;

  const bgColors = {
    success: 'bg-emerald-800 text-white border-emerald-600',
    error: 'bg-rose-800 text-white border-rose-600',
    warning: 'bg-amber-800 text-white border-amber-600',
    info: 'bg-stone-900 text-white border-stone-700'
  };

  const icons = {
    success: '<i data-lucide="check-circle" class="w-5 h-5 text-emerald-300 mr-2 shrink-0"></i>',
    error: '<i data-lucide="alert-octagon" class="w-5 h-5 text-rose-300 mr-2 shrink-0"></i>',
    warning: '<i data-lucide="alert-triangle" class="w-5 h-5 text-amber-300 mr-2 shrink-0"></i>',
    info: '<i data-lucide="info" class="w-5 h-5 text-sky-300 mr-2 shrink-0"></i>'
  };

  toast.className = `flex items-center p-3.5 rounded-xl shadow-xl border ${bgColors[type] || bgColors.info} text-xs font-semibold animate-slide-in pointer-events-auto transition-all max-w-sm`;
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <div class="flex-1">${message}</div>
    <button onclick="this.parentElement.remove()" class="ml-2 text-stone-300 hover:text-white p-1">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.classList.add('opacity-0', 'scale-95');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Enrutamiento Principal
async function handleRouting() {
  const hash = window.location.hash || '#dashboard';
  const route = ROUTES[hash] || ROUTES['#dashboard'];

  // Actualizar clases activas en los enlaces de la barra de navegación
  document.querySelectorAll('[data-route-link]').forEach(link => {
    const target = link.getAttribute('href');
    if (target === hash || (!window.location.hash && target === '#dashboard')) {
      link.classList.add('bg-emerald-700/80', 'text-white', 'shadow-sm');
      link.classList.remove('text-stone-300', 'hover:bg-emerald-800/60');
    } else {
      link.classList.remove('bg-emerald-700/80', 'text-white', 'shadow-sm');
      link.classList.add('text-stone-300', 'hover:bg-emerald-800/60');
    }
  });

  const mainContainer = document.getElementById('main-content');
  if (mainContainer) {
    mainContainer.innerHTML = `
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="flex flex-col items-center">
          <div class="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs font-semibold text-stone-500 mt-3">Cargando módulo pecuario...</span>
        </div>
      </div>
    `;

    try {
      await route.render(mainContainer);
    } catch (error) {
      console.error('Error renderizando ruta:', error);
      mainContainer.innerHTML = `
        <div class="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <i data-lucide="alert-circle" class="w-10 h-10 text-rose-500 mx-auto mb-2"></i>
          <h2 class="text-base font-bold text-rose-900">Error al cargar el módulo</h2>
          <p class="text-xs text-rose-700 mt-1">${error.message}</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  // Cerrar menú móvil si estuviera abierto
  const sidebar = document.getElementById('mobile-sidebar');
  if (sidebar && !sidebar.classList.contains('hidden')) {
    sidebar.classList.add('hidden');
  }
}

// Configuración del badge de estado de conexión
function setupConnectionBadge() {
  const badge = document.getElementById('connection-status-badge');
  const label = document.getElementById('connection-status-label');
  const dot = document.getElementById('connection-status-dot');

  onConnectionStateChange((state) => {
    if (!badge || !label || !dot) return;

    if (state.isConnected && state.mode === 'supabase') {
      badge.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300';
      dot.className = 'w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse';
      label.textContent = 'Supabase Cloud';
      badge.title = 'Conectado a base de datos PostgreSQL en Supabase';
    } else {
      badge.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300';
      dot.className = 'w-2 h-2 rounded-full bg-amber-500 mr-2';
      label.textContent = 'Modo Local (Respaldo)';
      badge.title = 'Operando sin conexión externa (LocalStorage activado)';
    }
  });
}

// Inicialización de la Aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) window.lucide.createIcons();

  setupConnectionBadge();

  // Menú móvil responsive
  const btnToggleMenu = document.getElementById('btn-toggle-menu');
  const btnCloseMenu = document.getElementById('btn-close-menu');
  const mobileSidebar = document.getElementById('mobile-sidebar');

  if (btnToggleMenu && mobileSidebar) {
    btnToggleMenu.addEventListener('click', () => {
      mobileSidebar.classList.remove('hidden');
    });
  }

  if (btnCloseMenu && mobileSidebar) {
    btnCloseMenu.addEventListener('click', () => {
      mobileSidebar.classList.add('hidden');
    });
  }

  // Escuchar cambios de Hash en URL
  window.addEventListener('hashchange', handleRouting);

  // Intentar conectar con Supabase en segundo plano sin bloquear la UI
  initSupabaseClient().catch(err => {
    console.warn('Fallo chequeo de Supabase en inicio, operando en modo local:', err);
  });

  // Renderizar la ruta inicial
  await handleRouting();
});
