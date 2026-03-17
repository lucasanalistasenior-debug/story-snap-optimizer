import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  onImageSelect: (file: File | null) => void;
  imagePreview: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, imagePreview }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      onImageSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      className={`relative rounded-lg border-2 transition-colors duration-150 cursor-pointer overflow-hidden
        ${isDragging ? "border-primary bg-primary/5" : "border-dashed border-border bg-secondary/30 hover:border-primary/50 hover:bg-primary/3"}
      `}
      style={{ minHeight: "160px" }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {imagePreview ? (
        <div className="relative w-full h-full">
          <img
            src={imagePreview}
            alt="Product preview"
            className="w-full h-48 object-contain p-2"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 rounded-full bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground font-medium border-t border-border">
            Click to change image
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 gap-3 p-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              Upload Product Image
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WebP up to 10MB
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold">
            <Upload className="w-3.5 h-3.5" />
            Browse Files
          </div>
        </div>
      )}
    </div>
  );
};
