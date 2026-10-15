// ==============================================================================
// SISGRANJA - VISTA DEL DASHBOARD Y KPIS
// ==============================================================================

import { getDashboardStats, getPartos, getRegistrosMedicos, getCuyes } from '../storageManager.js';
import { APP_CONFIG } from '../config.js';

let etapaChartInstance = null;
let razaChartInstance = null;

export async function renderDashboard(container) {
  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <!-- Encabezado del Dashboard -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-lg">
        <div>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-700/60 text-emerald-200 border border-emerald-500/30 mb-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping"></span>
            Panel de Control Zootécnico
          </span>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Granja Porcina & Cuyícola SisGranja</h1>
          <p class="text-emerald-100 text-sm mt-1">Supervisión integral de piaras, reproducción, natalidad y sanidad animal.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button id="btn-quick-new-cuy" class="inline-flex items-center px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-semibold shadow transition-all duration-200 hover:shadow-emerald-500/30">
            <i data-lucide="plus-circle" class="w-4 h-4 mr-2"></i> Nuevo Cuy
          </button>
          <button id="btn-quick-new-parto" class="inline-flex items-center px-4 py-2.5 bg-teal-700/80 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold border border-teal-500/40 shadow transition">
            <i data-lucide="baby" class="w-4 h-4 mr-2"></i> Registrar Parto
          </button>
        </div>
      </div>

      <!-- Métricas / KPIs Principales -->
      <div id="kpi-cards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-6 bg-white rounded-2xl shadow-sm border border-stone-200/80 flex items-center justify-between">
          <div class="animate-pulse w-full">
            <div class="h-4 bg-stone-200 rounded w-1/2 mb-2"></div>
            <div class="h-8 bg-stone-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>

      <!-- Sección de Gráficos Zootécnicos -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Gráfico: Distribución por Etapas -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-stone-800 text-base flex items-center">
              <i data-lucide="pie-chart" class="w-4 h-4 text-emerald-600 mr-2"></i>
              Etapas Productivas
            </h2>
            <span class="text-xs text-stone-500">Distribución</span>
          </div>
          <div class="relative flex-1 min-h-[230px] flex items-center justify-center">
            <canvas id="chart-etapas"></canvas>
          </div>
        </div>

        <!-- Gráfico: Distribución por Razas -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-stone-800 text-base flex items-center">
              <i data-lucide="bar-chart-2" class="w-4 h-4 text-teal-600 mr-2"></i>
              Población por Razas
            </h2>
            <span class="text-xs text-stone-500">Genética</span>
          </div>
          <div class="relative flex-1 min-h-[230px] flex items-center justify-center">
            <canvas id="chart-razas"></canvas>
          </div>
        </div>

        <!-- Resumen de Indicadores Reproductivos -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-stone-800 text-base flex items-center">
              <i data-lucide="activity" class="w-4 h-4 text-amber-600 mr-2"></i>
              Eficiencia Reproductiva
            </h2>
            <span class="text-xs text-stone-500">Indicadores</span>
          </div>
          <div id="repro-stats-container" class="space-y-3 flex-1 flex flex-col justify-center">
            <!-- Dinámico -->
          </div>
        </div>
      </div>

      <!-- Filas de Alertas Rápidas y Camadas Recientes -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Alertas Sanitarias y Cuarentena -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-stone-800 text-base flex items-center">
              <i data-lucide="shield-alert" class="w-4 h-4 text-rose-500 mr-2"></i>
              Monitoreo y Alertas Sanitarias
            </h2>
            <a href="#salud" class="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">Ver todos</a>
          </div>
          <div id="health-alerts-list" class="space-y-2">
            <!-- Dinámico -->
          </div>
        </div>

        <!-- Próximos Destetes y Partos Programados -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-stone-800 text-base flex items-center">
              <i data-lucide="calendar" class="w-4 h-4 text-sky-600 mr-2"></i>
              Agenda de Destetes y Camadas
            </h2>
            <a href="#reproduccion" class="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">Ver camadas</a>
          </div>
          <div id="weaning-alerts-list" class="space-y-2">
            <!-- Dinámico -->
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Cargar datos asíncronos y poblar UI
  await loadDashboardData();

  // Bindings de botones rápidos
  const btnNewCuy = document.getElementById('btn-quick-new-cuy');
  if (btnNewCuy) {
    btnNewCuy.addEventListener('click', () => {
      window.location.hash = '#cuyes';
      setTimeout(() => {
        const btn = document.getElementById('btn-open-create-cuy-modal');
        if (btn) btn.click();
      }, 100);
    });
  }

  const btnNewParto = document.getElementById('btn-quick-new-parto');
  if (btnNewParto) {
    btnNewParto.addEventListener('click', () => {
      window.location.hash = '#reproduccion';
      setTimeout(() => {
        const btn = document.getElementById('btn-open-create-parto-modal');
        if (btn) btn.click();
      }, 100);
    });
  }
}

