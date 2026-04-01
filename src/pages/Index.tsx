import React, { useState, useCallback } from "react";
import { Sparkles, Loader2, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/ImageUploader";
import { ProductImageGrid } from "@/components/ProductImageGrid";
import { useToast } from "@/hooks/use-toast";

// ── SEO Title via Pollinations.ai (free, no key needed) ──────────────────────
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

// ── Canvas helpers ────────────────────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

// 1. Principal Hero — white background, clean studio look
async function generateHero(imgSrc: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1000, 1000);

  const grad = ctx.createRadialGradient(500, 500, 100, 500, 500, 700);
  grad.addColorStop(0, "rgba(235,244,255,0.7)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1000, 1000);

  const img = await loadImage(imgSrc);
  const size = 720;
  const x = (1000 - size) / 2;
  const y = (1000 - size) / 2;
  ctx.shadowColor = "rgba(0,0,0,0.10)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;
  ctx.drawImage(img, x, y, size, size);
  ctx.shadowColor = "transparent";

  return canvasToDataUrl(canvas);
}

// 2. Instalado — dark blue background, glowing product
async function generateInstalado(imgSrc: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 1000, 1000);
  grad.addColorStop(0, "#0d1b2a");
  grad.addColorStop(1, "#1b3a5c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1000, 1000);

  for (let i = 3; i >= 1; i--) {
    ctx.beginPath();
    ctx.arc(500, 500, i * 140, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(99,179,237,${0.04 * i})`;
    ctx.lineWidth = 40;
    ctx.stroke();
  }

  const img = await loadImage(imgSrc);
  ctx.shadowColor = "rgba(99,179,237,0.35)";
  ctx.shadowBlur = 70;
  ctx.drawImage(img, 150, 150, 700, 700);
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "#3182ce";
  ctx.beginPath();
  (ctx as any).roundRect(28, 28, 180, 46, 23);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 19px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("INSTALADO", 118, 57);

  ctx.fillStyle = "rgba(255,255,255,0.80)";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Vista de Instalação", 500, 940);

  return canvasToDataUrl(canvas);
}

// 3. Detalhe — zoomed crop with corner accents
async function generateDetalhe(imgSrc: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f7fafc";
  ctx.fillRect(0, 0, 1000, 1000);

  const img = await loadImage(imgSrc);
  const nat = Math.min(img.naturalWidth, img.naturalHeight);
  const cropSize = nat * 0.55;
  const cropX = (img.naturalWidth - cropSize) / 2;
  const cropY = (img.naturalHeight - cropSize) / 2;

  ctx.shadowColor = "rgba(0,0,0,0.08)";
  ctx.shadowBlur = 30;
  ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 60, 60, 880, 880);
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "#3182ce";
  ctx.lineWidth = 4;
  const m = 28, len = 64;
  ctx.beginPath(); ctx.moveTo(m, m + len); ctx.lineTo(m, m); ctx.lineTo(m + len, m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1000 - m - len, m); ctx.lineTo(1000 - m, m); ctx.lineTo(1000 - m, m + len); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(m, 1000 - m - len); ctx.lineTo(m, 1000 - m); ctx.lineTo(m + len, 1000 - m); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1000 - m - len, 1000 - m); ctx.lineTo(1000 - m, 1000 - m); ctx.lineTo(1000 - m, 1000 - m - len); ctx.stroke();

  ctx.fillStyle = "#2d3748";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DETALHE DO PRODUTO", 500, 976);

  return canvasToDataUrl(canvas);
}

// 4. Multi-Ângulo — 2x2 grid
async function generateMultiAngulo(imgSrc: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#edf2f7";
  ctx.fillRect(0, 0, 1000, 1000);

  const img = await loadImage(imgSrc);
  const panels = [
    { x: 8, y: 8, bg: "#ffffff", label: "Frente" },
    { x: 508, y: 8, bg: "#ebf8ff", label: "Lateral" },
    { x: 8, y: 508, bg: "#f0fff4", label: "Superior" },
    { x: 508, y: 508, bg: "#fffaf0", label: "Detalhe" },
  ];

  for (const p of panels) {
    ctx.fillStyle = p.bg;
    ctx.beginPath();
    (ctx as any).roundRect(p.x, p.y, 484, 484, 14);
    ctx.fill();
    ctx.drawImage(img, p.x + 42, p.y + 36, 400, 396);
    ctx.fillStyle = "rgba(45,55,72,0.07)";
    ctx.fillRect(p.x, p.y + 444, 484, 40);
    ctx.fillStyle = "#4a5568";
    ctx.font = "bold 17px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.label, p.x + 242, p.y + 470);
  }

  ctx.fillStyle = "#edf2f7";
  ctx.fillRect(490, 0, 20, 1000);
  ctx.fillRect(0, 490, 1000, 20);

  return canvasToDataUrl(canvas);
}

// 5. Funcionalidades — product with callout lines
async function generateFuncionalidades(imgSrc: string, productInfo: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1000, 1000);

  ctx.fillStyle = "#2d3748";
  ctx.fillRect(0, 0, 1000, 72);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CARACTERÍSTICAS DO PRODUTO", 500, 47);

  const img = await loadImage(imgSrc);
  ctx.drawImage(img, 210, 110, 580, 580);

  const features = [
    { y: 200, label: "Alta Qualidade", side: "left" },
    { y: 370, label: "Durável", side: "left" },
    { y: 540, label: "Fácil Instalação", side: "left" },
    { y: 280, label: "Produto Novo", side: "right" },
    { y: 460, label: "Garantia", side: "right" },
  ];

  for (const f of features) {
    const isLeft = f.side === "left";
    const dotX = isLeft ? 210 : 790;
    const endX = isLeft ? 80 : 920;

    ctx.strokeStyle = "#3182ce";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(dotX, f.y);
    ctx.lineTo(endX, f.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#3182ce";
    ctx.beginPath();
    ctx.arc(dotX, f.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2d3748";
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.textAlign = isLeft ? "right" : "left";
    ctx.fillText(f.label, endX + (isLeft ? -10 : 10), f.y + 6);
  }

  ctx.fillStyle = "#ebf8ff";
  ctx.fillRect(0, 918, 1000, 82);
  ctx.fillStyle = "#2b6cb0";
  ctx.font = "15px system-ui, sans-serif";
  ctx.textAlign = "center";
  const info = productInfo.length > 90 ? productInfo.substring(0, 90) + "…" : productInfo;
  ctx.fillText(info, 500, 964);

  return canvasToDataUrl(canvas);
}

// 6. Lifestyle — dark cinematic gradient
async function generateLifestyle(imgSrc: string, productInfo: string, vehicleInfo: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 1000, 1000);
  grad.addColorStop(0, "#0f2027");
  grad.addColorStop(0.5, "#203a43");
  grad.addColorStop(1, "#2c5364");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1000, 1000);

  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(500, 500, 110 + i * 65, 0, Math.PI * 2);
    ctx.stroke();
  }

  const glow = ctx.createRadialGradient(500, 460, 40, 500, 460, 460);
  glow.addColorStop(0, "rgba(99,179,237,0.18)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1000, 1000);

  const img = await loadImage(imgSrc);
  ctx.shadowColor = "rgba(99,179,237,0.45)";
  ctx.shadowBlur = 90;
  ctx.drawImage(img, 180, 140, 640, 640);
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "bold 34px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PRODUTO PREMIUM", 500, 60);

  ctx.fillStyle = "rgba(99,179,237,0.75)";
  ctx.fillRect(340, 74, 320, 2);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "bold 24px system-ui, sans-serif";
  ctx.textAlign = "center";
  const label = vehicleInfo ? `Compatível com ${vehicleInfo}` : productInfo.substring(0, 55);
  ctx.fillText(label, 500, 888);

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillText("Qualidade garantida · Produto original", 500, 926);

  return canvasToDataUrl(canvas);
}

// ── Orchestrator ──────────────────────────────────────────────────────────────
async function generateAllImages(
  imageSrc: string,
  productInfo: string,
  vehicleInfo: string,
  onImageReady: (index: number, url: string) => void
): Promise<void> {
  const generators = [
    () => generateHero(imageSrc),
    () => generateInstalado(imageSrc),
    () => generateDetalhe(imageSrc),
    () => generateMultiAngulo(imageSrc),
    () => generateFuncionalidades(imageSrc, productInfo),
    () => generateLifestyle(imageSrc, productInfo, vehicleInfo),
  ];

  await Promise.all(
    generators.map(async (gen, i) => {
      try {
        const url = await gen();
        onImageReady(i, url);
      } catch (err) {
        console.error(`Image ${i + 1} failed:`, err);
      }
    })
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
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

  const canGenerate = productInfo.trim().length > 0 && imagePreviews.length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setHasGenerated(false);
    setSeoTitle("");
    setGeneratedImages([null, null, null, null, null, null]);

    try {
      const titlePromise = generateSeoTitle(productInfo.trim(), vehicleInfo.trim())
        .then(setSeoTitle)
        .catch(() => setSeoTitle(productInfo.trim().substring(0, 100)));

      const imagesPromise = generateAllImages(
        imagePreviews[0],
        productInfo.trim(),
        vehicleInfo.trim(),
        (index, url) => {
          setGeneratedImages((prev) => {
            const next = [...prev];
            next[index] = url;
            return next;
          });
        }
      );

      await Promise.all([titlePromise, imagesPromise]);
      setHasGenerated(true);

      toast({
        title: "Geração completa!",
        description: "6 variações de imagem prontas para download.",
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

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          <div className="space-y-4">
            <div className="panel p-5 space-y-5">
              <div>
                <h2 className="text-sm font-bold text-foreground mb-1">Imagens do Produto</h2>
                <p className="text-xs text-muted-foreground mb-3">
                  Envie a foto — geraremos 6 variações profissionais automaticamente
                </p>
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
                  Opcional — usado no título e nas imagens
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
                  Gerando variações…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Título SEO + 6 Imagens
                </>
              )}
            </Button>

            {!imagePreviews.length && (
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Envie pelo menos 1 foto do produto para continuar
              </p>
            )}
            {imagePreviews.length > 0 && !productInfo.trim() && (
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Preencha os detalhes do produto para continuar
              </p>
            )}
          </div>

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
                <div>
                  <h2 className="text-sm font-bold text-foreground">Imagens Geradas</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    6 variações para marketplace · Clique para baixar
                  </p>
                </div>
                {isGenerating && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Gerando…
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
