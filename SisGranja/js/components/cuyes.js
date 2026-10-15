// ==============================================================================
// SISGRANJA - VISTA Y GESTIÓN INTEGRAL DE CUYES
// ==============================================================================

import { getCuyes, getCuyById, createCuy, updateCuy, deleteCuy, getPozas, getRegistrosMedicos, getPartos } from '../storageManager.js';
import { APP_CONFIG } from '../config.js';

let currentCuyes = [];
let allPozas = [];
let activeFilters = {
  search: '',
  etapa: '',
  genero: '',
  estado_salud: '',
  poza_id: ''
};

export async function renderCuyes(container) {
  allPozas = await getPozas();

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <!-- Encabezado del Módulo -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-stone-900 tracking-tight flex items-center">
            <span class="p-2 bg-emerald-100 text-emerald-700 rounded-xl mr-3 inline-flex">
              <i data-lucide="tag" class="w-6 h-6"></i>
            </span>
            Inventario de Cuyes
          </h1>
          <p class="text-stone-500 text-sm mt-1">Control individual, peso ponderal, genealogía y asignación de pozas.</p>
        </div>
        <button id="btn-open-create-cuy-modal" class="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-md transition duration-200 hover:shadow-emerald-600/30">
          <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Registrar Nuevo Cuy
        </button>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-stone-200/80 space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <!-- Búsqueda en texto libre -->
          <div class="md:col-span-2 relative">
            <i data-lucide="search" class="w-4 h-4 text-stone-400 absolute left-3 top-3"></i>
            <input type="text" id="filter-cuy-search" placeholder="Buscar por código, nombre o raza..." class="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition" />
          </div>

          <!-- Filtro Etapa -->
          <div>
            <select id="filter-cuy-etapa" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition">
              <option value="">Todas las etapas</option>
              ${APP_CONFIG.etapas.map(e => `<option value="${e.id}">${e.label}</option>`).join('')}
            </select>
          </div>

          <!-- Filtro Género -->
          <div>
            <select id="filter-cuy-genero" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition">
              <option value="">Cualquier género</option>
              <option value="Macho">Macho (♂)</option>
              <option value="Hembra">Hembra (♀)</option>
            </select>
          </div>

          <!-- Filtro Salud -->
          <div>
            <select id="filter-cuy-salud" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition">
              <option value="">Cualquier estado</option>
              ${APP_CONFIG.estadosSalud.map(s => `<option value="${s.id}">${s.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
          <span id="cuyes-counter-label">Cargando cuyes...</span>
          <button id="btn-clear-cuy-filters" class="text-emerald-600 hover:text-emerald-700 font-medium hover:underline flex items-center">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 mr-1"></i> Limpiar filtros
          </button>
        </div>
      </div>

      <!-- Tabla de Cuyes -->
      <div class="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-stone-600">
            <thead class="bg-stone-50 text-stone-700 text-xs uppercase font-semibold border-b border-stone-200/80">
              <tr>
                <th scope="col" class="py-3.5 px-4">Cuy / Arete</th>
                <th scope="col" class="py-3.5 px-3">Raza & Género</th>
                <th scope="col" class="py-3.5 px-3">Etapa</th>
                <th scope="col" class="py-3.5 px-3">Peso</th>
                <th scope="col" class="py-3.5 px-3">Edad / Nac.</th>
                <th scope="col" class="py-3.5 px-3">Alojamiento</th>
                <th scope="col" class="py-3.5 px-3">Estado</th>
                <th scope="col" class="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody id="cuyes-table-body" class="divide-y divide-stone-100">
              <!-- Filas dinámicas -->
            </tbody>
          </table>
        </div>
        <div id="cuyes-empty-state" class="hidden p-8 text-center text-stone-500">
          <i data-lucide="search-x" class="w-10 h-10 mx-auto text-stone-300 mb-2"></i>
          <p class="font-medium text-stone-700">No se encontraron cuyes con los filtros seleccionados</p>
          <p class="text-xs text-stone-400 mt-1">Prueba cambiando los criterios de búsqueda o registra uno nuevo.</p>
        </div>
      </div>
    </div>

    <!-- MODAL: Crear o Editar Cuy -->
    <div id="modal-cuy-form" class="fixed inset-0 z-50 hidden bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-stone-200 overflow-hidden animate-scale-up my-8">
        <div class="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <h2 id="modal-cuy-title" class="font-bold text-stone-900 text-lg flex items-center">
            <i data-lucide="tag" class="w-5 h-5 text-emerald-600 mr-2"></i>
            Registrar Nuevo Cuy
          </h2>
          <button id="btn-close-cuy-modal" class="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="form-cuy" class="p-6 space-y-4">
          <input type="hidden" id="cuy-form-id" />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Código / Arete -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Código / N° Arete <span class="text-rose-500">*</span></label>
              <div class="flex gap-2">
                <input type="text" id="cuy-form-codigo" required placeholder="CUY-2024-XXX" class="flex-1 px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white uppercase font-mono" />
                <button type="button" id="btn-generate-cuy-code" title="Generar código automático" class="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold border border-stone-300">
                  <i data-lucide="sparkles" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Nombre / Alias -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Nombre / Identificador</label>
              <input type="text" id="cuy-form-nombre" placeholder="Ej: Zeus, Manchas, etc." class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Raza -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Raza <span class="text-rose-500">*</span></label>
              <select id="cuy-form-raza" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white">
                ${APP_CONFIG.razas.map(r => `<option value="${r.id}">${r.label}</option>`).join('')}
              </select>
            </div>

            <!-- Género -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Género <span class="text-rose-500">*</span></label>
              <select id="cuy-form-genero" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white">
                <option value="Hembra">Hembra (♀)</option>
                <option value="Macho">Macho (♂)</option>
              </select>
            </div>

            <!-- Etapa -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Etapa Productiva <span class="text-rose-500">*</span></label>
              <select id="cuy-form-etapa" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white">
                ${APP_CONFIG.etapas.map(e => `<option value="${e.id}">${e.label}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Peso actual (g) -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Peso Actual (gramos) <span class="text-rose-500">*</span></label>
              <input type="number" id="cuy-form-peso" required min="50" max="3000" step="5" placeholder="Ej: 850" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white font-semibold text-stone-800" />
            </div>

            <!-- Fecha Nacimiento -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Fecha Nacimiento <span class="text-rose-500">*</span></label>
              <input type="date" id="cuy-form-nacimiento" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white" />
            </div>

            <!-- Poza / Lote -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Poza / Alojamiento</label>
              <select id="cuy-form-poza" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white">
                <option value="">Sin asignar</option>
                ${allPozas.map(p => `<option value="${p.id}">${p.codigo} - ${p.nombre}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Estado de Salud -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Estado de Salud <span class="text-rose-500">*</span></label>
              <select id="cuy-form-salud" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white">
                ${APP_CONFIG.estadosSalud.map(s => `<option value="${s.id}">${s.label}</option>`).join('')}
              </select>
            </div>

            <!-- Padre / Madre opcional -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Madre (Genealogía)</label>
              <select id="cuy-form-madre" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white">
                <option value="">Madre no especificada</option>
              </select>
            </div>
          </div>

          <!-- Observaciones -->
          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">Observaciones / Notas Zootécnicas</label>
            <textarea id="cuy-form-observaciones" rows="2" placeholder="Características especiales, coloración del manto, temperamento..." class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"></textarea>
          </div>

          <!-- Botones de Acción -->
          <div class="pt-4 border-t border-stone-200 flex justify-end gap-3">
            <button type="button" id="btn-cancel-cuy-form" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-semibold transition">
              Cancelar
            </button>
            <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-md transition">
              Guardar Cuy
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: Ficha Técnica Detallada del Cuy -->
    <div id="modal-cuy-details" class="fixed inset-0 z-50 hidden bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden animate-scale-up my-8">
        <div id="cuy-details-header" class="p-6 bg-gradient-to-r from-emerald-800 to-teal-800 text-white relative">
          <button id="btn-close-cuy-details" class="absolute top-4 right-4 text-emerald-200 hover:text-white">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
          <!-- Dinámico -->
        </div>
        <div id="cuy-details-body" class="p-6 space-y-4">
          <!-- Dinámico -->
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Inicializar listeners y datos
  setupListeners();
  await loadAndDisplayCuyes();
}

function setupListeners() {
  const searchInput = document.getElementById('filter-cuy-search');
  const etapaSelect = document.getElementById('filter-cuy-etapa');
  const generoSelect = document.getElementById('filter-cuy-genero');
  const saludSelect = document.getElementById('filter-cuy-salud');
  const btnClear = document.getElementById('btn-clear-cuy-filters');

  const onFilterChange = () => {
    activeFilters.search = searchInput ? searchInput.value : '';
    activeFilters.etapa = etapaSelect ? etapaSelect.value : '';
    activeFilters.genero = generoSelect ? generoSelect.value : '';
    activeFilters.estado_salud = saludSelect ? saludSelect.value : '';
    applyFiltersAndRender();
  };

  if (searchInput) searchInput.addEventListener('input', onFilterChange);
  if (etapaSelect) etapaSelect.addEventListener('change', onFilterChange);
  if (generoSelect) generoSelect.addEventListener('change', onFilterChange);
  if (saludSelect) saludSelect.addEventListener('change', onFilterChange);

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (etapaSelect) etapaSelect.value = '';
      if (generoSelect) generoSelect.value = '';
      if (saludSelect) saludSelect.value = '';
      activeFilters = { search: '', etapa: '', genero: '', estado_salud: '', poza_id: '' };
      applyFiltersAndRender();
    });
  }

  // Modales
  const btnOpenModal = document.getElementById('btn-open-create-cuy-modal');
  const btnCloseModal = document.getElementById('btn-close-cuy-modal');
  const btnCancelForm = document.getElementById('btn-cancel-cuy-form');
  const modalForm = document.getElementById('modal-cuy-form');
  const formCuy = document.getElementById('form-cuy');
  const btnGenCode = document.getElementById('btn-generate-cuy-code');

  if (btnOpenModal) {
    btnOpenModal.addEventListener('click', () => openCuyFormModal());
  }
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => modalForm.classList.add('hidden'));
  }
  if (btnCancelForm) {
    btnCancelForm.addEventListener('click', () => modalForm.classList.add('hidden'));
  }
  if (btnGenCode) {
    btnGenCode.addEventListener('click', () => {
      const year = new Date().getFullYear();
      const random = Math.floor(100 + Math.random() * 900);
      document.getElementById('cuy-form-codigo').value = `CUY-${year}-${random}`;
    });
  }

  if (formCuy) {
    formCuy.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleFormSubmit();
    });
  }

  // Modal Detalle
  const btnCloseDetails = document.getElementById('btn-close-cuy-details');
  const modalDetails = document.getElementById('modal-cuy-details');
  if (btnCloseDetails) {
    btnCloseDetails.addEventListener('click', () => modalDetails.classList.add('hidden'));
  }
}

async function loadAndDisplayCuyes() {
  currentCuyes = await getCuyes();
  populateMadresSelect();
  applyFiltersAndRender();
}

function populateMadresSelect() {
  const madreSelect = document.getElementById('cuy-form-madre');
  if (!madreSelect) return;

  const hembras = currentCuyes.filter(c => c.genero === 'Hembra');
  madreSelect.innerHTML = `
    <option value="">Madre no especificada</option>
    ${hembras.map(h => `<option value="${h.id}">${h.codigo} - ${h.nombre || h.raza}</option>`).join('')}
  `;
}

function applyFiltersAndRender() {
  let filtered = [...currentCuyes];

  if (activeFilters.search) {
    const q = activeFilters.search.toLowerCase().trim();
    filtered = filtered.filter(c => 
      (c.codigo && c.codigo.toLowerCase().includes(q)) ||
      (c.nombre && c.nombre.toLowerCase().includes(q)) ||
      (c.raza && c.raza.toLowerCase().includes(q))
    );
  }

  if (activeFilters.etapa) {
    filtered = filtered.filter(c => c.etapa === activeFilters.etapa);
  }

  if (activeFilters.genero) {
    filtered = filtered.filter(c => c.genero === activeFilters.genero);
  }

  if (activeFilters.estado_salud) {
    filtered = filtered.filter(c => c.estado_salud === activeFilters.estado_salud);
  }

  const tbody = document.getElementById('cuyes-table-body');
  const emptyState = document.getElementById('cuyes-empty-state');
  const counter = document.getElementById('cuyes-counter-label');

  if (counter) {
    counter.textContent = `Mostrando ${filtered.length} de ${currentCuyes.length} cuyes registrados`;
  }

  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  tbody.innerHTML = filtered.map(c => {
    // Cálculo de edad
    const edad = calcularEdad(c.fecha_nacimiento);

    // Badge raza
    const razaObj = APP_CONFIG.razas.find(r => r.id === c.raza) || { color: 'bg-stone-100 text-stone-700' };
    
    // Badge etapa
    const etapaObj = APP_CONFIG.etapas.find(e => e.id === c.etapa) || { badgeClass: 'bg-stone-100 text-stone-700' };

    // Badge salud
    const saludObj = APP_CONFIG.estadosSalud.find(s => s.id === c.estado_salud) || { badgeClass: 'bg-stone-100 text-stone-700', dot: 'bg-stone-400' };

    // Poza
    const pozaInfo = c.poza ? `${c.poza.codigo}` : 'Sin Poza';

    return `
      <tr class="hover:bg-stone-50/80 transition-colors duration-150">
        <!-- Código y Avatar -->
        <td class="py-3 px-4">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl ${c.genero === 'Macho' ? 'bg-sky-100 text-sky-700 border-sky-200' : 'bg-rose-100 text-rose-700 border-rose-200'} border flex items-center justify-center font-bold text-sm shadow-xs">
              ${c.genero === 'Macho' ? '♂' : '♀'}
            </div>
            <div>
              <p class="font-bold text-stone-900 font-mono text-sm">${c.codigo}</p>
              <p class="text-xs text-stone-500">${c.nombre || 'Sin alias'}</p>
            </div>
          </div>
        </td>

        <!-- Raza & Género -->
        <td class="py-3 px-3">
          <span class="inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${razaObj.color}">
            ${c.raza}
          </span>
          <span class="block text-[11px] text-stone-500 mt-1">${c.genero}</span>
        </td>

        <!-- Etapa -->
        <td class="py-3 px-3">
          <span class="inline-block px-2 py-0.5 rounded text-xs font-medium border ${etapaObj.badgeClass}">
            ${c.etapa}
          </span>
        </td>

        <!-- Peso -->
        <td class="py-3 px-3">
          <span class="font-bold text-stone-900">${formatGramos(c.peso_actual_g)}</span>
          <div class="w-16 bg-stone-200 rounded-full h-1.5 mt-1 overflow-hidden">
            <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${Math.min((c.peso_actual_g / 1800) * 100, 100)}%"></div>
          </div>
        </td>

        <!-- Edad -->
        <td class="py-3 px-3">
          <span class="text-stone-800 font-medium">${edad}</span>
          <span class="block text-[11px] text-stone-500">${c.fecha_nacimiento}</span>
        </td>

        <!-- Poza -->
        <td class="py-3 px-3">
          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-stone-100 text-stone-700 font-medium">
            <i data-lucide="home" class="w-3 h-3 mr-1 text-stone-400"></i>
            ${pozaInfo}
          </span>
        </td>

        <!-- Estado Salud -->
        <td class="py-3 px-3">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${saludObj.badgeClass}">
            <span class="w-1.5 h-1.5 rounded-full mr-1.5 ${saludObj.dot}"></span>
            ${c.estado_salud}
          </span>
        </td>

        <!-- Acciones -->
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="inline-flex items-center space-x-1">
            <button onclick="window.viewCuyDetails('${c.id}')" title="Ver Ficha Técnica" class="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button onclick="window.editCuy('${c.id}')" title="Editar Cuy" class="p-1.5 text-stone-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="window.deleteCuyConfirm('${c.id}')" title="Eliminar Cuy" class="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openCuyFormModal(cuy = null) {
  const modal = document.getElementById('modal-cuy-form');
  const title = document.getElementById('modal-cuy-title');
  const form = document.getElementById('form-cuy');

  form.reset();

  if (cuy) {
    title.innerHTML = `<i data-lucide="edit-3" class="w-5 h-5 text-teal-600 mr-2"></i> Editar Cuy: ${cuy.codigo}`;
    document.getElementById('cuy-form-id').value = cuy.id;
    document.getElementById('cuy-form-codigo').value = cuy.codigo;
    document.getElementById('cuy-form-nombre').value = cuy.nombre || '';
    document.getElementById('cuy-form-raza').value = cuy.raza;
    document.getElementById('cuy-form-genero').value = cuy.genero;
    document.getElementById('cuy-form-etapa').value = cuy.etapa;
    document.getElementById('cuy-form-peso').value = cuy.peso_actual_g;
    document.getElementById('cuy-form-nacimiento').value = cuy.fecha_nacimiento;
    document.getElementById('cuy-form-poza').value = cuy.poza_id || '';
    document.getElementById('cuy-form-salud').value = cuy.estado_salud;
    document.getElementById('cuy-form-madre').value = cuy.madre_id || '';
    document.getElementById('cuy-form-observaciones').value = cuy.observaciones || '';
  } else {
    title.innerHTML = `<i data-lucide="tag" class="w-5 h-5 text-emerald-600 mr-2"></i> Registrar Nuevo Cuy`;
    document.getElementById('cuy-form-id').value = '';
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    document.getElementById('cuy-form-codigo').value = `CUY-${year}-${random}`;
    document.getElementById('cuy-form-nacimiento').value = new Date().toISOString().split('T')[0];
    document.getElementById('cuy-form-peso').value = '350';
  }

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

async function handleFormSubmit() {
  const id = document.getElementById('cuy-form-id').value;
  const data = {
    codigo: document.getElementById('cuy-form-codigo').value.trim(),
    nombre: document.getElementById('cuy-form-nombre').value.trim(),
    raza: document.getElementById('cuy-form-raza').value,
    genero: document.getElementById('cuy-form-genero').value,
    etapa: document.getElementById('cuy-form-etapa').value,
    peso_actual_g: document.getElementById('cuy-form-peso').value,
    fecha_nacimiento: document.getElementById('cuy-form-nacimiento').value,
    poza_id: document.getElementById('cuy-form-poza').value || null,
    estado_salud: document.getElementById('cuy-form-salud').value,
    madre_id: document.getElementById('cuy-form-madre').value || null,
    observaciones: document.getElementById('cuy-form-observaciones').value.trim()
  };

  try {
    if (id) {
      await updateCuy(id, data);
      window.showToast('Cuy actualizado exitosamente', 'success');
    } else {
      await createCuy(data);
      window.showToast('Nuevo cuy registrado con éxito', 'success');
    }

    document.getElementById('modal-cuy-form').classList.add('hidden');
    await loadAndDisplayCuyes();
  } catch (error) {
    console.error('Error guardando cuy:', error);
    window.showToast('Error al guardar el cuy', 'error');
  }
}

// Helpers globales para acciones en tabla
window.editCuy = async function(id) {
  const cuy = await getCuyById(id);
  if (cuy) openCuyFormModal(cuy);
};

window.deleteCuyConfirm = async function(id) {
  const cuy = await getCuyById(id);
  if (!cuy) return;

  if (confirm(`¿Estás seguro de eliminar el registro de ${cuy.codigo} (${cuy.nombre || 'Sin nombre'})?`)) {
    await deleteCuy(id);
    window.showToast('Cuy eliminado del inventario', 'info');
    await loadAndDisplayCuyes();
  }
};

window.viewCuyDetails = async function(id) {
  const cuy = await getCuyById(id);
  if (!cuy) return;

  const modal = document.getElementById('modal-cuy-details');
  const header = document.getElementById('cuy-details-header');
  const body = document.getElementById('cuy-details-body');

  const edad = calcularEdad(cuy.fecha_nacimiento);
  const razaObj = APP_CONFIG.razas.find(r => r.id === cuy.raza) || { label: cuy.raza };

  // Cargar historial médico del cuy
  const allSalud = await getRegistrosMedicos();
  const historialSalud = allSalud.filter(s => s.cuy_id === cuy.id);

  // Cargar camadas si es hembra
  let historialPartos = [];
  if (cuy.genero === 'Hembra') {
    const allPartos = await getPartos();
    historialPartos = allPartos.filter(p => p.madre_id === cuy.id);
  }

  header.innerHTML = `
    <div class="flex items-center space-x-3">
      <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-2xl text-white">
        ${cuy.genero === 'Macho' ? '♂' : '♀'}
      </div>
      <div>
        <h3 class="text-xl font-extrabold tracking-tight">${cuy.codigo}</h3>
        <p class="text-emerald-100 text-sm font-medium">${cuy.nombre || 'Sin alias'} · Raza ${razaObj.label}</p>
      </div>
    </div>
  `;

  body.innerHTML = `
    <div class="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200/80">
      <div>
        <span class="text-stone-500 font-medium block">Etapa Productiva</span>
        <span class="font-bold text-stone-800 text-sm">${cuy.etapa}</span>
      </div>
      <div>
        <span class="text-stone-500 font-medium block">Peso Actual</span>
        <span class="font-bold text-emerald-700 text-sm">${formatGramos(cuy.peso_actual_g)}</span>
      </div>
      <div>
        <span class="text-stone-500 font-medium block">Fecha Nacimiento</span>
        <span class="font-semibold text-stone-800">${cuy.fecha_nacimiento} (${edad})</span>
      </div>
      <div>
        <span class="text-stone-500 font-medium block">Alojamiento / Poza</span>
        <span class="font-semibold text-stone-800">${cuy.poza ? `${cuy.poza.codigo} - ${cuy.poza.nombre}` : 'Sin poza fija'}</span>
      </div>
      <div class="col-span-2 pt-2 border-t border-stone-200">
        <span class="text-stone-500 font-medium block">Estado Sanitario</span>
        <span class="font-bold ${cuy.estado_salud === 'Sano' ? 'text-emerald-600' : 'text-rose-600'}">${cuy.estado_salud}</span>
      </div>
    </div>

    ${cuy.observaciones ? `
      <div class="text-xs bg-amber-50 text-amber-900 p-3 rounded-xl border border-amber-200">
        <span class="font-bold block mb-0.5">Notas Zootécnicas:</span>
        <p>${cuy.observaciones}</p>
      </div>
    ` : ''}

    <!-- Historial de Partos si aplica -->
    ${cuy.genero === 'Hembra' ? `
      <div class="space-y-2">
        <h4 class="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center">
          <i data-lucide="baby" class="w-3.5 h-3.5 mr-1 text-teal-600"></i> Historial de Camadas (${historialPartos.length})
        </h4>
        ${historialPartos.length > 0 ? `
          <div class="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            ${historialPartos.map(p => `
              <div class="p-2 text-xs bg-stone-50 rounded-lg border border-stone-200/70 flex justify-between">
                <span>Parto: ${p.fecha_parto}</span>
                <span class="font-semibold text-emerald-700">${p.crias_vivas} crías vivas (${p.crias_muertas} bajas)</span>
              </div>
            `).join('')}
          </div>
        ` : `<p class="text-xs text-stone-400 italic">No registra partos previos.</p>`}
      </div>
    ` : ''}

    <!-- Historial Sanitario -->
    <div class="space-y-2">
      <h4 class="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center">
        <i data-lucide="stethoscope" class="w-3.5 h-3.5 mr-1 text-rose-500"></i> Historial Veterinario (${historialSalud.length})
      </h4>
      ${historialSalud.length > 0 ? `
        <div class="space-y-1.5 max-h-32 overflow-y-auto pr-1">
          ${historialSalud.map(s => `
            <div class="p-2 text-xs bg-stone-50 rounded-lg border border-stone-200/70">
              <div class="flex justify-between font-semibold">
                <span class="text-stone-800">${s.diagnostico}</span>
                <span class="${s.estado === 'Recuperado' ? 'text-emerald-600' : 'text-amber-600'}">${s.estado}</span>
              </div>
              <p class="text-[11px] text-stone-500 mt-0.5">${s.medicamento} · ${s.fecha_diagnostico}</p>
            </div>
          `).join('')}
        </div>
      ` : `<p class="text-xs text-stone-400 italic">Sin antecedentes clínicos adversos.</p>`}
    </div>
  `;

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
};

function calcularEdad(fechaNacimientoStr) {
  if (!fechaNacimientoStr) return 'Desc.';
  const nacimiento = new Date(fechaNacimientoStr);
  const hoy = new Date();
  
  const diffTime = Math.abs(hoy - nacimiento);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} días`;
  }
  const meses = Math.floor(diffDays / 30);
  if (meses < 12) {
    return `${meses} meses`;
  }
  const anos = (diffDays / 365).toFixed(1);
  return `${anos} años`;
}

function formatGramos(val) {
  const g = parseFloat(val) || 0;
  if (g >= 1000) {
    return `${(g / 1000).toFixed(2)} kg`;
  }
  return `${Math.round(g)} g`;
}
