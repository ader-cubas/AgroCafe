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
    const { imageBase64 } = await req.json();

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

    const promptText = `Eres un veterinario experto en cuyes (cavia porcellus) y producción cuyícola.
Analiza la imagen adjunta de la lesión o animal afectado y devuelve EXCLUSIVAMENTE un objeto JSON válido con los siguientes campos estrictos:
- "diagnostico_situacion": Descripción clínica detallada de lo observado.
- "causa_principal": Causa más probable de la afección.
- "accion_inmediata": Tratamiento o medida urgente a tomar en la granja.
- "prevencion_diaria": Recomendaciones preventivas de bioseguridad y manejo.

Responde únicamente con el JSON sin bloques de código ni texto adicional.`;

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
                  mime_type: 'image/jpeg',
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