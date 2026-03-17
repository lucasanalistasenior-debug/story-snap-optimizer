import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_PROMPTS = [
  // Image 1: Product on white background with vehicle
  (productInfo: string, vehicleInfo: string) =>
    `Professional e-commerce product photography. ${productInfo}${vehicleInfo ? ` compatible with ${vehicleInfo}` : ""}. The product is displayed on a pure white background, cleanly lit with soft studio lighting. No shadows. Ultra clean, minimal, commercial product shot suitable for Amazon listing.`,

  // Image 2: Product in context/lifestyle
  (productInfo: string, vehicleInfo: string) =>
    `Lifestyle product photography. ${productInfo}${vehicleInfo ? ` for ${vehicleInfo}` : ""}. Product shown installed or in use in a realistic setting. Professional automotive/product photography style. Well-lit, sharp focus, high quality commercial image.`,

  // Image 3: Product detail/close-up with feature callouts
  (productInfo: string, vehicleInfo: string) =>
    `Close-up detail product photography showing key features of ${productInfo}. Macro photography style highlighting material quality, craftsmanship, and important specifications. Clean background with soft gradient. High-end commercial photography.`,

  // Image 4: Comparison or multi-angle shot
  (productInfo: string, vehicleInfo: string) =>
    `Professional product photography showing ${productInfo} from multiple angles or displayed alongside packaging. ${vehicleInfo ? `Compatible with ${vehicleInfo}.` : ""} Clean studio setup with neutral gray gradient background. Commercial e-commerce style.`,
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productInfo, vehicleInfo, imageIndex } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const promptFn = IMAGE_PROMPTS[imageIndex % IMAGE_PROMPTS.length];
    const prompt = promptFn(productInfo, vehicleInfo ?? "");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
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
      console.error("Image generation error:", response.status, text);
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    const images = data.choices?.[0]?.message?.images;

    if (!images || images.length === 0) {
      throw new Error("No image returned from AI gateway");
    }

    const imageUrl = images[0]?.image_url?.url;

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-product-images error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