async function loadDashboardData() {
  try {
    const [stats, partos, salud, cuyes] = await Promise.all([
      getDashboardStats(),
      getPartos(),
      getRegistrosMedicos(),
      getCuyes()
    ]);

    // 1. Renderizar tarjetas KPI
    renderKpiCards(stats);

    // 2. Renderizar Resumen Reproductivo
    renderReproIndicators(stats);

    // 3. Renderizar Gráfico de Etapas
    renderEtapasChart(stats.etapas);

    // 4. Renderizar Gráfico de Razas
    renderRazasChart(stats.distribucionRazas);

    // 5. Renderizar Alertas Sanitarias
    renderHealthAlerts(cuyes, salud);

    // 6. Renderizar Alertas de Destete
    renderWeaningAlerts(partos);

    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error('Error cargando métricas de dashboard:', error);
  }
}

function renderKpiCards(stats) {
  const container = document.getElementById('kpi-cards');
  if (!container) return;

  const cards = [
    {
      title: 'Población Total',
      value: stats.totalCuyes,
      subtext: `${stats.hembras} hembras · ${stats.machos} machos`,
      icon: 'users',
      bgClass: 'from-emerald-50 to-teal-50',
      iconBg: 'bg-emerald-100 text-emerald-700'
    },
    {
      title: 'Reproductores Activos',
      value: stats.etapas.reproductores,
      subtext: `${stats.reproduccion.empadresActivos} empadres vigentes`,
      icon: 'heart-handshake',
      bgClass: 'from-sky-50 to-indigo-50',
      iconBg: 'bg-sky-100 text-sky-700'
    },
    {
      title: 'Crías & Lactantes',
      value: stats.etapas.crias,
      subtext: `${stats.etapas.recrias} en etapa de recría`,
      icon: 'baby',
      bgClass: 'from-amber-50 to-orange-50',
      iconBg: 'bg-amber-100 text-amber-700'
    },
    {
      title: 'Alertas Sanitarias',
      value: stats.salud.enfermos + stats.salud.enObservacion,
      subtext: `${stats.salud.tratamientosActivos} tratamientos en curso`,
      icon: 'alert-triangle',
      bgClass: 'from-rose-50 to-red-50',
      iconBg: 'bg-rose-100 text-rose-700',
      highlight: stats.salud.enfermos > 0
    }
  ];

  container.innerHTML = cards.map(c => `
    <div class="p-5 bg-gradient-to-br ${c.bgClass} rounded-2xl shadow-sm border border-stone-200/60 transition duration-200 hover:shadow-md">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-stone-500 uppercase tracking-wider">${c.title}</p>
          <p class="text-3xl font-extrabold text-stone-800 mt-1">${c.value}</p>
          <p class="text-xs text-stone-600 mt-1.5 flex items-center">
            ${c.subtext}
          </p>
        </div>
        <div class="w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center shadow-sm">
          <i data-lucide="${c.icon}" class="w-6 h-6"></i>
        </div>
      </div>
    </div>
  `).join('');
}

function renderReproIndicators(stats) {
  const container = document.getElementById('repro-stats-container');
  if (!container) return;

  container.innerHTML = `
    <div class="bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
      <div class="flex justify-between items-center text-sm">
        <span class="text-stone-600 font-medium">Tamaño Promedio de Camada</span>
        <span class="text-stone-900 font-bold text-base">${stats.reproduccion.promedioCriasPorCamada} crías</span>
      </div>
      <p class="text-xs text-stone-500 mt-0.5">Meta zootécnica: 3.5 a 4.5 crías/madre</p>
    </div>

    <div class="bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
      <div class="flex justify-between items-center text-sm">
        <span class="text-stone-600 font-medium">Mortalidad Perinatal</span>
        <span class="font-bold text-base ${parseFloat(stats.reproduccion.tasaMortalidadPerinatal) > 10 ? 'text-rose-600' : 'text-emerald-600'}">
          ${stats.reproduccion.tasaMortalidadPerinatal}%
        </span>
      </div>
      <p class="text-xs text-stone-500 mt-0.5">${stats.reproduccion.totalNacidosMuertos} bajas de ${stats.reproduccion.totalNacidosVivos + stats.reproduccion.totalNacidosMuertos} nacidos totales</p>
    </div>

    <div class="bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
      <div class="flex justify-between items-center text-sm">
        <span class="text-stone-600 font-medium">Ocupación de Pozas</span>
        <span class="font-bold text-base text-teal-700">${stats.pozas.ocupacionPorcentaje}%</span>
      </div>
      <div class="w-full bg-stone-200 rounded-full h-2 mt-2">
        <div class="bg-teal-600 h-2 rounded-full" style="width: ${Math.min(stats.pozas.ocupacionPorcentaje, 100)}%"></div>
      </div>
      <p class="text-xs text-stone-500 mt-1">${stats.totalCuyes} cuyes en ${stats.pozas.totalPozas} pozas habilitadas</p>
    </div>
  `;
}

