import React, { useRef } from "react";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";

interface ImageUploaderProps {
  onAddImages: (files: File[]) => void;
  onRemoveAt: (index: number) => void;
  imagePreviews: string[];
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onAddImages,
  onRemoveAt,
  imagePreviews,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length > 0) onAddImages(images);
  };

  return (
    <div className="space-y-3">
      {imagePreviews.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {imagePreviews.map((src, i) => (
            <div
              key={i}
              className="relative group w-20 h-20 rounded-md overflow-hidden border border-border bg-secondary flex-shrink-0"
            >
              <img
                src={src}
                alt={`Product image ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemoveAt(i)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-card/90 border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-semibold bg-primary/80 text-primary-foreground py-0.5">
                  Main
                </span>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-md border-2 border-dashed border-border bg-secondary/30 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium">Add</span>
          </button>
        </div>
      ) : (
        <div
          className={`relative rounded-lg border-2 transition-colors duration-150 cursor-pointer overflow-hidden
            ${isDragging ? "border-primary bg-primary/5" : "border-dashed border-border bg-secondary/30 hover:border-primary/50 hover:bg-primary/5"}
          `}
          style={{ minHeight: "160px" }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center h-40 gap-3 p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Enviar Imagens do Produto</p>
            <p className="text-xs text-muted-foreground mt-0.5">Arraste & solte ou clique para buscar</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WebP · Múltiplas permitidas</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold">
              <Upload className="w-3.5 h-3.5" />
              Browse Files
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
};
