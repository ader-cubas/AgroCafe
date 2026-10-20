const runtime = (globalThis as typeof globalThis & {
  Deno: {
    env: { get(name: string): string | undefined };
    serve(handler: (request: Request) => Response | Promise<Response>): void;
  };
}).Deno;

const maxRequestsPerMinute = 8;
const requestCounts = new Map<string, { count: number; startedAt: number }>();

const responseSchema = {
  type: 'OBJECT',
  properties: {
    motivo_causa: { type: 'STRING' },
    lesiones_referencia: { type: 'STRING' },
    manejo_inmediato: { type: 'STRING' },
    dias_protocolo: { type: 'INTEGER' },
    via_farmacologica: { type: 'STRING' },
    sugerencia_dosis: { type: 'STRING' },
  },
  required: [
    'motivo_causa',
    'lesiones_referencia',
    'manejo_inmediato',
    'dias_protocolo',
    'via_farmacologica',
    'sugerencia_dosis',
  ],
  propertyOrdering: [
    'motivo_causa',
    'lesiones_referencia',
    'manejo_inmediato',
    'dias_protocolo',
    'via_farmacologica',
    'sugerencia_dosis',
  ],
};

function corsHeaders(origin: string | null): HeadersInit {
  const configuredOrigins = runtime.env.get('ALLOWED_ORIGINS')
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = configuredOrigins || [];
  const allowedOrigin = allowedOrigins.includes('*')
    ? '*'
    : origin && allowedOrigins.includes(origin)
    ? origin
    : 'null';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

function allowedByOrigin(origin: string | null): boolean {
  const configuredOrigins = runtime.env.get('ALLOWED_ORIGINS')
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return Boolean(origin && configuredOrigins?.length && (configuredOrigins.includes('*') || configuredOrigins.includes(origin)));
}

runtime.serve(async (request: Request) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido' }, 405, origin);
  }
  if (!allowedByOrigin(origin)) {
    return jsonResponse({ error: 'Origen no autorizado' }, 403, origin);
  }

  const now = Date.now();
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const requestWindow = requestCounts.get(clientIp);
  if (requestWindow && now - requestWindow.startedAt < 60_000 && requestWindow.count >= maxRequestsPerMinute) {
    return jsonResponse({ error: 'Límite temporal alcanzado. Intenta de nuevo en un minuto.' }, 429, origin);
  }
  requestCounts.set(clientIp, requestWindow && now - requestWindow.startedAt < 60_000
    ? { ...requestWindow, count: requestWindow.count + 1 }
    : { count: 1, startedAt: now });

  const geminiApiKey = runtime.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    return jsonResponse({ error: 'El servicio veterinario aún no está configurado.' }, 503, origin);
  }

  try {
    const body = await request.json();
    const image = body?.image;
    if (image?.mime_type !== 'image/jpeg' || typeof image.data !== 'string' || image.data.length > 120_000) {
      return jsonResponse({ error: 'La imagen debe ser un JPEG comprimido válido.' }, 400, origin);
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              {
                text: 'Orienta el registro sanitario de un cuy usando solo hallazgos visibles. No confirmes enfermedades. Responde exclusivamente en JSON con el esquema indicado. Prioriza aislamiento, higiene, bioseguridad y consulta veterinaria. No prescribas fármacos ni dosis: indica que la vía y dosis requieren evaluación y prescripción veterinaria. dias_protocolo es solo seguimiento, nunca duración de tratamiento. Si la imagen no permite valorar, indícalo.',
              },
              { inline_data: { mime_type: 'image/jpeg', data: image.data } },
            ],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      return jsonResponse({ error: 'No se pudo analizar la imagen con Gemini.' }, 502, origin);
    }

    const geminiPayload = await geminiResponse.json();
    const responseText = geminiPayload.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('');
    if (!responseText) {
      return jsonResponse({ error: 'Gemini no devolvió una orientación legible.' }, 502, origin);
    }

    const result = JSON.parse(responseText);
    const stringFields = [
      'motivo_causa',
      'lesiones_referencia',
      'manejo_inmediato',
    ];
    if (stringFields.some((field) => typeof result[field] !== 'string' || !result[field].trim())) {
      return jsonResponse({ error: 'Gemini devolvió una respuesta incompleta.' }, 502, origin);
    }

    return jsonResponse({
      result: {
        motivo_causa: result.motivo_causa.slice(0, 1200),
        lesiones_referencia: result.lesiones_referencia.slice(0, 1200),
        manejo_inmediato: result.manejo_inmediato.slice(0, 1600),
        dias_protocolo: Number.isInteger(result.dias_protocolo) && result.dias_protocolo >= 1 && result.dias_protocolo <= 30
          ? result.dias_protocolo
          : 3,
        via_farmacologica: 'No indicada sin evaluación clínica y prescripción veterinaria.',
        sugerencia_dosis: 'No se recomienda una dosis basada solo en una imagen. Consulta a un veterinario.',
      },
    }, 200, origin);
  } catch {
    return jsonResponse({ error: 'No se pudo procesar la imagen. Intenta nuevamente.' }, 400, origin);
  }
});