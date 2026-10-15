// ==============================================================================
// SISGRANJA - VISTA DE REPRODUCCIÓN, EMPADRES Y CONTROL DE CAMADAS
// ==============================================================================

import { getEmpadres, getPartos, createEmpadre, updateEmpadre, createParto, getCuyes, getPozas, createCuy } from '../storageManager.js';
import { APP_CONFIG } from '../config.js';

let currentTab = 'camadas'; // 'empadres' | 'camadas'
let allEmpadres = [];
let allPartos = [];
let allCuyes = [];
let allPozas = [];

export async function renderReproduccion(container) {
  const [empadres, partos, cuyes, pozas] = await Promise.all([
    getEmpadres(),
    getPartos(),
    getCuyes(),
    getPozas()
  ]);

  allEmpadres = empadres;
  allPartos = partos;
  allCuyes = cuyes;
  allPozas = pozas;

  const totalVivos = allPartos.reduce((a, b) => a + (parseInt(b.crias_vivas) || 0), 0);
  const totalMuertos = allPartos.reduce((a, b) => a + (parseInt(b.crias_muertas) || 0), 0);
  const totalCrias = totalVivos + totalMuertos;
  const tasaMortalidad = totalCrias > 0 ? ((totalMuertos / totalCrias) * 100).toFixed(1) : '0.0';
  const promedioCamada = allPartos.length > 0 ? (totalVivos / allPartos.length).toFixed(1) : '0.0';

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <!-- Encabezado del Módulo -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-stone-900 tracking-tight flex items-center">
            <span class="p-2 bg-teal-100 text-teal-700 rounded-xl mr-3 inline-flex">
              <i data-lucide="heart" class="w-6 h-6"></i>
            </span>
            Control de Reproducción y Camadas
          </h1>
          <p class="text-stone-500 text-sm mt-1">Gestión de apareamientos, cálculo de gestación (68 días) y natalidad.</p>
        </div>
        <div class="flex gap-2">
          <button id="btn-open-new-empadre" class="inline-flex items-center px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-semibold transition">
            <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Nuevo Empadre
          </button>
          <button id="btn-open-create-parto-modal" class="inline-flex items-center px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold shadow-md transition hover:shadow-teal-600/30">
            <i data-lucide="baby" class="w-4 h-4 mr-2"></i> Registrar Parto
          </button>
        </div>
      </div>

      <!-- Tarjetas de Resumen Zootécnico -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 bg-white rounded-2xl shadow-sm border border-stone-200/80 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-stone-500 uppercase">Partos Registrados</p>
            <p class="text-2xl font-black text-stone-900 mt-1">${allPartos.length}</p>
            <p class="text-xs text-stone-500 mt-0.5">${allEmpadres.filter(e => e.estado === 'Gestación' || e.estado === 'Activo').length} gestaciones en curso</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <i data-lucide="calendar-check" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="p-4 bg-white rounded-2xl shadow-sm border border-stone-200/80 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-stone-500 uppercase">Crías Vivas Totales</p>
            <p class="text-2xl font-black text-emerald-600 mt-1">${totalVivos}</p>
            <p class="text-xs text-stone-500 mt-0.5">Producción efectiva</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <i data-lucide="check-circle-2" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="p-4 bg-white rounded-2xl shadow-sm border border-stone-200/80 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-stone-500 uppercase">Tamaño de Camada</p>
            <p class="text-2xl font-black text-stone-900 mt-1">${promedioCamada}</p>
            <p class="text-xs text-stone-500 mt-0.5">Crías promedio / madre</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <i data-lucide="users" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="p-4 bg-white rounded-2xl shadow-sm border border-stone-200/80 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-stone-500 uppercase">Mortalidad Perinatal</p>
            <p class="text-2xl font-black ${parseFloat(tasaMortalidad) > 10 ? 'text-rose-600' : 'text-stone-900'} mt-1">${tasaMortalidad}%</p>
            <p class="text-xs text-stone-500 mt-0.5">${totalMuertos} crías no logradas</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <i data-lucide="alert-circle" class="w-5 h-5"></i>
          </div>
        </div>
      </div>

      <!-- Pestañas internas de navegación (Camadas / Empadres) -->
      <div class="border-b border-stone-200">
        <nav class="flex space-x-6 text-sm font-semibold">
          <button id="tab-btn-camadas" class="py-3 px-1 border-b-2 font-bold flex items-center text-teal-600 border-teal-600">
            <i data-lucide="baby" class="w-4 h-4 mr-2"></i> Camadas y Partos (${allPartos.length})
          </button>
          <button id="tab-btn-empadres" class="py-3 px-1 border-b-2 font-medium flex items-center text-stone-500 border-transparent hover:text-stone-700">
            <i data-lucide="git-merge" class="w-4 h-4 mr-2"></i> Empadres y Apareamientos (${allEmpadres.length})
          </button>
        </nav>
      </div>

      <!-- Contenedor dinámico de pestañas -->
      <div id="repro-tab-content">
        <!-- Renderizado dinámico -->
      </div>
    </div>

    <!-- MODAL: Nuevo Empadre -->
    <div id="modal-empadre-form" class="fixed inset-0 z-50 hidden bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden animate-scale-up my-8">
        <div class="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <h2 class="font-bold text-stone-900 text-lg flex items-center">
            <i data-lucide="git-merge" class="w-5 h-5 text-teal-600 mr-2"></i>
            Iniciar Nuevo Empadre / Cruzamiento
          </h2>
          <button id="btn-close-empadre-modal" class="text-stone-400 hover:text-stone-600 p-1">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="form-empadre" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Código del Empadre</label>
              <input type="text" id="empadre-codigo" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 uppercase font-mono" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Macho Reproductor (Padrillo) <span class="text-rose-500">*</span></label>
              <select id="empadre-macho" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500">
                <!-- Dinámico -->
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Fecha de Inicio de Empadre <span class="text-rose-500">*</span></label>
              <input type="date" id="empadre-fecha-inicio" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Poza de Empadre</label>
              <select id="empadre-poza" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500">
                <!-- Dinámico -->
              </select>
            </div>
          </div>

          <div class="bg-teal-50 p-3 rounded-xl border border-teal-200 text-xs text-teal-800 flex items-start space-x-2">
            <i data-lucide="info" class="w-4 h-4 text-teal-600 mt-0.5 shrink-0"></i>
            <div>
              <span class="font-bold">Estimación de Parto:</span> Se proyecta automáticamente a los <strong>68 días</strong> de iniciado el empadre.
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">Observaciones</label>
            <textarea id="empadre-observaciones" rows="2" placeholder="Detalles de las hembras integrantes del harén, peso inicial..." class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500"></textarea>
          </div>

          <div class="pt-4 border-t border-stone-200 flex justify-end gap-3">
            <button type="button" id="btn-cancel-empadre-form" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-semibold transition">
              Cancelar
            </button>
            <button type="submit" class="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold shadow-md transition">
              Crear Empadre
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: Registrar Parto / Camada -->
    <div id="modal-parto-form" class="fixed inset-0 z-50 hidden bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden animate-scale-up my-8">
        <div class="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <h2 class="font-bold text-stone-900 text-lg flex items-center">
            <i data-lucide="baby" class="w-5 h-5 text-teal-600 mr-2"></i>
            Registrar Nuevo Parto y Camada
          </h2>
          <button id="btn-close-parto-modal" class="text-stone-400 hover:text-stone-600 p-1">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="form-parto" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Código de Camada</label>
              <input type="text" id="parto-codigo" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 uppercase font-mono" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Madre Reproductora <span class="text-rose-500">*</span></label>
              <select id="parto-madre" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500">
                <!-- Dinámico -->
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Empadre Asociado (Opcional)</label>
              <select id="parto-empadre" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500">
                <!-- Dinámico -->
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Fecha del Parto <span class="text-rose-500">*</span></label>
              <input type="date" id="parto-fecha" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Crías Vivas <span class="text-rose-500">*</span></label>
              <input type="number" id="parto-vivas" required min="0" max="10" value="3" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold text-emerald-700" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Crías Muertas (Bajas)</label>
              <input type="number" id="parto-muertas" required min="0" max="10" value="0" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold text-rose-700" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Peso Prom. (g)</label>
              <input type="number" id="parto-peso-nacimiento" step="0.5" min="40" max="250" value="125" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold" />
            </div>
          </div>

          <div class="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start space-x-2">
            <i data-lucide="clock" class="w-4 h-4 text-amber-600 mt-0.5 shrink-0"></i>
            <div>
              <span class="font-bold">Fecha de Destete:</span> Se programará automáticamente para <strong>21 días</strong> después del parto.
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">Observaciones</label>
            <textarea id="parto-observaciones" rows="2" placeholder="Parto natural / asistido, vigor de las crías, estado de la ubre..." class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500"></textarea>
          </div>

          <div class="pt-4 border-t border-stone-200 flex justify-end gap-3">
            <button type="button" id="btn-cancel-parto-form" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-semibold transition">
              Cancelar
            </button>
            <button type="submit" class="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold shadow-md transition">
              Guardar Parto
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  setupReproduccionEvents();
  renderTabContent();
}

