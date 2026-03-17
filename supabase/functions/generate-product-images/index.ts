import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_PROMPTS = [
  // Image 1 (Hero): Car positioned ABOVE the product on white background
  (productInfo: string, vehicleInfo: string) =>
    `Professional automotive e-commerce hero image. Dramatic composite product shot: a ${vehicleInfo || "modern car"} is prominently displayed in the upper half of the image, positioned above and slightly angled, as if floating or parked above the product. Directly below the car, centered at the bottom of the image, sits the ${productInfo} product on a pure white background. Clean white studio background throughout. The vehicle dominates the top portion, the product sits below it. Crystal clear studio lighting, no shadows, ultra-clean commercial photography suitable for Amazon.`,

  // Image 2: Product installed on the vehicle
  (productInfo: string, vehicleInfo: string) =>
    `Professional automotive product photography. The ${productInfo} shown installed and in use on a ${vehicleInfo || "modern vehicle"} in a realistic outdoor or garage setting. Show the product in its natural installed position. Well-lit, sharp focus, high quality commercial image.`,

  // Image 3: Product close-up detail on white background
  (productInfo: string, vehicleInfo: string) =>
    `Macro product photography. Extreme close-up of ${productInfo} highlighting material quality, finish, craftsmanship and key technical details. Clean white or very light gradient background. Show texture, connectors, labels or part numbers clearly. High-end commercial photography style.`,

  // Image 4: Product from multiple angles / packaging
  (productInfo: string, vehicleInfo: string) =>
    `Professional product photography. ${productInfo} shown from three different angles simultaneously arranged on a clean light gray gradient background: front view, side view, and back/bottom view. ${vehicleInfo ? `Product fits ${vehicleInfo}.` : ""} Commercial e-commerce catalog style.`,

  // Image 5: Infographic-style with key features highlighted
  (productInfo: string, vehicleInfo: string) =>
    `Clean infographic-style product image for e-commerce. ${productInfo} on a white background with subtle text callout lines pointing to 3-4 key features or specifications. Modern, minimal SaaS-style design. Icons and short labels next to each callout. Professional commercial product shot.`,

  // Image 6: Lifestyle/banner — product with vehicle in scenic setting
  (productInfo: string, vehicleInfo: string) =>
    `Wide-format lifestyle banner photography. ${vehicleInfo || "A modern vehicle"} parked in an attractive urban or scenic outdoor environment. The ${productInfo} is visibly featured as a key component of the vehicle. Golden hour lighting, cinematic feel, high-end automotive marketing photography style.`,
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