function renderEtapasChart(etapas) {
  const ctx = document.getElementById('chart-etapas');
  if (!ctx || !window.Chart) return;

  if (etapaChartInstance) {
    etapaChartInstance.destroy();
  }

  etapaChartInstance = new window.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Crías', 'Recría', 'Reproductores', 'Engorde'],
      datasets: [{
        data: [etapas.crias, etapas.recrias, etapas.reproductores, etapas.engorde],
        backgroundColor: ['#38bdf8', '#06b6d4', '#10b981', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { size: 11 } }
        }
      },
      cutout: '68%'
    }
  });
}

function renderRazasChart(razasMap) {
  const ctx = document.getElementById('chart-razas');
  if (!ctx || !window.Chart) return;

  if (razaChartInstance) {
    razaChartInstance.destroy();
  }

  const labels = Object.keys(razasMap);
  const data = Object.values(razasMap);

  razaChartInstance = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['Sin datos'],
      datasets: [{
        label: 'Cuyes',
        data: data.length ? data : [0],
        backgroundColor: '#0d9488',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { size: 10 } },
          grid: { color: '#f3f4f6' }
        },
        x: {
          ticks: { font: { size: 11 } },
          grid: { display: false }
        }
      }
    }
  });
}

function renderHealthAlerts(cuyes, salud) {
  const container = document.getElementById('health-alerts-list');
  if (!container) return;

  const cuyesAlerta = cuyes.filter(c => c.estado_salud === 'Enfermo' || c.estado_salud === 'En Observación' || c.estado_salud === 'Cuarentena');

  if (cuyesAlerta.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center text-stone-500">
        <i data-lucide="check-circle" class="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80"></i>
        <p class="text-sm font-medium">Estado sanitario óptimo</p>
        <p class="text-xs text-stone-400">No hay animales registrados con síntomas o tratamientos pendientes.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = cuyesAlerta.slice(0, 4).map(c => {
    const trat = salud.find(s => s.cuy_id === c.id && s.estado === 'En Tratamiento');
    const badgeColor = c.estado_salud === 'Enfermo' 
      ? 'bg-rose-100 text-rose-800 border-rose-200' 
      : 'bg-amber-100 text-amber-800 border-amber-200';

    return `
      <div class="p-3 bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200/70 flex items-center justify-between transition">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-lg bg-stone-200 flex items-center justify-center font-bold text-stone-700 text-xs">
            ${c.genero === 'Macho' ? '♂' : '♀'}
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-bold text-stone-900 text-sm">${c.codigo}</span>
              ${c.nombre ? `<span class="text-xs text-stone-500 font-medium">(${c.nombre})</span>` : ''}
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}">${c.estado_salud}</span>
            </div>
            <p class="text-xs text-stone-500 mt-0.5">
              ${trat ? `<span class="text-stone-700 font-medium">${trat.diagnostico}</span> · ${trat.medicamento || 'Sin medicamento'}` : 'Bajo monitoreo en poza'}
            </p>
          </div>
        </div>
        <a href="#salud" class="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center">
          Ver ficha <i data-lucide="chevron-right" class="w-3.5 h-3.5 ml-1"></i>
        </a>
      </div>
    `;
  }).join('');
}

function renderWeaningAlerts(partos) {
  const container = document.getElementById('weaning-alerts-list');
  if (!container) return;

  const partosPendientes = partos.filter(p => p.estado_destete !== 'Completado');

  if (partosPendientes.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center text-stone-500">
        <i data-lucide="smile" class="w-8 h-8 text-teal-500 mx-auto mb-2 opacity-80"></i>
        <p class="text-sm font-medium">Todas las camadas están destetadas</p>
        <p class="text-xs text-stone-400">Registra nuevos partos para calcular las fechas óptimas de separación.</p>
      </div>
    `;
    return;
  }

  const hoy = new Date();

  container.innerHTML = partosPendientes.slice(0, 4).map(p => {
    const fechaDestete = p.fecha_destete_programada ? new Date(p.fecha_destete_programada) : null;
    let diasRestantes = null;
    let urgenciaClass = 'text-stone-600 bg-stone-100';

    if (fechaDestete) {
      const diffTime = fechaDestete - hoy;
      diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diasRestantes <= 0) {
        urgenciaClass = 'text-rose-700 bg-rose-100 font-bold border border-rose-300';
      } else if (diasRestantes <= 5) {
        urgenciaClass = 'text-amber-800 bg-amber-100 font-semibold border border-amber-300';
      }
    }

    return `
      <div class="p-3 bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200/70 flex items-center justify-between transition">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
            <i data-lucide="baby" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-bold text-stone-900 text-sm">${p.codigo}</span>
              <span class="text-xs text-stone-500">Madre: ${p.madre ? p.madre.codigo : 'No especificada'}</span>
            </div>
            <p class="text-xs text-stone-500 mt-0.5">
              ${p.crias_vivas} crías vivas · Parto: ${p.fecha_parto}
            </p>
          </div>
        </div>
        <div class="text-right">
          <span class="inline-block px-2.5 py-1 rounded-md text-xs ${urgenciaClass}">
            ${diasRestantes !== null ? (diasRestantes <= 0 ? '¡Destetar hoy!' : `${diasRestantes} días p/destete`) : 'Fecha pendiente'}
          </span>
        </div>
      </div>
    `;
  }).join('');
}