function setupReproduccionEvents() {
  const btnCamadas = document.getElementById('tab-btn-camadas');
  const btnEmpadres = document.getElementById('tab-btn-empadres');

  if (btnCamadas) {
    btnCamadas.addEventListener('click', () => {
      currentTab = 'camadas';
      btnCamadas.className = 'py-3 px-1 border-b-2 font-bold flex items-center text-teal-600 border-teal-600';
      btnEmpadres.className = 'py-3 px-1 border-b-2 font-medium flex items-center text-stone-500 border-transparent hover:text-stone-700';
      renderTabContent();
    });
  }

  if (btnEmpadres) {
    btnEmpadres.addEventListener('click', () => {
      currentTab = 'empadres';
      btnEmpadres.className = 'py-3 px-1 border-b-2 font-bold flex items-center text-teal-600 border-teal-600';
      btnCamadas.className = 'py-3 px-1 border-b-2 font-medium flex items-center text-stone-500 border-transparent hover:text-stone-700';
      renderTabContent();
    });
  }

  // Modales
  const modalEmpadre = document.getElementById('modal-empadre-form');
  const btnOpenEmpadre = document.getElementById('btn-open-new-empadre');
  const btnCloseEmpadre = document.getElementById('btn-close-empadre-modal');
  const btnCancelEmpadre = document.getElementById('btn-cancel-empadre-form');
  const formEmpadre = document.getElementById('form-empadre');

  if (btnOpenEmpadre) {
    btnOpenEmpadre.addEventListener('click', () => openNewEmpadreModal());
  }
  if (btnCloseEmpadre) {
    btnCloseEmpadre.addEventListener('click', () => modalEmpadre.classList.add('hidden'));
  }
  if (btnCancelEmpadre) {
    btnCancelEmpadre.addEventListener('click', () => modalEmpadre.classList.add('hidden'));
  }
  if (formEmpadre) {
    formEmpadre.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSaveEmpadre();
    });
  }

  const modalParto = document.getElementById('modal-parto-form');
  const btnOpenParto = document.getElementById('btn-open-create-parto-modal');
  const btnCloseParto = document.getElementById('btn-close-parto-modal');
  const btnCancelParto = document.getElementById('btn-cancel-parto-form');
  const formParto = document.getElementById('form-parto');

  if (btnOpenParto) {
    btnOpenParto.addEventListener('click', () => openNewPartoModal());
  }
  if (btnCloseParto) {
    btnCloseParto.addEventListener('click', () => modalParto.classList.add('hidden'));
  }
  if (btnCancelParto) {
    btnCancelParto.addEventListener('click', () => modalParto.classList.add('hidden'));
  }
  if (formParto) {
    formParto.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSaveParto();
    });
  }
}

