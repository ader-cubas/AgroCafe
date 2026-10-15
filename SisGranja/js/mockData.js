// ==============================================================================
// SISGRANJA - DATOS SEMILLA PARA MODO LOCAL Y RESPALDO
// ==============================================================================

export const MOCK_POZAS = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    codigo: 'PZ-MAT-01',
    nombre: 'Poza Maternidad Norte',
    tipo: 'Maternidad',
    capacidad_maxima: 8,
    ubicacion_galpon: 'Galpón 1 - Sector A',
    estado: 'Activa',
    observaciones: 'Luz natural adecuada, comederos lineales instalados.'
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    codigo: 'PZ-REP-01',
    nombre: 'Poza Reproductoras Núcleo A',
    tipo: 'Reproducción',
    capacidad_maxima: 10,
    ubicacion_galpon: 'Galpón 1 - Sector B',
    estado: 'Activa',
    observaciones: 'Harén de 1 macho reproductor y 7 hembras activas.'
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    codigo: 'PZ-REC-01',
    nombre: 'Poza Recría Hembras Crecimiento',
    tipo: 'Recría',
    capacidad_maxima: 15,
    ubicacion_galpon: 'Galpón 2 - Crecimiento',
    estado: 'Activa',
    observaciones: 'Gazapos destetados en etapa de desarrollo ponderal.'
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    codigo: 'PZ-CUA-01',
    nombre: 'Poza Cuarentena y Sanidad',
    tipo: 'Cuarentena',
    capacidad_maxima: 6,
    ubicacion_galpon: 'Área Sanitaria Aislada',
    estado: 'Activa',
    observaciones: 'Animales bajo observación médica o recién ingresados.'
  }
];

