// ==============================================================================
// SISGRANJA - VISTA Y CONTROL DE POZAS / INFRAESTRUCTURA
// ==============================================================================

import { getPozas, createPoza, getCuyes } from '../storageManager.js';
import { APP_CONFIG } from '../config.js';

let allPozas = [];
let allCuyes = [];

export async function renderPozas(container) {
  const [pozas, cuyes] = await Promise.all([
    getPozas(),
    getCuyes()
  ]);

  allPozas = pozas;
  allCuyes = cuyes;

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <!-- Encabezado del Módulo -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-stone-900 tracking-tight flex items-center">
            <span class="p-2 bg-amber-100 text-amber-700 rounded-xl mr-3 inline-flex">
              <i data-lucide="layout-grid" class="w-6 h-6"></i>
            </span>
            Pozas e Infraestructura
          </h1>
          <p class="text-stone-500 text-sm mt-1">Supervisión física de densidades, capacidad por metro cuadrado y bioseguridad.</p>
        </div>
        <button id="btn-open-new-poza-modal" class="inline-flex items-center px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold shadow-md transition hover:shadow-amber-600/30">
          <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Nueva Poza
        </button>
      </div>

      <!-- Cuadrícula de Pozas -->
      <div id="pozas-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <!-- Tarjetas dinámicas -->
      </div>
    </div>

    <!-- MODAL: Crear Poza -->
    <div id="modal-poza-form" class="fixed inset-0 z-50 hidden bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-stone-200 overflow-hidden animate-scale-up my-8">
        <div class="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <h2 class="font-bold text-stone-900 text-lg flex items-center">
            <i data-lucide="home" class="w-5 h-5 text-amber-600 mr-2"></i>
            Registrar Nueva Poza / Lote
          </h2>
          <button id="btn-close-poza-modal" class="text-stone-400 hover:text-stone-600 p-1">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="form-poza" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Código de Poza <span class="text-rose-500">*</span></label>
              <input type="text" id="poza-codigo" required placeholder="PZ-REP-02" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 uppercase font-mono" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Tipo de Poza <span class="text-rose-500">*</span></label>
              <select id="poza-tipo" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500">
                ${APP_CONFIG.tiposPozas.map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">Nombre Descriptivo <span class="text-rose-500">*</span></label>
            <input type="text" id="poza-nombre" required placeholder="Ej: Poza Recría 3 - Galpón 2" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Capacidad Máxima (cuyes) <span class="text-rose-500">*</span></label>
              <input type="number" id="poza-capacidad" required min="1" max="40" value="10" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Ubicación / Galpón</label>
              <input type="text" id="poza-ubicacion" placeholder="Galpón 1" value="Galpón 1" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">Observaciones</label>
            <textarea id="poza-observaciones" rows="2" placeholder="Dimensiones, tipo de bebedero o comedero..." class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"></textarea>
          </div>

          <div class="pt-4 border-t border-stone-200 flex justify-end gap-3">
            <button type="button" id="btn-cancel-poza-form" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-semibold transition">
              Cancelar
            </button>
            <button type="submit" class="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold shadow-md transition">
              Guardar Poza
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  setupPozasEvents();
  renderPozasCards();
}

function setupPozasEvents() {
  const modal = document.getElementById('modal-poza-form');
  const btnOpen = document.getElementById('btn-open-new-poza-modal');
  const btnClose = document.getElementById('btn-close-poza-modal');
  const btnCancel = document.getElementById('btn-cancel-poza-form');
  const form = document.getElementById('form-poza');

  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      form.reset();
      const random = Math.floor(10 + Math.random() * 90);
      document.getElementById('poza-codigo').value = `PZ-GEN-${random}`;
      document.getElementById('poza-capacidad').value = 10;
      modal.classList.remove('hidden');
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', () => modal.classList.add('hidden'));
  }
  if (btnCancel) {
    btnCancel.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSavePoza();
    });
  }
}

function renderPozasCards() {
  const grid = document.getElementById('pozas-grid');
  if (!grid) return;

  grid.innerHTML = allPozas.map(p => {
    const cuyesEnPoza = allCuyes.filter(c => c.poza_id === p.id && c.activo !== false);
    const count = cuyesEnPoza.length;
    const max = parseInt(p.capacidad_maxima) || 10;
    const porcentaje = Math.round((count / max) * 100);

    let progressColor = 'bg-emerald-500';
    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

    if (porcentaje >= 100) {
      progressColor = 'bg-rose-500';
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (porcentaje >= 75) {
      progressColor = 'bg-amber-500';
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-5 flex flex-col justify-between hover:shadow-md transition">
        <div>
          <!-- Cabecera de la tarjeta -->
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-stone-900 font-mono text-sm">${p.codigo}</span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}">
              ${p.tipo}
            </span>
          </div>

          <h3 class="font-bold text-stone-800 text-base leading-tight">${p.nombre}</h3>
          <p class="text-xs text-stone-500 mt-1 flex items-center">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 mr-1 text-stone-400"></i> ${p.ubicacion_galpon || 'Galpón Principal'}
          </p>

          <!-- Barra de Capacidad y Ocupación -->
          <div class="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200/60">
            <div class="flex justify-between items-center text-xs mb-1.5 font-medium">
              <span class="text-stone-600">Ocupación</span>
              <span class="font-bold text-stone-900">${count} / ${max} cuyes (${porcentaje}%)</span>
            </div>
            <div class="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div class="${progressColor} h-2 rounded-full transition-all duration-300" style="width: ${Math.min(porcentaje, 100)}%"></div>
            </div>
          </div>

          <!-- Cuyes alojados -->
          <div class="mt-4">
            <span class="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
              Animales en Poza (${count}):
            </span>
            ${count > 0 ? `
              <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                ${cuyesEnPoza.map(c => `
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-stone-100 text-stone-700 border border-stone-200">
                    <span class="mr-1 text-[10px] font-bold ${c.genero === 'Macho' ? 'text-sky-600' : 'text-rose-600'}">${c.genero === 'Macho' ? '♂' : '♀'}</span>
                    ${c.codigo}
                  </span>
                `).join('')}
              </div>
            ` : `
              <p class="text-xs text-stone-400 italic">Poza disponible y vacía.</p>
            `}
          </div>
        </div>

        ${p.observaciones ? `
          <div class="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500">
            ${p.observaciones}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

async function handleSavePoza() {
  const data = {
    codigo: document.getElementById('poza-codigo').value.trim(),
    tipo: document.getElementById('poza-tipo').value,
    nombre: document.getElementById('poza-nombre').value.trim(),
    capacidad_maxima: document.getElementById('poza-capacidad').value,
    ubicacion_galpon: document.getElementById('poza-ubicacion').value.trim(),
    observaciones: document.getElementById('poza-observaciones').value.trim()
  };

  try {
    await createPoza(data);
    window.showToast('Poza creada exitosamente', 'success');
    document.getElementById('modal-poza-form').classList.add('hidden');
    allPozas = await getPozas();
    renderPozasCards();
  } catch (err) {
    console.error('Error registrando poza:', err);
    window.showToast('Error al registrar poza', 'error');
  }
}
