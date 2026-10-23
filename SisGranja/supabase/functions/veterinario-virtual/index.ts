import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Manejo de peticiones CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const imageBase64 = body.imageBase64 ?? body.image;
    const mimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(body.mime_type) ? body.mime_type : 'image/jpeg';

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No se ha proporcionado ninguna imagen.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Limpiar el prefijo data:image/...;base64, si existe
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('La clave GEMINI_API_KEY no está configurada.');
    }

    // URL usando el endpoint estable v1 y el modelo gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const promptText = `Eres un veterinario experto en cuyes (cavia porcellus). Estilo guía rápida de campo: directo, sin explicaciones.
Analiza la imagen y devuelve EXCLUSIVAMENTE un JSON válido con estos campos:
- "diagnostico_situacion": diagnóstico principal en UNA línea (máx. 15 palabras).
- "causa_principal": causa probable en una frase corta.
- "accion_inmediata": hasta 4 pasos cortos numerados ("1. ... 2. ..."), máx. 12 palabras cada uno.
- "tratamiento_manejo": tratamiento o manejo sugerido en 1-2 frases directas, indicando días y vía si aplica.
- "prevencion_diaria": una frase corta de prevención.

Sin bloques de código ni texto adicional.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.2,
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error de Gemini API:', data);
      return new Response(
        JSON.stringify({ error: data.error?.message || 'Error en el servicio de IA' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // Extraer y parsear la respuesta JSON generada
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedResult = JSON.parse(textResult);

    return new Response(
      JSON.stringify({ result: parsedResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error en Edge Function:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});