import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";

interface ImageUploaderProps {
  onImagesChange: (files: File[]) => void;
  imagePreviews: string[];
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, imagePreviews }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    // We'll pass all files up to the parent to manage
    onImagesChange(imageFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    // Signal removal by index via a sentinel — parent handles state
    onImagesChange([]);
    // We need to notify parent about the specific removal — use a custom event trick:
    // Instead, we'll use a different approach below via onRemoveAt prop
  };

  return (
    <div className="space-y-3">
      {/* Thumbnail strip */}
      {imagePreviews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imagePreviews.map((src, i) => (
            <div key={i} className="relative group w-20 h-20 rounded-md overflow-hidden border border-border bg-secondary flex-shrink-0">
              <img src={src} alt={`Product image ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const synth = new CustomEvent("remove-image", { detail: i, bubbles: true });
                  e.currentTarget.dispatchEvent(synth);
                }}
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

          {/* Add more button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-md border-2 border-dashed border-border bg-secondary/30 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium">Add</span>
          </button>
        </div>
      )}

      {/* Drop zone — shown when no images yet */}
      {imagePreviews.length === 0 && (
        <div
          className={`relative rounded-lg border-2 transition-colors duration-150 cursor-pointer overflow-hidden
            ${isDragging ? "border-primary bg-primary/5" : "border-dashed border-border bg-secondary/30 hover:border-primary/50 hover:bg-primary/5"}
          `}
          style={{ minHeight: "160px" }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center h-40 gap-3 p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Upload Product Images</p>
              <p className="text-xs text-muted-foreground mt-0.5">Drag & drop or click to browse</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WebP · Multiple allowed</p>
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
        onChange={handleChange}
      />
    </div>
  );
};
