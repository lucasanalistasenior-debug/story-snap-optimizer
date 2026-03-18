import React, { useState, useCallback } from "react";
import { Sparkles, Loader2, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/ImageUploader";
import { ProductImageGrid } from "@/components/ProductImageGrid";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function callEdgeFunction(name: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed with status ${response.status}`);
  }

  return data;
}

const Index = () => {
  const { toast } = useToast();

  // Inputs
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [productInfo, setProductInfo] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");

  // Outputs
  const [seoTitle, setSeoTitle] = useState("");
  const [generatedImages, setGeneratedImages] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleImagesChange = useCallback((newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setProductImages((prev) => {
      const combined = [...prev, ...newFiles];
      // Generate previews for newly added files
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
      // Step 1: Generate SEO title
      const titleData = await callEdgeFunction("generate-seo-title", {
        productInfo: productInfo.trim(),
        vehicleInfo: vehicleInfo.trim(),
      });
      setSeoTitle(titleData.title ?? "");

      // Step 2: Generate 6 images in parallel
      const imagePromises = Array.from({ length: 6 }, (_, i) =>
        callEdgeFunction("generate-product-images", {
          productInfo: productInfo.trim(),
          vehicleInfo: vehicleInfo.trim(),
          imageIndex: i,
        })
          .then((data) => data.imageUrl ?? null)
          .catch((err) => {
            console.error(`Image ${i + 1} failed:`, err);
            return null;
          })
      );

      // Stream images into state as they resolve
      for (let i = 0; i < imagePromises.length; i++) {
        imagePromises[i].then((url) => {
          setGeneratedImages((prev) => {
            const next = [...prev];
            next[i] = url;
            return next;
          });
        });
      }

      await Promise.allSettled(imagePromises);
      setHasGenerated(true);

      toast({
        title: "Generation complete!",
        description: "Your SEO title and product images are ready.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: "Generation failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setProductImage(null);
    setImagePreview(null);
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
              <p className="text-xs text-muted-foreground mt-0.5">SEO + Image Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasGenerated && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-accent-emerald">
                <CheckCircle className="w-3.5 h-3.5" />
                Generated
              </span>
            )}
            {(hasGenerated || productInfo) && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-secondary"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workbench */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* ── LEFT PANEL: Inputs ── */}
          <div className="space-y-4">
            <div className="panel p-5 space-y-5">
              <div>
                <h2 className="text-sm font-bold text-foreground mb-3">Product Image</h2>
                <ImageUploader
                  onImageSelect={handleImageSelect}
                  imagePreview={imagePreview}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Vehicle Compatibility
                </Label>
                <Input
                  placeholder="e.g. 2020-2024 Ford F-150, Toyota Tacoma"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Optional — used for the hero image and title
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Product Details <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Describe your product: name, brand, specifications, materials, key features, dimensions, use case..."
                  value={productInfo}
                  onChange={(e) => setProductInfo(e.target.value)}
                  className="text-sm resize-none"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  {productInfo.length} / 1000 characters. More detail = better results.
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
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate SEO Title + Images
                </>
              )}
            </Button>

            {!canGenerate && (
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Add product details to enable generation
              </p>
            )}
          </div>

          {/* ── RIGHT PANEL: Outputs ── */}
          <div className="space-y-4">
            {/* SEO Title */}
            <div className="panel p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-foreground">SEO Title</h2>
                {seoTitle && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
                    <CheckCircle className="w-3 h-3" />
                    SEO Optimized
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
                    {seoTitle.length} characters · Editable
                  </p>
                </div>
              ) : (
                <div className="h-10 rounded-md bg-secondary/50 border border-dashed border-border flex items-center px-3">
                  <span className="text-sm text-muted-foreground">
                    Your optimized title will appear here…
                  </span>
                </div>
              )}
            </div>

            {/* Image Grid */}
            <div className="panel p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground">Generated Images</h2>
                {isGenerating && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating images…
                  </span>
                )}
              </div>
              <ProductImageGrid
                images={generatedImages}
                isLoading={isGenerating}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
