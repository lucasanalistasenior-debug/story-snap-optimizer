import React from "react";
import { Download, Expand } from "lucide-react";

interface ImageLabel {
  label: string;
  isHero?: boolean;
  colSpan?: number;
  rowSpan?: number;
}

// 6 images: Hero is large (col-span-2, row-span-2), then 2 stacked on right,
// then 3 across the bottom row
const IMAGE_LABELS: ImageLabel[] = [
  { label: "Main Hero", isHero: true, colSpan: 2, rowSpan: 2 },
  { label: "Installed" },
  { label: "Detail Shot" },
  { label: "Multi-Angle" },
  { label: "Features" },
  { label: "Lifestyle" },
];

interface ProductImageGridProps {
  images: (string | null)[];
  isLoading: boolean;
}

const ImageSkeleton: React.FC<{ label: string; isHero?: boolean; colSpan?: number; rowSpan?: number }> = ({
  label,
  isHero,
  colSpan,
  rowSpan,
}) => (
  <div
    className="relative rounded-lg overflow-hidden border border-border bg-secondary"
    style={{
      gridColumn: colSpan ? `span ${colSpan}` : undefined,
      gridRow: rowSpan ? `span ${rowSpan}` : undefined,
      minHeight: isHero ? "300px" : "140px",
    }}
  >
    <div className="shimmer w-full h-full absolute inset-0" />
    <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
      <div className="w-8 h-8 rounded-full bg-muted/50" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  </div>
);

const ImageCard: React.FC<{
  src: string;
  label: string;
  isHero?: boolean;
  colSpan?: number;
  rowSpan?: number;
  index: number;
}> = ({ src, label, isHero, colSpan, rowSpan, index }) => {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = src;
    link.download = `product-image-${index + 1}.png`;
    link.click();
  };

  return (
    <div
      className="relative group rounded-lg overflow-hidden border border-border bg-secondary"
      style={{
        gridColumn: colSpan ? `span ${colSpan}` : undefined,
        gridRow: rowSpan ? `span ${rowSpan}` : undefined,
        minHeight: isHero ? "300px" : "140px",
      }}
    >
      <img
        src={src}
        alt={`${label} product image`}
        className="w-full h-full object-cover"
      />
      {/* Hover overlay */}
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
  const isEmpty = !isLoading && images.every((img) => img === null);

  return (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "auto",
      }}
    >
      {IMAGE_LABELS.map(({ label, isHero, colSpan, rowSpan }, i) => {
        const imgSrc = images[i];

        if (isEmpty) {
          return (
            <div
              key={i}
              className="rounded-lg border-2 border-dashed border-border bg-secondary/50 flex flex-col items-center justify-center"
              style={{
                gridColumn: colSpan ? `span ${colSpan}` : undefined,
                gridRow: rowSpan ? `span ${rowSpan}` : undefined,
                minHeight: isHero ? "300px" : "140px",
              }}
            >
              <div className="w-10 h-10 rounded-full bg-muted mb-2 flex items-center justify-center">
                <span className="text-muted-foreground text-lg font-bold">{i + 1}</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
          );
        }

        if (isLoading && !imgSrc) {
          return (
            <ImageSkeleton
              key={i}
              label={label}
              isHero={isHero}
              colSpan={colSpan}
              rowSpan={rowSpan}
            />
          );
        }

        if (imgSrc) {
          return (
            <ImageCard
              key={i}
              src={imgSrc}
              label={label}
              isHero={isHero}
              colSpan={colSpan}
              rowSpan={rowSpan}
              index={i}
            />
          );
        }

        return (
          <ImageSkeleton
            key={i}
            label={label}
            isHero={isHero}
            colSpan={colSpan}
            rowSpan={rowSpan}
          />
        );
      })}
    </div>
  );
};
