// ==============================================================================
// SISGRANJA - VISTA DE REPORTES, EXPORTACIÓN Y CONFIGURACIÓN DE CONEXIÓN
// ==============================================================================

import { exportAllData, importAllData, resetToDemoData, getDashboardStats, getCuyes } from '../storageManager.js';
import { getSavedCredentials, saveCredentials, testConnection, getConnectionState } from '../supabaseClient.js';

export async function renderReportes(container) {
  const [stats, cuyes] = await Promise.all([
    getDashboardStats(),
    getCuyes()
  ]);

  const creds = getSavedCredentials();
  const connState = getConnectionState();

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <!-- Encabezado del Módulo -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-stone-900 tracking-tight flex items-center">
            <span class="p-2 bg-indigo-100 text-indigo-700 rounded-xl mr-3 inline-flex">
              <i data-lucide="file-text" class="w-6 h-6"></i>
            </span>
            Reportes, Respaldos y Conectividad
          </h1>
          <p class="text-stone-500 text-sm mt-1">Exportación en CSV/JSON, informe para impresión y sincronización con Supabase.</p>
        </div>
        <button id="btn-print-report" class="inline-flex items-center px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-sm font-semibold shadow transition">
          <i data-lucide="printer" class="w-4 h-4 mr-2"></i> Imprimir Reporte
        </button>
      </div>

      <!-- Resumen Zootécnico Imprimible -->
      <div id="printable-section" class="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-6 space-y-6">
        <div class="border-b border-stone-200 pb-4 flex justify-between items-start">
          <div>
            <h2 class="text-xl font-bold text-stone-900">Informe Zootécnico de Producción Cuyícola</h2>
            <p class="text-stone-500 text-xs mt-0.5">Granja SisGranja · Fecha de emisión: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <span class="px-3 py-1 bg-stone-100 text-stone-700 text-xs font-mono font-bold rounded-lg border border-stone-300">
            SISTEMA SISGRANJA v1.0
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <span class="text-stone-500 block">Población Activa</span>
            <span class="font-extrabold text-stone-900 text-lg">${stats.totalCuyes} cuyes</span>
          </div>
          <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <span class="text-stone-500 block">Reproductores</span>
            <span class="font-extrabold text-stone-900 text-lg">${stats.etapas.reproductores}</span>
          </div>
          <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <span class="text-stone-500 block">Crías & Recría</span>
            <span class="font-extrabold text-stone-900 text-lg">${stats.etapas.crias + stats.etapas.recrias}</span>
          </div>
          <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <span class="text-stone-500 block">Mortalidad Perinatal</span>
            <span class="font-extrabold text-stone-900 text-lg">${stats.reproduccion.tasaMortalidadPerinatal}%</span>
          </div>
        </div>

        <!-- Tabla sintética de cuyes -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">Cuyes en Granja (Muestra de Inventario)</h3>
          <div class="overflow-x-auto border border-stone-200 rounded-xl">
            <table class="w-full text-left text-xs">
              <thead class="bg-stone-50 text-stone-700 font-semibold border-b border-stone-200">
                <tr>
                  <th class="p-2.5">Código</th>
                  <th class="p-2.5">Nombre</th>
                  <th class="p-2.5">Raza</th>
                  <th class="p-2.5">Género</th>
                  <th class="p-2.5">Etapa</th>
                  <th class="p-2.5">Peso</th>
                  <th class="p-2.5">Estado Salud</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100">
                ${cuyes.slice(0, 10).map(c => `
                  <tr>
                    <td class="p-2.5 font-mono font-bold">${c.codigo}</td>
                    <td class="p-2.5">${c.nombre || '-'}</td>
                    <td class="p-2.5">${c.raza}</td>
                    <td class="p-2.5">${c.genero}</td>
                    <td class="p-2.5">${c.etapa}</td>
                    <td class="p-2.5 font-bold">${c.peso_actual_g} g</td>
                    <td class="p-2.5">${c.estado_salud}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ${cuyes.length > 10 ? `<p class="text-[11px] text-stone-400 mt-1 italic">... y ${cuyes.length - 10} registros adicionales exportables en CSV completo.</p>` : ''}
        </div>
      </div>

      <!-- Sección de Exportación y Respaldos -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Tarjeta de Exportación / Importación -->
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-6 space-y-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <i data-lucide="download-cloud" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="font-bold text-stone-800 text-base">Copia de Seguridad y Migración</h3>
              <p class="text-xs text-stone-500">Descarga tus datos locales en formatos estándar</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button id="btn-export-json" class="flex flex-col items-center justify-center p-4 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition text-center group">
              <i data-lucide="file-json" class="w-6 h-6 text-indigo-600 mb-1.5 group-hover:scale-110 transition"></i>
              <span class="text-xs font-bold text-stone-800">Exportar JSON</span>
              <span class="text-[10px] text-stone-400">Respaldo total del sistema</span>
            </button>

            <button id="btn-export-csv" class="flex flex-col items-center justify-center p-4 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition text-center group">
              <i data-lucide="file-spreadsheet" class="w-6 h-6 text-emerald-600 mb-1.5 group-hover:scale-110 transition"></i>
              <span class="text-xs font-bold text-stone-800">Exportar CSV</span>
              <span class="text-[10px] text-stone-400">Compatible con MS Excel</span>
            </button>
          </div>

          <div class="pt-3 border-t border-stone-100 flex items-center justify-between">
            <label class="cursor-pointer inline-flex items-center text-xs text-stone-700 hover:text-indigo-600 font-semibold">
              <i data-lucide="upload" class="w-4 h-4 mr-1.5 text-stone-400"></i>
              Restaurar respaldo JSON
              <input type="file" id="file-import-json" accept=".json" class="hidden" />
            </label>
            <button id="btn-reset-demo" class="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline">
              Cargar datos demo
            </button>
          </div>
        </div>

        <!-- Tarjeta de Configuración de Supabase -->
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <i data-lucide="database" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="font-bold text-stone-800 text-base">Conexión con Supabase</h3>
                <p class="text-xs text-stone-500">Sincronización en la nube PostgreSQL</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-bold ${connState.isConnected ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}">
              ${connState.isConnected ? '● Conectado' : '● Modo Local'}
            </span>
          </div>

          <form id="form-supabase-config" class="space-y-3 pt-2">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Project URL de Supabase</label>
              <input type="url" id="config-supabase-url" value="${creds.url || ''}" placeholder="https://xyzproject.supabase.co" class="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Anon Public Key</label>
              <input type="password" id="config-supabase-key" value="${creds.anonKey || ''}" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..." class="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono" />
            </div>

            <div class="pt-2 flex gap-2">
              <button type="button" id="btn-test-supabase" class="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-300 transition">
                Probar Conexión
              </button>
              <button type="submit" class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition">
                Guardar Credenciales
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  setupReportesEvents();
}

function setupReportesEvents() {
  const btnPrint = document.getElementById('btn-print-report');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const fileImportJson = document.getElementById('file-import-json');
  const btnResetDemo = document.getElementById('btn-reset-demo');
  const formSupabase = document.getElementById('form-supabase-config');
  const btnTestSupabase = document.getElementById('btn-test-supabase');

  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      const data = exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sisgranja_respaldo_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      window.showToast('Respaldo JSON descargado con éxito', 'success');
    });
  }

  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', async () => {
      const cuyes = await getCuyes();
      const headers = ['Codigo', 'Nombre', 'Raza', 'Genero', 'Etapa', 'Peso_Gramos', 'Fecha_Nacimiento', 'Estado_Salud', 'Poza'];
      const rows = cuyes.map(c => [
        `"${c.codigo}"`,
        `"${c.nombre || ''}"`,
        `"${c.raza}"`,
        `"${c.genero}"`,
        `"${c.etapa}"`,
        c.peso_actual_g,
        `"${c.fecha_nacimiento}"`,
        `"${c.estado_salud}"`,
        `"${c.poza ? c.poza.codigo : 'Sin Poza'}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_cuyes_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      window.showToast('Inventario CSV generado para Excel', 'success');
    });
  }

  if (fileImportJson) {
    fileImportJson.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          const res = importAllData(parsed);
          if (res.success) {
            window.showToast('Respaldo restaurado exitosamente', 'success');
            setTimeout(() => window.location.reload(), 1000);
          } else {
            window.showToast('Error en la estructura del archivo', 'error');
          }
        } catch (err) {
          window.showToast('Archivo JSON no válido', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  if (btnResetDemo) {
    btnResetDemo.addEventListener('click', () => {
      if (confirm('¿Restablecer el sistema con los datos zootécnicos de demostración? Se sobreescribirán los datos locales.')) {
        resetToDemoData();
        window.showToast('Datos demo cargados con éxito', 'success');
        setTimeout(() => window.location.reload(), 800);
      }
    });
  }

  if (btnTestSupabase) {
    btnTestSupabase.addEventListener('click', async () => {
      const url = document.getElementById('config-supabase-url').value.trim();
      const key = document.getElementById('config-supabase-key').value.trim();

      if (!url || !key) {
        window.showToast('Ingresa URL y Anon Key primero', 'warning');
        return;
      }

      window.showToast('Probando conexión con Supabase...', 'info');
      await saveCredentials(url, key);
      const res = await testConnection();
      if (res.success) {
        window.showToast('¡Conectado exitosamente con Supabase!', 'success');
        setTimeout(() => window.location.reload(), 800);
      } else {
        window.showToast('No se pudo conectar a Supabase: ' + (res.error || 'Revisa URL/Key'), 'error');
      }
    });
  }

  if (formSupabase) {
    formSupabase.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = document.getElementById('config-supabase-url').value.trim();
      const key = document.getElementById('config-supabase-key').value.trim();
      await saveCredentials(url, key);
      window.showToast('Credenciales guardadas en el navegador', 'success');
      setTimeout(() => window.location.reload(), 800);
    });
  }
}