export const MOCK_CUYES = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    codigo: 'CUY-2024-001',
    nombre: 'Zeus (Padrillo Supremo)',
    raza: 'Perú',
    genero: 'Macho',
    etapa: 'Reproductor',
    peso_actual_g: 1540,
    fecha_nacimiento: '2023-04-10',
    poza_id: '11111111-1111-1111-1111-111111111102',
    padre_id: null,
    madre_id: null,
    estado_salud: 'Sano',
    activo: true,
    observaciones: 'Excelente conformación carnicera, cabeza ancha, dócil.'
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    codigo: 'CUY-2024-002',
    nombre: 'Luna',
    raza: 'Andina',
    genero: 'Hembra',
    etapa: 'Reproductor',
    peso_actual_g: 1220,
    fecha_nacimiento: '2023-05-15',
    poza_id: '11111111-1111-1111-1111-111111111102',
    padre_id: null,
    madre_id: null,
    estado_salud: 'Sano',
    activo: true,
    observaciones: 'Alta prolificidad histórica (promedio 4.2 crías/parto).'
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    codigo: 'CUY-2024-003',
    nombre: 'Canela',
    raza: 'Perú',
    genero: 'Hembra',
    etapa: 'Reproductor',
    peso_actual_g: 1280,
    fecha_nacimiento: '2023-06-01',
    poza_id: '11111111-1111-1111-1111-111111111101',
    padre_id: null,
    madre_id: null,
    estado_salud: 'Sano',
    activo: true,
    observaciones: 'Madre ejemplar, actualmente amamantando camada reciente.'
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    codigo: 'CUY-2024-004',
    nombre: 'Thor (Padrillo Inti)',
    raza: 'Inti',
    genero: 'Macho',
    etapa: 'Reproductor',
    peso_actual_g: 1420,
    fecha_nacimiento: '2023-03-20',
    poza_id: '11111111-1111-1111-1111-111111111102',
    padre_id: null,
    madre_id: null,
    estado_salud: 'Sano',
    activo: true,
    observaciones: 'Color bayo con blanco. Gran rusticidad y adaptación.'
  },
  {
    id: '22222222-2222-2222-2222-222222222205',
    codigo: 'CUY-2024-005',
    nombre: 'Manchitas',
    raza: 'Criollo',
    genero: 'Hembra',
    etapa: 'Recría',
    peso_actual_g: 690,
    fecha_nacimiento: '2024-01-12',
    poza_id: '11111111-1111-1111-1111-111111111104',
    padre_id: '22222222-2222-2222-2222-222222222201',
    madre_id: '22222222-2222-2222-2222-222222222202',
    estado_salud: 'Enfermo',
    activo: true,
    observaciones: 'En tratamiento por micosis superficial en la oreja.'
  },
  {
    id: '22222222-2222-2222-2222-222222222206',
    codigo: 'CUY-2024-006',
    nombre: 'Copito',
    raza: 'Andina',
    genero: 'Macho',
    etapa: 'Cría',
    peso_actual_g: 240,
    fecha_nacimiento: '2024-03-01',
    poza_id: '11111111-1111-1111-1111-111111111101',
    padre_id: '22222222-2222-2222-2222-222222222201',
    madre_id: '22222222-2222-2222-2222-222222222203',
    estado_salud: 'Sano',
    activo: true,
    observaciones: 'Cría vigorosa, destete programado pronto.'
  },
  {
    id: '22222222-2222-2222-2222-222222222207',
    codigo: 'CUY-2024-007',
    nombre: 'Princesa',
    raza: 'Perú',
    genero: 'Hembra',
    etapa: 'Cría',
    peso_actual_g: 225,
    fecha_nacimiento: '2024-03-01',
    poza_id: '11111111-1111-1111-1111-111111111101',
    padre_id: '22222222-2222-2222-2222-222222222201',
    madre_id: '22222222-2222-2222-2222-222222222203',
    estado_salud: 'Sano',
    activo: true,
    observaciones: 'Hermana de camada de Copito.'
  },
  {
    id: '22222222-2222-2222-2222-222222222208',
    codigo: 'CUY-2024-008',
    nombre: 'Choco',
    raza: 'California',
    genero: 'Macho',
    etapa: 'Recría',
    peso_actual_g: 780,
    fecha_nacimiento: '2024-01-05',
    poza_id: '11111111-1111-1111-1111-111111111103',
    padre_id: null,
    madre_id: null,
    estado_salud: 'En Observación',
    activo: true,
    observaciones: 'Ligera disminución de ingesta forrajera en revisión de peso.'
  },
  {
    id: '22222222-2222-2222-2222-222222222209',
    codigo: 'CUY-2024-009',
    nombre: 'Kira',
    raza: 'Andina',
    genero: 'Hembra',
    etapa: 'Reproductor',
    peso_actual_g: 1190,
    fecha_nacimiento: '2023-07-22',
    poza_id: '11111111-1111-1111-1111-111111111102',
    padre_id: null,
    madre_id: null,
    estado_salud: 'Sano',
    activo: true,
    observaciones: 'En segundo ciclo de reproducción.'
  },
  {
    id: '22222222-2222-2222-2222-222222222210',
    codigo: 'CUY-2024-010',
    nombre: 'Rayito',
    raza: 'Inti',
    genero: 'Macho',
    etapa: 'Engorde',
    peso_actual_g: 980,
    fecha_nacimiento: '2023-11-10',
    poza_id: '11111111-1111-1111-1111-111111111103',
    padre_id: null,
    madre_id: null,
    estado_salud: 'Sano',
    activo: true,
    observaciones: 'Destinado a comercialización de carne de primera calidad.'
  }
];

export const MOCK_EMPADRES = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    codigo: 'EMP-2024-001',
    macho_id: '22222222-2222-2222-2222-222222222201',
    poza_id: '11111111-1111-1111-1111-111111111102',
    fecha_inicio: '2023-12-05',
    fecha_fin: '2024-01-20',
    fecha_estimada_parto: '2024-02-11',
    estado: 'Finalizado',
    observaciones: 'Empadre exitoso con hembra Canela (CUY-003).'
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    codigo: 'EMP-2024-002',
    macho_id: '22222222-2222-2222-2222-222222222204',
    poza_id: '11111111-1111-1111-1111-111111111102',
    fecha_inicio: '2024-02-15',
    fecha_fin: null,
    fecha_estimada_parto: '2024-04-24',
    estado: 'Gestación',
    observaciones: 'Hembra Luna (CUY-002) y Kira (CUY-009) en gestación confirmada por palpación.'
  }
];

