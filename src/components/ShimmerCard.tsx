import React from "react";

interface ShimmerCardProps {
  isHero?: boolean;
}

export const ShimmerCard: React.FC<ShimmerCardProps> = ({ isHero = false }) => {
  return (
    <div
      className={`rounded-lg overflow-hidden border border-border ${
        isHero ? "col-span-2 row-span-2" : ""
      }`}
    >
      <div className="shimmer w-full h-full min-h-[160px] rounded-lg" />
    </div>
  );
};