function renderTabContent() {
  const container = document.getElementById('repro-tab-content');
  if (!container) return;

  if (currentTab === 'camadas') {
    renderCamadasView(container);
  } else {
    renderEmpadresView(container);
  }

  if (window.lucide) window.lucide.createIcons();
}

function renderCamadasView(container) {
  if (allPartos.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-12 text-center border border-stone-200/80">
        <i data-lucide="baby" class="w-12 h-12 mx-auto text-stone-300 mb-3"></i>
        <h3 class="text-base font-bold text-stone-800">No hay camadas registradas</h3>
        <p class="text-xs text-stone-500 mt-1 max-w-sm mx-auto">Comienza registrando los partos para hacer seguimiento de nacimientos y destetes.</p>
        <button onclick="document.getElementById('btn-open-create-parto-modal').click()" class="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold">
          Registrar primer parto
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-stone-600">
          <thead class="bg-stone-50 text-stone-700 text-xs uppercase font-semibold border-b border-stone-200/80">
            <tr>
              <th scope="col" class="py-3.5 px-4">Camada</th>
              <th scope="col" class="py-3.5 px-3">Madre</th>
              <th scope="col" class="py-3.5 px-3">Fecha Parto</th>
              <th scope="col" class="py-3.5 px-3 text-center">Nacidos Vivos</th>
              <th scope="col" class="py-3.5 px-3 text-center">Mortalidad</th>
              <th scope="col" class="py-3.5 px-3">Peso Prom.</th>
              <th scope="col" class="py-3.5 px-3">Fecha Destete</th>
              <th scope="col" class="py-3.5 px-3">Estado</th>
              <th scope="col" class="py-3.5 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            ${allPartos.map(p => {
              const madre = p.madre ? `${p.madre.codigo} (${p.madre.nombre || p.madre.raza})` : 'No vinculada';
              const estadoClass = p.estado_destete === 'Completado' 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                : 'bg-amber-100 text-amber-800 border-amber-200';

              return `
                <tr class="hover:bg-stone-50/80 transition">
                  <td class="py-3 px-4 font-bold text-stone-900 font-mono text-sm">${p.codigo}</td>
                  <td class="py-3 px-3">
                    <span class="font-medium text-stone-800 text-xs">${madre}</span>
                  </td>
                  <td class="py-3 px-3 text-xs text-stone-700 font-medium">${p.fecha_parto}</td>
                  <td class="py-3 px-3 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ${p.crias_vivas} crías
                    </span>
                  </td>
                  <td class="py-3 px-3 text-center">
                    ${p.crias_muertas > 0 ? `
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        ${p.crias_muertas} bajas
                      </span>
                    ` : `<span class="text-xs text-stone-400">0 bajas</span>`}
                  </td>
                  <td class="py-3 px-3 text-xs font-semibold text-stone-800">${p.peso_promedio_nacimiento_g || 120} g</td>
                  <td class="py-3 px-3 text-xs text-stone-700">${p.fecha_destete_programada || 'Pendiente'}</td>
                  <td class="py-3 px-3">
                    <span class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${estadoClass}">
                      ${p.estado_destete}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    ${p.estado_destete !== 'Completado' ? `
                      <button onclick="window.incorporarCriasAlInventario('${p.id}')" title="Generar cuyes en inventario" class="inline-flex items-center px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold transition border border-teal-200">
                        <i data-lucide="user-plus" class="w-3.5 h-3.5 mr-1"></i> Destetar
                      </button>
                    ` : `
                      <span class="text-[11px] text-emerald-600 font-semibold flex items-center justify-end">
                        <i data-lucide="check" class="w-3.5 h-3.5 mr-0.5"></i> Integradas
                      </span>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderEmpadresView(container) {
  if (allEmpadres.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-12 text-center border border-stone-200/80">
        <i data-lucide="git-merge" class="w-12 h-12 mx-auto text-stone-300 mb-3"></i>
        <h3 class="text-base font-bold text-stone-800">No hay empadres registrados</h3>
        <p class="text-xs text-stone-500 mt-1 max-w-sm mx-auto">Inicia un nuevo empadre seleccionando un macho reproductor y una poza asignada.</p>
        <button onclick="document.getElementById('btn-open-new-empadre').click()" class="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold">
          Iniciar primer empadre
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${allEmpadres.map(e => {
        const macho = e.macho ? `${e.macho.codigo} (${e.macho.nombre || e.macho.raza})` : 'Padrillo no asignado';
        const poza = e.poza ? `${e.poza.codigo} - ${e.poza.nombre}` : 'Sin poza';
        const badgeColor = e.estado === 'Activo' 
          ? 'bg-blue-100 text-blue-800 border-blue-200'
          : e.estado === 'Gestación'
            ? 'bg-purple-100 text-purple-800 border-purple-200'
            : 'bg-stone-100 text-stone-700 border-stone-200';

        return `
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 hover:shadow-md transition">
            <div class="flex items-center justify-between mb-3">
              <span class="font-bold text-stone-900 font-mono text-sm">${e.codigo}</span>
              <span class="px-2 py-0.5 rounded text-xs font-semibold border ${badgeColor}">${e.estado}</span>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex items-center text-stone-700">
                <i data-lucide="shield" class="w-3.5 h-3.5 mr-2 text-teal-600"></i>
                <span class="font-semibold">Macho:</span>
                <span class="ml-1 text-stone-900 font-bold">${macho}</span>
              </div>
              <div class="flex items-center text-stone-700">
                <i data-lucide="home" class="w-3.5 h-3.5 mr-2 text-stone-400"></i>
                <span class="font-semibold">Poza:</span>
                <span class="ml-1">${poza}</span>
              </div>
              <div class="flex items-center text-stone-700">
                <i data-lucide="calendar" class="w-3.5 h-3.5 mr-2 text-stone-400"></i>
                <span class="font-semibold">Inicio:</span>
                <span class="ml-1">${e.fecha_inicio}</span>
              </div>
              <div class="flex items-center text-stone-700">
                <i data-lucide="clock" class="w-3.5 h-3.5 mr-2 text-amber-500"></i>
                <span class="font-semibold">Parto estimado:</span>
                <span class="ml-1 font-bold text-amber-700">${e.fecha_estimada_parto || 'No calculada'}</span>
              </div>
            </div>

            ${e.observaciones ? `
              <p class="text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-100 line-clamp-2">
                ${e.observaciones}
              </p>
            ` : ''}

            <div class="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center text-xs">
              ${e.estado !== 'Finalizado' ? `
                <button onclick="window.cambiarEstadoEmpadre('${e.id}', '${e.estado === 'Activo' ? 'Gestación' : 'Finalizado'}')" class="text-teal-600 hover:text-teal-700 font-semibold hover:underline">
                  ${e.estado === 'Activo' ? 'Marcar Gestación' : 'Finalizar Empadre'}
                </button>
              ` : `
                <span class="text-stone-400 font-medium">Ciclo concluido</span>
              `}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function openNewEmpadreModal() {
  const modal = document.getElementById('modal-empadre-form');
  const machoSelect = document.getElementById('empadre-macho');
  const pozaSelect = document.getElementById('empadre-poza');
  const form = document.getElementById('form-empadre');

  form.reset();

  const year = new Date().getFullYear();
  const random = Math.floor(100 + Math.random() * 900);
  document.getElementById('empadre-codigo').value = `EMP-${year}-${random}`;
  document.getElementById('empadre-fecha-inicio').value = new Date().toISOString().split('T')[0];

  const machos = allCuyes.filter(c => c.genero === 'Macho' && (c.etapa === 'Reproductor' || c.peso_actual_g >= 900));
  machoSelect.innerHTML = machos.length > 0 
    ? machos.map(m => `<option value="${m.id}">${m.codigo} - ${m.nombre || m.raza} (${Math.round(m.peso_actual_g)}g)</option>`).join('')
    : `<option value="">Sin machos reproductores disponibles</option>`;

  pozaSelect.innerHTML = allPozas.map(p => `<option value="${p.id}">${p.codigo} - ${p.nombre}</option>`).join('');

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

async function handleSaveEmpadre() {
  const machoId = document.getElementById('empadre-macho').value;
  if (!machoId) {
    window.showToast('Debes seleccionar un macho reproductor', 'warning');
    return;
  }

  const data = {
    codigo: document.getElementById('empadre-codigo').value.trim(),
    macho_id: machoId,
    poza_id: document.getElementById('empadre-poza').value || null,
    fecha_inicio: document.getElementById('empadre-fecha-inicio').value,
    observaciones: document.getElementById('empadre-observaciones').value.trim()
  };

  try {
    await createEmpadre(data);
    window.showToast('Empadre registrado con cálculo de parto', 'success');
    document.getElementById('modal-empadre-form').classList.add('hidden');
    allEmpadres = await getEmpadres();
    renderTabContent();
  } catch (err) {
    console.error('Error creando empadre:', err);
    window.showToast('Error al registrar empadre', 'error');
  }
}

function openNewPartoModal() {
  const modal = document.getElementById('modal-parto-form');
  const madreSelect = document.getElementById('parto-madre');
  const empadreSelect = document.getElementById('parto-empadre');
  const form = document.getElementById('form-parto');

  form.reset();

  const year = new Date().getFullYear();
  const random = Math.floor(100 + Math.random() * 900);
  document.getElementById('parto-codigo').value = `CAM-${year}-${random}`;
  document.getElementById('parto-fecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('parto-vivas').value = 3;
  document.getElementById('parto-muertas').value = 0;
  document.getElementById('parto-peso-nacimiento').value = 125;

  const hembras = allCuyes.filter(c => c.genero === 'Hembra');
  madreSelect.innerHTML = hembras.length > 0
    ? hembras.map(h => `<option value="${h.id}">${h.codigo} - ${h.nombre || h.raza}</option>`).join('')
    : `<option value="">Sin hembras registradas</option>`;

  empadreSelect.innerHTML = `
    <option value="">Sin empadre vinculado</option>
    ${allEmpadres.map(e => `<option value="${e.id}">${e.codigo}</option>`).join('')}
  `;

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

async function handleSaveParto() {
  const madreId = document.getElementById('parto-madre').value;
  if (!madreId) {
    window.showToast('Debes seleccionar una madre para la camada', 'warning');
    return;
  }

  const data = {
    codigo: document.getElementById('parto-codigo').value.trim(),
    madre_id: madreId,
    empadre_id: document.getElementById('parto-empadre').value || null,
    fecha_parto: document.getElementById('parto-fecha').value,
    crias_vivas: document.getElementById('parto-vivas').value,
    crias_muertas: document.getElementById('parto-muertas').value,
    peso_promedio_nacimiento_g: document.getElementById('parto-peso-nacimiento').value,
    observaciones: document.getElementById('parto-observaciones').value.trim()
  };

  try {
    await createParto(data);
    window.showToast('Parto y camada registrados exitosamente', 'success');
    document.getElementById('modal-parto-form').classList.add('hidden');
    allPartos = await getPartos();
    renderTabContent();
  } catch (err) {
    console.error('Error registrando parto:', err);
    window.showToast('Error al registrar parto', 'error');
  }
}

// Helpers globales para acciones de camada y empadre
window.cambiarEstadoEmpadre = async function(id, nuevoEstado) {
  try {
    await updateEmpadre(id, { estado: nuevoEstado });
    window.showToast(`Empadre actualizado a ${nuevoEstado}`, 'info');
    allEmpadres = await getEmpadres();
    renderTabContent();
  } catch (err) {
    console.error('Error actualizando empadre:', err);
  }
};

window.incorporarCriasAlInventario = async function(partoId) {
  const parto = allPartos.find(p => p.id === partoId);
  if (!parto) return;

  const criasVivas = parseInt(parto.crias_vivas) || 0;
  if (criasVivas <= 0) {
    window.showToast('Esta camada no tiene crías vivas registradas para destetar', 'warning');
    return;
  }

  if (!confirm(`¿Deseas incorporar automáticamente ${criasVivas} crías vivas de la camada ${parto.codigo} al inventario como nuevos cuyes?`)) {
    return;
  }

  try {
    const madre = allCuyes.find(c => c.id === parto.madre_id);
    const raza = madre ? madre.raza : 'Perú';
    const pozaId = madre ? madre.poza_id : null;
    const year = new Date().getFullYear();

    for (let i = 1; i <= criasVivas; i++) {
      const genero = i % 2 === 0 ? 'Macho' : 'Hembra';
      const randomCode = Math.floor(100 + Math.random() * 900);
      await createCuy({
        codigo: `CUY-${year}-${randomCode}`,
        nombre: `Cría ${i} de ${parto.codigo}`,
        raza: raza,
        genero: genero,
        etapa: 'Cría',
        peso_actual_g: (parto.peso_promedio_nacimiento_g || 120) * 2, // peso aproximado al destete
        fecha_nacimiento: parto.fecha_parto,
        poza_id: pozaId,
        madre_id: parto.madre_id,
        padre_id: null,
        estado_salud: 'Sano',
        observaciones: `Destetado de camada ${parto.codigo}. Madre: ${madre ? madre.codigo : 'Desc.'}`
      });
    }

    // Actualizar estado del parto a completado
    parto.estado_destete = 'Completado';
    // Guardar en almacenamiento
    allPartos = await getPartos();
    const idx = allPartos.findIndex(p => p.id === partoId);
    if (idx !== -1) {
      allPartos[idx].estado_destete = 'Completado';
    }

    window.showToast(`¡${criasVivas} crías incorporadas con éxito al inventario!`, 'success');
    allCuyes = await getCuyes();
    renderTabContent();
  } catch (err) {
    console.error('Error incorporando crías:', err);
    window.showToast('Ocurrió un error al incorporar crías', 'error');
  }
};