export const MOCK_PARTOS = [
  {
    id: '44444444-4444-4444-4444-444444444401',
    codigo: 'CAM-2024-001',
    empadre_id: '33333333-3333-3333-3333-333333333301',
    madre_id: '22222222-2222-2222-2222-222222222203',
    fecha_parto: '2024-02-11',
    crias_vivas: 4,
    crias_muertas: 0,
    peso_promedio_nacimiento_g: 135.5,
    fecha_destete_programada: '2024-03-04',
    estado_destete: 'Completado',
    observaciones: 'Parto de día sin complicaciones. Se registraron Copito y Princesa.'
  },
  {
    id: '44444444-4444-4444-4444-444444444402',
    codigo: 'CAM-2024-002',
    empadre_id: '33333333-3333-3333-3333-333333333301',
    madre_id: '22222222-2222-2222-2222-222222222202',
    fecha_parto: '2024-03-01',
    crias_vivas: 3,
    crias_muertas: 1,
    peso_promedio_nacimiento_g: 122.0,
    fecha_destete_programada: '2024-03-22',
    estado_destete: 'Pendiente',
    observaciones: '1 mortinato por parto distócico leve. Las 3 crías vivas maman vigorosamente.'
  }
];

export const MOCK_REGISTROS_MEDICOS = [
  {
    id: '55555555-5555-5555-5555-555555555501',
    cuy_id: '22222222-2222-2222-2222-222222222205',
    fecha_diagnostico: '2024-03-10',
    tipo_evento: 'Tratamiento',
    diagnostico: 'Micosis (Trichophyton mentagrophytes) en oreja y lomo',
    medicamento: 'Ketoconazol crema al 2%',
    dosis: '1 aplicación tópica c/24h por 10 días',
    veterinario_responsable: 'Dra. Elena Vasquez - Vet. Sanitaria',
    fecha_seguimiento: '2024-03-20',
    estado: 'En Tratamiento',
    costo_tratamiento: 18.50,
    observaciones: 'Aislada en poza de cuarentena. Desinfección de viruta realizada.'
  },
  {
    id: '55555555-5555-5555-5555-555555555502',
    cuy_id: '22222222-2222-2222-2222-222222222201',
    fecha_diagnostico: '2024-02-01',
    tipo_evento: 'Preventivo',
    diagnostico: 'Control de rutina y dosificación de Vitamina C y antiparasitario',
    medicamento: 'Ivermectina 1% + Ácido Ascórbico oral',
    dosis: '0.04 ml SC Ivermectina + 25mg Vit C en agua',
    veterinario_responsable: 'Dr. Carlos Mendoza',
    fecha_seguimiento: '2024-05-01',
    estado: 'Recuperado',
    costo_tratamiento: 8.00,
    observaciones: 'Animal en óptimo estado corporal (score 5/5).'
  },
  {
    id: '55555555-5555-5555-5555-555555555503',
    cuy_id: '22222222-2222-2222-2222-222222222208',
    fecha_diagnostico: '2024-03-12',
    tipo_evento: 'Preventivo',
    diagnostico: 'Desparasitación preventiva post-destete',
    medicamento: 'Fipronil tópico (gota en cruz)',
    dosis: '2 gotas por animal',
    veterinario_responsable: 'Dr. Carlos Mendoza',
    fecha_seguimiento: '2024-04-12',
    estado: 'Recuperado',
    costo_tratamiento: 5.00,
    observaciones: 'Control preventivo de piojos y ácaros de recría.'
  }
];
