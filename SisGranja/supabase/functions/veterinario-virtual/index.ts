const runtime = (globalThis as typeof globalThis & {
  Deno: {
    env: { get(name: string): string | undefined };
    serve(handler: (request: Request) => Response | Promise<Response>): void;
  };
}).Deno;

type SupportedImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';
type ImageInlinePart = { inline_data: { mime_type: SupportedImageMimeType; data: string } };
type TextPart = { text: string };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

const maxRequestsPerMinute = 8;
const maxRequestBytes = 128 * 1024;
const maxBase64Length = 120_000;
const requestCounts = new Map<string, { count: number; startedAt: number }>();
const responseSchema = {
  type: 'OBJECT',
  properties: {
    diagnostico_situacion: { type: 'STRING' },
    causa_principal: { type: 'STRING' },
    accion_inmediata: { type: 'STRING' },
    prevencion_diaria: { type: 'STRING' },
  },
  required: ['diagnostico_situacion', 'causa_principal', 'accion_inmediata', 'prevencion_diaria'],
  propertyOrdering: ['diagnostico_situacion', 'causa_principal', 'accion_inmediata', 'prevencion_diaria'],
};

const systemPrompt = `Actúa como un asistente virtual especializado en bioseguridad, manejo y sanidad de cuyes; no afirmes ser el veterinario tratante. Analiza solo lo visible y responde exclusivamente con JSON válido, sin Markdown, con exactamente estos cuatro campos de texto: {"diagnostico_situacion":"...","causa_principal":"...","accion_inmediata":"...","prevencion_diaria":"..."}.
Considera parásitos externos, lesiones de piel, señales visibles de problemas digestivos o alimentación (incluidos abdomen hinchado y forraje húmedo o fermentado), higiene de comederos, bebederos y cama, y lesiones visibles. No confirmes timpanismo, neumonía, daño hepático u otras enfermedades internas a partir de una foto externa. Si no se puede valorar, expresa la incertidumbre.
Prioriza aislamiento cuando proceda, retirar alimento sospechoso, agua limpia, higiene y consulta veterinaria. No prescribas medicamentos, dosis ni vías desde una imagen; indica que un veterinario debe definirlos tras examinar al animal y conocer su peso. Para desinfección, sigue la etiqueta, no mezcles productos y deja secar la instalación antes de reingresar animales. Incluye medidas preventivas diarias y frecuencia práctica.`;

function getAllowedOrigins(): string[] {
  return (runtime.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string | null): HeadersInit {
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin = origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))
    ? (allowedOrigins.includes('*') ? '*' : origin)
    : 'null';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function isAllowedOrigin(origin: string | null): boolean {
  const allowedOrigins = getAllowedOrigins();
  return Boolean(origin && allowedOrigins.length && (allowedOrigins.includes('*') || allowedOrigins.includes(origin)));
}

function cleanImageInput(body: Record<string, unknown>): { mimeType: SupportedImageMimeType; base64: string } | null {
  const image = body.image ?? body.img;
  const imageObject = image && typeof image === 'object' ? image as Record<string, unknown> : null;
  const imageValue = typeof image === 'string'
    ? image
    : imageObject?.data ?? imageObject?.base64;
  if (typeof imageValue !== 'string') return null;

  const dataUrlMatch = imageValue.match(/^data:(image\/[a-z0-9.+-]+);base64,/i);
  const rawMimeType = String(body.mime_type ?? body.mimeType ?? imageObject?.mime_type ?? dataUrlMatch?.[1] ?? 'image/jpeg').toLowerCase();
  const mimeType = (rawMimeType === 'image/jpg' ? 'image/jpeg' : rawMimeType) as SupportedImageMimeType;
  const base64 = imageValue.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '').trim();
  const validBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64);
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType) || !base64 || !validBase64 || base64.length > maxBase64Length) return null;
  return { mimeType, base64 };
}

function parseGeminiResult(text: string): Record<string, string> | null {
  const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed: unknown = JSON.parse(jsonText);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const result = parsed as Record<string, unknown>;
  const fields = ['diagnostico_situacion', 'causa_principal', 'accion_inmediata', 'prevencion_diaria'];
  if (fields.some(field => typeof result[field] !== 'string' || !(result[field] as string).trim())) return null;
  return Object.fromEntries(fields.map(field => [field, (result[field] as string).slice(0, 1600)]));
}

runtime.serve(async (request: Request) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (request.method !== 'POST') return jsonResponse({ error: 'Método no permitido.' }, 405, origin);
  if (!isAllowedOrigin(origin)) return jsonResponse({ error: 'Origen no autorizado.' }, 403, origin);

  const now = Date.now();
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const requestWindow = requestCounts.get(clientIp);
  if (requestWindow && now - requestWindow.startedAt < 60_000 && requestWindow.count >= maxRequestsPerMinute) {
    return jsonResponse({ error: 'Límite temporal alcanzado. Intenta de nuevo en un minuto.' }, 429, origin);
  }
  requestCounts.set(clientIp, requestWindow && now - requestWindow.startedAt < 60_000
    ? { ...requestWindow, count: requestWindow.count + 1 }
    : { count: 1, startedAt: now });

  const apiKey = runtime.env.get('GEMINI_API_KEY');
  if (!apiKey) return jsonResponse({ error: 'El servicio veterinario aún no está configurado.' }, 503, origin);

  try {
    const contentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
      return jsonResponse({ error: 'La imagen supera el tamaño permitido.' }, 413, origin);
    }
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxRequestBytes) {
      return jsonResponse({ error: 'La imagen supera el tamaño permitido.' }, 413, origin);
    }
    const body: unknown = JSON.parse(rawBody);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'El cuerpo JSON no es válido.' }, 400, origin);
    }
    const image = cleanImageInput(body as Record<string, unknown>);
    if (!image) return jsonResponse({ error: 'Envía una imagen JPEG, PNG o WebP válida en Base64.' }, 400, origin);

    const imagePart: ImageInlinePart = { inline_data: { mime_type: image.mimeType, data: image.base64 } };
    const parts: Array<TextPart | ImageInlinePart> = [{ text: systemPrompt }, imagePart];
    const primaryModel = runtime.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
    const models = [primaryModel, primaryModel, 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
    const requestBody = JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', responseSchema },
    });
    let geminiResponse!: Response;
    // Reintenta con espera y modelo alterno cuando Gemini está saturado.
    for (let attempt = 0; attempt < models.length; attempt++) {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(models[attempt])}:generateContent?key=${encodeURIComponent(apiKey)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody },
      );
      if (![429, 500, 503, 504].includes(geminiResponse.status)) break;
      if (attempt < models.length - 1) await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
    }

    const geminiData = await geminiResponse.json().catch(() => ({})) as GeminiResponse;
    if (!geminiResponse.ok) {
      if ([429, 503].includes(geminiResponse.status)) {
        return jsonResponse({ error: 'El servicio de análisis está saturado. Espera un minuto e inténtalo de nuevo.' }, 503, origin);
      }
      return jsonResponse({ error: geminiData.error?.message || 'Error al comunicarse con Gemini.' }, 502, origin);
    }
    const resultText = geminiData.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
    if (!resultText) return jsonResponse({ error: 'Gemini no devolvió una respuesta JSON legible.' }, 502, origin);
    const result = parseGeminiResult(resultText);
    if (!result) return jsonResponse({ error: 'Gemini devolvió un JSON incompleto o inválido.' }, 502, origin);
    return jsonResponse({ result }, 200, origin);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido.';
    return jsonResponse({ error: message }, 500, origin);
  }
});
