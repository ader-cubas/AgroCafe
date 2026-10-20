const runtime = (globalThis as typeof globalThis & {
  Deno: {
    env: { get(name: string): string | undefined };
    serve(handler: (request: Request) => Response | Promise<Response>): void;
  };
}).Deno;

const maxRequestsPerMinute = 8;
const maxRequestBytes = 128 * 1024;
const requestCounts = new Map<string, { count: number; startedAt: number }>();

const responseSchema = {
  type: 'OBJECT',
  properties: {
    diagnostico_situacion: { type: 'STRING' },
    causa_principal: { type: 'STRING' },
    accion_inmediata: { type: 'STRING' },
    prevencion_diaria: { type: 'STRING' },
  },
  required: [
    'diagnostico_situacion',
    'causa_principal',
    'accion_inmediata',
    'prevencion_diaria',
  ],
  propertyOrdering: [
    'diagnostico_situacion',
    'causa_principal',
    'accion_inmediata',
    'prevencion_diaria',
  ],
};

const systemPrompt = `Eres un asistente de bioseguridad, manejo y sanidad para granjas de cuyes. Analiza únicamente lo que sea visible en la fotografía y responde en español con JSON estricto según el esquema.
Revisa, cuando la imagen lo permita: parásitos externos (piojos, pulgas, ácaros y lesiones de piel); señales externas compatibles con problemas digestivos o de alimentación, como abdomen visiblemente hinchado y forraje húmedo o fermentado; bioseguridad e higiene (comedero o bebedero sucio, heces acumuladas, cama húmeda y falta de limpieza); y lesiones visibles compatibles con enfermedad.
No declares timpanismo, neumonía, daño hepático ni otra enfermedad interna basándote solo en una foto externa. Un órgano interno solo puede describirse si aparece explícitamente en una imagen de necropsia; aun así, no confirmes causa o enfermedad definitiva. Si la foto no permite valorar algo, dilo y expresa la incertidumbre.
Incluye obligatoriamente: diagnostico_situacion (hallazgo o situación observada); causa_principal (causa visible o probable, por ejemplo forraje húmedo/fermentado, alimento contaminado o falta de limpieza; indica si no se puede determinar); accion_inmediata (aislamiento, retirar forraje sospechoso, ofrecer agua limpia, limpieza/desinfección y consulta veterinaria según el caso); prevencion_diaria (rutina práctica y frecuencia para limpieza, secado/ventilación del forraje y revisión de agua, comederos y bebederos).
No prescribas medicamentos, dosis ni vías de administración a partir de una imagen. Si el caso pudiera requerir fármacos, indica que el veterinario debe definir producto, dosis y vía según examen y peso. Para limpieza, recomienda retirar animales y alimento antes de desinfectar, seguir la etiqueta del producto, enjuagar cuando corresponda y secar antes de reingresar; nunca mezclar desinfectantes. No recomiendes productos tóxicos para cuyes. Mantén cada campo breve, accionable y sin Markdown.`;

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
    const declaredLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > maxRequestBytes) {
      return jsonResponse({ error: 'La foto supera el tamaño permitido después de comprimirla.' }, 413, origin);
    }
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxRequestBytes) {
      return jsonResponse({ error: 'La foto supera el tamaño permitido después de comprimirla.' }, 413, origin);
    }
    const body = JSON.parse(rawBody);
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
                text: systemPrompt,
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
    const stringFields = ['diagnostico_situacion', 'causa_principal', 'accion_inmediata', 'prevencion_diaria'];
    if (stringFields.some((field) => typeof result[field] !== 'string' || !result[field].trim())) {
      return jsonResponse({ error: 'Gemini devolvió una respuesta incompleta.' }, 502, origin);
    }

    return jsonResponse({
      result: {
        diagnostico_situacion: result.diagnostico_situacion.slice(0, 1200),
        causa_principal: result.causa_principal.slice(0, 1000),
        accion_inmediata: result.accion_inmediata.slice(0, 1600),
        prevencion_diaria: result.prevencion_diaria.slice(0, 1200),
      },
    }, 200, origin);
  } catch {
    return jsonResponse({ error: 'No se pudo procesar la imagen. Intenta nuevamente.' }, 400, origin);
  }
});