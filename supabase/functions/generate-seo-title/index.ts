import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productInfo, vehicleInfo } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um especialista em SEO para e-commerce brasileiro. Seu trabalho é criar um único título de produto altamente otimizado para marketplaces como Mercado Livre, Amazon Brasil, Shopee e Google Shopping.

Regras de SEO para português brasileiro:
- Máximo de 120 caracteres
- Escreva SOMENTE em português do Brasil
- Inclua as palavras-chave mais importantes de forma natural
- Mencione a compatibilidade com veículo se fornecida (ex: "para Honda CG 160 2023")
- Comece com o tipo/nome do produto
- Seja específico sobre especificações técnicas relevantes
- Use termos que o consumidor brasileiro realmente pesquisa
- Não use abreviações que confundam o consumidor
- Não use símbolos desnecessários como "|", "/", "-" em excesso
- Retorne APENAS o título, sem explicações ou pontuação final`;

    const userPrompt = `Informações do Produto: ${productInfo}${vehicleInfo ? `\nCompatibilidade com Veículo: ${vehicleInfo}` : ""}

Gere um único título de produto otimizado para SEO em português do Brasil.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(JSON.stringify({ title }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-seo-title error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
