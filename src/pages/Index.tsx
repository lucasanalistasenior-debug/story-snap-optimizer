import React, { useState, useCallback } from "react";
import { Sparkles, Loader2, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/ImageUploader";
import { ProductImageGrid } from "@/components/ProductImageGrid";
import { useToast } from "@/hooks/use-toast";

// ── SEO Title via Pollinations.ai text API GET (free, no key, no CORS) ───────
async function generateSeoTitle(productInfo: string, vehicleInfo: string): Promise<string> {
  const prompt = `Você é especialista em SEO para e-commerce brasileiro. Crie UM único título de produto para Mercado Livre, Amazon Brasil e Shopee. Regras: máximo 120 caracteres, apenas português do Brasil, inclua palavras-chave naturais${vehicleInfo ? `, mencione compatibilidade com ${vehicleInfo}` : ""}, comece com o tipo do produto, retorne APENAS o título sem explicações. Produto: ${productInfo}`;

  const encoded = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 9999);
  const url = `https://text.pollinations.ai/${encoded}?model=openai&seed=${seed}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`SEO title generation failed: ${response.status}`);
  const title = await response.text();
  return title.trim().replace(/^["']|["']$/g, "");
}

// ── Image prompts ────────────────────────────────────────────────────────────
const IMAGE_PROMPTS = [
  (productInfo: string, vehicleInfo: string) =>
    `Professional automotive e-commerce hero image. Dramatic composite product shot: a ${vehicleInfo || "modern car"} is prominently displayed in the upper half of the image, positioned above and slightly angled, as if floating or parked above the product. Directly below the car, centered at the bottom of the image, sits the ${productInfo} product on a pure white background. Clean white studio background throughout. The vehicle dominates the top portion, the product sits below it. Crystal clear studio lighting, no shadows, ultra-clean commercial photography suitable for Amazon.`,

  (productInfo: string, vehicleInfo: string) =>
    `Professional automotive product photography. The ${productInfo} shown installed and in use on a ${vehicleInfo || "modern vehicle"} in a realistic outdoor or garage setting. Show the product in its natural installed position. Well-lit, sharp focus, high quality commercial image.`,

  (productInfo: string, vehicleInfo: string) =>
    `Macro product photography. Extreme close-up of ${productInfo} highlighting material quality, finish, craftsmanship and key technical details. Clean white or very light gradient background. Show texture, connectors, labels or part numbers clearly. High-end commercial photography style.`,

  (productInfo: string, vehicleInfo: string) =>
    `Professional product photography. ${productInfo} shown from three different angles simultaneously arranged on a clean light gray gradient background: front view, side view, and back/bottom view. ${vehicleInfo ? `Product fits ${vehicleInfo}.` : ""} Commercial e-commerce catalog style.`,

  (productInfo: string, vehicleInfo: string) =>
    `Clean infographic-style product image for e-commerce. ${productInfo} on a white background with subtle text callout lines pointing to 3-4 key features or specifications. Modern, minimal design. Icons and short labels next to each callout. Professional commercial product shot.`,

  (productInfo: string, vehicleInfo: string) =>
    `Wide-format lifestyle banner photography. ${vehicleInfo || "A modern vehicle"} parked in an attractive urban or scenic outdoor environment. The ${productInfo} is visibly featured as a key component of the vehicle. Golden hour lighting, cinematic feel, high-end automotive marketing photography style.`,
];

// ── Image generation via Pollinations.ai with retry logic ────────────────────
async function generateImage(productInfo: string, vehicleInfo: string, imageIndex: number): Promise<string> {
  const promptFn = IMAGE_PROMPTS[imageIndex % IMAGE_PROMPTS.length];
  const prompt = promptFn(productInfo, vehicleInfo ?? "");
  const encoded = encodeURIComponent(prompt);
  const seed = imageIndex * 1000 + Math.floor(Math.random() * 999);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Stagger requests to avoid overwhelming the API
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const blob = await res.blob();
      if (blob.size < 1000) throw new Error("Empty image received");
      return URL.createObjectURL(blob);
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw new Error(`Image ${imageIndex + 1} failed after ${MAX_RETRIES} attempts`);
    }
  }
  throw new Error(`Image ${imageIndex + 1} generation failed`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Component ────────────────────────────────────────────────────────────────
const Index = () => {
  const { toast } = useToast();

  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [productInfo, setProductInfo] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");

  const [seoTitle, setSeoTitle] = useState("");
  const [generatedImages, setGeneratedImages] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleImagesChange = useCallback((newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setProductImages((prev) => {
      const combined = [...prev, ...newFiles];
      newFiles.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((p) => {
            const next = [...p];
            next[prev.length + idx] = reader.result as string;
            return next;
          });
        };
        reader.readAsDataURL(file);
      });
      return combined;
    });
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const canGenerate = productInfo.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setHasGenerated(false);
    setSeoTitle("");
    setGeneratedImages([null, null, null, null, null, null]);

    try {
      // Step 1: SEO title via Pollinations.ai text
      const title = await generateSeoTitle(productInfo.trim(), vehicleInfo.trim());
      setSeoTitle(title);

      // Step 2: 6 images staggered to avoid API throttling
      const imagePromises = Array.from({ length: 6 }, (_, i) =>
        sleep(i * 500).then(() =>
          generateImage(productInfo.trim(), vehicleInfo.trim(), i)
            .then((url) => {
              setGeneratedImages((prev) => {
                const next = [...prev];
                next[i] = url;
                return next;
              });
              return url;
            })
            .catch((err) => {
              console.error(`Image ${i + 1} failed:`, err);
              return null;
            })
        )
      );

      await Promise.allSettled(imagePromises);
      setHasGenerated(true);

      toast({
        title: "Geração completa!",
        description: "Seu título SEO e imagens do produto estão prontos.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: "Geração falhou",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setProductImages([]);
    setImagePreviews([]);
    setProductInfo("");
    setVehicleInfo("");
    setSeoTitle("");
    setGeneratedImages([null, null, null, null, null, null]);
    setHasGenerated(false);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-none">ProductAI</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Gerador de SEO + Imagens</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasGenerated && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-accent-emerald">
                <CheckCircle className="w-3.5 h-3.5" />
                Gerado
              </span>
            )}
            {(hasGenerated || productInfo) && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-secondary"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workbench */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* LEFT PANEL */}
          <div className="space-y-4">
            <div className="panel p-5 space-y-5">
              <div>
                <h2 className="text-sm font-bold text-foreground mb-3">Imagens do Produto</h2>
                <ImageUploader
                  onAddImages={handleImagesChange}
                  onRemoveAt={handleRemoveImage}
                  imagePreviews={imagePreviews}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Compatibilidade com Veículo
                </Label>
                <Input
                  placeholder="Ex: Yamaha Factor 150 2024, Honda CG 160"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Opcional — usado na imagem principal e no título
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Detalhes do Produto <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Descreva seu produto: nome, marca, especificações, materiais, diferenciais, dimensões, aplicação..."
                  value={productInfo}
                  onChange={(e) => setProductInfo(e.target.value)}
                  className="text-sm resize-none"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  {productInfo.length} / 1000 caracteres. Mais detalhes = melhores resultados.
                </p>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full h-11 text-sm font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Título SEO + Imagens
                </>
              )}
            </Button>

            {!canGenerate && (
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Preencha os detalhes do produto para continuar
              </p>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-4">
            <div className="panel p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-foreground">Título SEO</h2>
                {seoTitle && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
                    <CheckCircle className="w-3 h-3" />
                    Otimizado para SEO
                  </span>
                )}
              </div>

              {isGenerating && !seoTitle ? (
                <div className="h-10 rounded-md shimmer" />
              ) : seoTitle ? (
                <div className="space-y-1.5">
                  <Input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="text-sm font-medium h-auto py-2.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    {seoTitle.length} caracteres · Editável
                  </p>
                </div>
              ) : (
                <div className="h-10 rounded-md bg-secondary/50 border border-dashed border-border flex items-center px-3">
                  <span className="text-sm text-muted-foreground">
                    Seu título otimizado aparecerá aqui…
                  </span>
                </div>
              )}
            </div>

            <div className="panel p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground">Imagens Geradas</h2>
                {isGenerating && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Gerando imagens…
                  </span>
                )}
              </div>
              <ProductImageGrid images={generatedImages} isLoading={isGenerating} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
