// ==============================================================================
// SISGRANJA - VISTA DE SANIDAD ANIMAL Y REGISTROS MÉDICOS
// ==============================================================================

import { getRegistrosMedicos, createRegistroMedico, updateRegistroMedico, getCuyes, updateCuy } from '../storageManager.js';
import { APP_CONFIG } from '../config.js';

let allRegistros = [];
let allCuyes = [];

export async function renderSalud(container) {
  const [registros, cuyes] = await Promise.all([
    getRegistrosMedicos(),
    getCuyes()
  ]);

  allRegistros = registros;
  allCuyes = cuyes;

  const enTratamiento = allRegistros.filter(r => r.estado === 'En Tratamiento');
  const recuperados = allRegistros.filter(r => r.estado === 'Recuperado');
  const totalInversionSanitaria = allRegistros.reduce((acc, r) => acc + (parseFloat(r.costo_tratamiento) || 0), 0);

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <!-- Encabezado del Módulo -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-stone-900 tracking-tight flex items-center">
            <span class="p-2 bg-rose-100 text-rose-700 rounded-xl mr-3 inline-flex">
              <i data-lucide="stethoscope" class="w-6 h-6"></i>
            </span>
            Sanidad y Registros Médicos
          </h1>
          <p class="text-stone-500 text-sm mt-1">Control de tratamientos profilácticos, parasitología, micosis y recetas veterinarias.</p>
        </div>
        <button id="btn-open-new-salud-modal" class="inline-flex items-center px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold shadow-md transition hover:shadow-rose-600/30">
          <i data-lucide="plus-circle" class="w-4 h-4 mr-2"></i> Nuevo Registro Médico
        </button>
      </div>

      <!-- Tarjetas de Métricas Sanitarias -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-5 bg-white rounded-2xl shadow-sm border border-stone-200/80 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-stone-500 uppercase">Tratamientos Activos</p>
            <p class="text-3xl font-black text-rose-600 mt-1">${enTratamiento.length}</p>
            <p class="text-xs text-stone-500 mt-1">Animales en aislamiento o terapia</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <i data-lucide="alert-triangle" class="w-6 h-6"></i>
          </div>
        </div>

        <div class="p-5 bg-white rounded-2xl shadow-sm border border-stone-200/80 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-stone-500 uppercase">Casos Recuperados</p>
            <p class="text-3xl font-black text-emerald-600 mt-1">${recuperados.length}</p>
            <p class="text-xs text-stone-500 mt-1">Eficacia en recuperación</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <i data-lucide="check-check" class="w-6 h-6"></i>
          </div>
        </div>

        <div class="p-5 bg-white rounded-2xl shadow-sm border border-stone-200/80 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-stone-500 uppercase">Costo Total Sanitario</p>
            <p class="text-3xl font-black text-stone-800 mt-1">S/ ${totalInversionSanitaria.toFixed(2)}</p>
            <p class="text-xs text-stone-500 mt-1">Inversión en fármacos y biológicos</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <i data-lucide="wallet" class="w-6 h-6"></i>
          </div>
        </div>
      </div>

      <!-- Tabla de Registros Médicos -->
      <div class="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
        <div class="p-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50">
          <h2 class="font-bold text-stone-800 text-sm flex items-center">
            <i data-lucide="clipboard-list" class="w-4 h-4 mr-2 text-stone-500"></i> Historial Clínico de la Granja
          </h2>
          <span class="text-xs text-stone-500 font-medium">${allRegistros.length} eventos sanitarios archivados</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-stone-600">
            <thead class="bg-stone-50 text-stone-700 text-xs uppercase font-semibold border-b border-stone-200/80">
              <tr>
                <th scope="col" class="py-3 px-4">Cuy Afectado</th>
                <th scope="col" class="py-3 px-3">Fecha</th>
                <th scope="col" class="py-3 px-3">Tipo</th>
                <th scope="col" class="py-3 px-3">Diagnóstico / Síntomas</th>
                <th scope="col" class="py-3 px-3">Medicamento & Dosis</th>
                <th scope="col" class="py-3 px-3">Veterinario</th>
                <th scope="col" class="py-3 px-3">Estado</th>
                <th scope="col" class="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody id="salud-table-body" class="divide-y divide-stone-100">
              <!-- Filas dinámicas -->
            </tbody>
          </table>
        </div>

        <div id="salud-empty-state" class="${allRegistros.length === 0 ? '' : 'hidden'} p-12 text-center text-stone-500">
          <i data-lucide="shield-check" class="w-12 h-12 mx-auto text-emerald-400 mb-3"></i>
          <h3 class="font-bold text-stone-700">Sin antecedentes clínicos</h3>
          <p class="text-xs text-stone-400 mt-1">La piara se encuentra en condiciones sanitarias excelentes.</p>
        </div>
      </div>
    </div>

    <!-- MODAL: Nuevo Registro Médico -->
    <div id="modal-salud-form" class="fixed inset-0 z-50 hidden bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden animate-scale-up my-8">
        <div class="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <h2 class="font-bold text-stone-900 text-lg flex items-center">
            <i data-lucide="stethoscope" class="w-5 h-5 text-rose-600 mr-2"></i>
            Registrar Atención Veterinaria / Sanidad
          </h2>
          <button id="btn-close-salud-modal" class="text-stone-400 hover:text-stone-600 p-1">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="form-salud" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Cuy Paciente <span class="text-rose-500">*</span></label>
              <select id="salud-cuy-id" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500">
                <!-- Dinámico -->
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Tipo de Evento <span class="text-rose-500">*</span></label>
              <select id="salud-tipo-evento" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500">
                ${APP_CONFIG.tiposEventosMedicos.map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">Diagnóstico / Signos Clínicos <span class="text-rose-500">*</span></label>
            <input type="text" id="salud-diagnostico" required placeholder="Ej: Micosis podal, ectoparásitos, diarrea..." class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Medicamento / Fármaco</label>
              <input type="text" id="salud-medicamento" placeholder="Ej: Oxitetraciclina, Ivermectina..." class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Dosis y Frecuencia</label>
              <input type="text" id="salud-dosis" placeholder="Ej: 0.1ml SC cada 48h x 3 días" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Veterinario / Responsable</label>
              <input type="text" id="salud-veterinario" placeholder="Dr. / Técnico Pecuario" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Costo Tratamiento (S/)</label>
              <input type="number" id="salud-costo" step="0.5" min="0" value="0.00" class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Fecha de Atención</label>
              <input type="date" id="salud-fecha-diagnostico" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Estado del Tratamiento</label>
              <select id="salud-estado" required class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500">
                <option value="En Tratamiento">En Tratamiento</option>
                <option value="Recuperado">Recuperado (Alta Médica)</option>
                <option value="Crítico">Crítico</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">Observaciones</label>
            <textarea id="salud-observaciones" rows="2" placeholder="Respuesta al tratamiento, evolución clínica..." class="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500"></textarea>
          </div>

          <div class="pt-4 border-t border-stone-200 flex justify-end gap-3">
            <button type="button" id="btn-cancel-salud-form" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-semibold transition">
              Cancelar
            </button>
            <button type="submit" class="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold shadow-md transition">
              Guardar Atención
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  setupSaludEvents();
  renderSaludTable();
}

function setupSaludEvents() {
  const modal = document.getElementById('modal-salud-form');
  const btnOpen = document.getElementById('btn-open-new-salud-modal');
  const btnClose = document.getElementById('btn-close-salud-modal');
  const btnCancel = document.getElementById('btn-cancel-salud-form');
  const form = document.getElementById('form-salud');

  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      form.reset();
      document.getElementById('salud-fecha-diagnostico').value = new Date().toISOString().split('T')[0];
      const cuySelect = document.getElementById('salud-cuy-id');
      cuySelect.innerHTML = allCuyes.map(c => `<option value="${c.id}">${c.codigo} - ${c.nombre || c.raza} (${c.estado_salud})</option>`).join('');
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
      await handleSaveSalud();
    });
  }
}

