import React from "react";
import { Download, Expand } from "lucide-react";

interface ImageLabel {
  label: string;
  isHero?: boolean;
}

const IMAGE_LABELS: ImageLabel[] = [
  { label: "Main Hero", isHero: true },
  { label: "Lifestyle" },
  { label: "Detail Shot" },
  { label: "Multi-Angle" },
];

interface ProductImageGridProps {
  images: (string | null)[];
  isLoading: boolean;
}

const ImageSkeleton: React.FC<{ label: string; isHero?: boolean }> = ({ label, isHero }) => (
  <div
    className={`relative rounded-lg overflow-hidden border border-border bg-secondary ${
      isHero ? "row-span-2" : ""
    }`}
  >
    <div className="shimmer w-full h-full absolute inset-0" />
    <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[160px] gap-2">
      <div className="w-8 h-8 rounded-full shimmer" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  </div>
);

const ImageCard: React.FC<{
  src: string;
  label: string;
  isHero?: boolean;
  index: number;
}> = ({ src, label, isHero, index }) => {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = src;
    link.download = `product-image-${index + 1}.png`;
    link.click();
  };

  return (
    <div
      className={`relative group rounded-lg overflow-hidden border border-border bg-secondary ${
        isHero ? "row-span-2" : ""
      }`}
    >
      <img
        src={src}
        alt={`${label} product image`}
        className="w-full h-full object-cover"
        style={{ minHeight: isHero ? "320px" : "160px" }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-all duration-150 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <button
          onClick={handleDownload}
          className="p-2 rounded-md bg-card text-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-100"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-md bg-card text-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-100"
          title="View full size"
        >
          <Expand className="w-4 h-4" />
        </a>
      </div>
      {/* Label badge */}
      {isHero && (
        <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-emerald text-accent-emerald-foreground">
          Hero
        </span>
      )}
      <span className="absolute bottom-2 left-2 text-xs font-medium px-2 py-0.5 rounded bg-card/80 text-foreground">
        {label}
      </span>
    </div>
  );
};

export const ProductImageGrid: React.FC<ProductImageGridProps> = ({ images, isLoading }) => {
  if (!isLoading && images.every((img) => img === null)) {
    return (
      <div className="grid grid-cols-2 gap-3 h-full">
        {IMAGE_LABELS.map(({ label, isHero }, i) => (
          <div
            key={i}
            className={`rounded-lg border-2 border-dashed border-border bg-secondary/50 flex flex-col items-center justify-center ${
              isHero ? "row-span-2" : ""
            }`}
            style={{ minHeight: isHero ? "320px" : "160px" }}
          >
            <div className="w-10 h-10 rounded-full bg-muted mb-2 flex items-center justify-center">
              <span className="text-muted-foreground text-lg font-bold">{i + 1}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      {IMAGE_LABELS.map(({ label, isHero }, i) => {
        const imgSrc = images[i];

        if (isLoading && !imgSrc) {
          return <ImageSkeleton key={i} label={label} isHero={isHero} />;
        }

        if (imgSrc) {
          return (
            <ImageCard key={i} src={imgSrc} label={label} isHero={isHero} index={i} />
          );
        }

        return <ImageSkeleton key={i} label={label} isHero={isHero} />;
      })}
    </div>
  );
};
