import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number; // 0-5 or 0-500 (if stored as integer)
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showCount?: boolean;
  count?: number;
}

export default function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRatingChange,
  showCount = false,
  count,
}: RatingStarsProps) {
  // Normalize rating (handle both 0-5 and 0-500 formats)
  const normalizedRating = rating > 5 ? rating / 100 : rating;
  
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const handleClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }).map((_, index) => {
        const isFilled = index < Math.floor(normalizedRating);
        const isHalf = !isFilled && index < normalizedRating;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            disabled={!interactive}
            className={cn(
              "relative",
              interactive && "cursor-pointer hover:scale-110 transition-transform"
            )}
          >
            {/* Background star (empty) */}
            <Star
              className={cn(
                sizeClasses[size],
                "text-muted-foreground/50"
              )}
            />
            
            {/* Filled star */}
            {(isFilled || isHalf) && (
              <Star
                className={cn(
                  sizeClasses[size],
                  "absolute top-0 left-0 text-yellow-400 fill-yellow-400"
                )}
                style={
                  isHalf
                    ? {
                        clipPath: `inset(0 ${100 - (normalizedRating - index) * 100}% 0 0)`,
                      }
                    : undefined
                }
              />
            )}
          </button>
        );
      })}
      
      {showCount && count !== undefined && (
        <span className="text-sm text-muted-foreground ml-1">
          ({count})
        </span>
      )}
      
      {!showCount && normalizedRating > 0 && (
        <span className="text-sm text-muted-foreground ml-1">
          {normalizedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