function renderSaludTable() {
  const tbody = document.getElementById('salud-table-body');
  if (!tbody) return;

  tbody.innerHTML = allRegistros.map(r => {
    const cuy = r.cuy ? `${r.cuy.codigo} (${r.cuy.nombre || 'Cuy'})` : 'Cuy no especificado';
    const estadoClass = r.estado === 'Recuperado'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : r.estado === 'Crítico'
        ? 'bg-red-100 text-red-800 border-red-200'
        : 'bg-amber-100 text-amber-800 border-amber-200';

    return `
      <tr class="hover:bg-stone-50/80 transition">
        <td class="py-3 px-4 font-bold text-stone-900 font-mono text-sm">${cuy}</td>
        <td class="py-3 px-3 text-xs text-stone-700">${r.fecha_diagnostico}</td>
        <td class="py-3 px-3">
          <span class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-700">
            ${r.tipo_evento}
          </span>
        </td>
        <td class="py-3 px-3 text-xs font-semibold text-stone-800">${r.diagnostico}</td>
        <td class="py-3 px-3 text-xs text-stone-600">
          <span class="font-medium text-stone-800">${r.medicamento || 'Sin medicamento'}</span>
          ${r.dosis ? `<span class="block text-[11px] text-stone-400">${r.dosis}</span>` : ''}
        </td>
        <td class="py-3 px-3 text-xs text-stone-500">${r.veterinario_responsable || 'No indicado'}</td>
        <td class="py-3 px-3">
          <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${estadoClass}">
            ${r.estado}
          </span>
        </td>
        <td class="py-3 px-4 text-right">
          ${r.estado === 'En Tratamiento' ? `
            <button onclick="window.darAltaMedica('${r.id}', '${r.cuy_id}')" class="inline-flex items-center px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition border border-emerald-200">
              <i data-lucide="check" class="w-3.5 h-3.5 mr-1"></i> Dar de Alta
            </button>
          ` : `
            <span class="text-[11px] text-stone-400 font-medium">Archivado</span>
          `}
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

async function handleSaveSalud() {
  const data = {
    cuy_id: document.getElementById('salud-cuy-id').value,
    tipo_evento: document.getElementById('salud-tipo-evento').value,
    diagnostico: document.getElementById('salud-diagnostico').value.trim(),
    medicamento: document.getElementById('salud-medicamento').value.trim(),
    dosis: document.getElementById('salud-dosis').value.trim(),
    veterinario_responsable: document.getElementById('salud-veterinario').value.trim(),
    costo_tratamiento: document.getElementById('salud-costo').value,
    fecha_diagnostico: document.getElementById('salud-fecha-diagnostico').value,
    estado: document.getElementById('salud-estado').value,
    observaciones: document.getElementById('salud-observaciones').value.trim()
  };

  try {
    await createRegistroMedico(data);
    window.showToast('Atención veterinaria guardada', 'success');
    document.getElementById('modal-salud-form').classList.add('hidden');
    allRegistros = await getRegistrosMedicos();
    allCuyes = await getCuyes();
    renderSaludTable();
  } catch (err) {
    console.error('Error registrando atención sanitaria:', err);
    window.showToast('Error al guardar atención', 'error');
  }
}

window.darAltaMedica = async function(registroId, cuyId) {
  if (!confirm('¿Confirmar que el animal ha completado satisfactoriamente el tratamiento y se encuentra sano?')) {
    return;
  }

  try {
    await updateRegistroMedico(registroId, { estado: 'Recuperado' });
    if (cuyId) {
      await updateCuy(cuyId, { estado_salud: 'Sano' });
    }
    window.showToast('Animal dado de alta médica (Estado: Sano)', 'success');
    allRegistros = await getRegistrosMedicos();
    allCuyes = await getCuyes();
    renderSaludTable();
  } catch (err) {
    console.error('Error dando de alta:', err);
    window.showToast('Error al actualizar registro médico', 'error');
  }
};
