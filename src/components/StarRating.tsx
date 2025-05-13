
import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  interactive?: boolean;
}

const StarRating = ({
  rating,
  maxRating = 5,
  onChange,
  readOnly = false,
  size = "md",
  className,
  interactive = true,
}: StarRatingProps) => {
  const [currentRating, setCurrentRating] = useState(rating);
  const [hoverRating, setHoverRating] = useState(0);
  
  useEffect(() => {
    setCurrentRating(rating);
  }, [rating]);
  
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };
  
  const handleClick = (value: number) => {
    if (readOnly || !interactive) return;
    
    let newRating = value;
    // Implement half-star functionality
    if (currentRating === value) {
      newRating = value - 0.5;
    }
    
    setCurrentRating(newRating);
    onChange?.(newRating);
  };
  
  const handleMouseEnter = (value: number) => {
    if (readOnly || !interactive) return;
    setHoverRating(value);
  };
  
  const handleMouseLeave = () => {
    if (readOnly || !interactive) return;
    setHoverRating(0);
  };
  
  const renderStars = () => {
    const stars = [];
    const activeRating = hoverRating || currentRating;
    
    for (let i = 1; i <= maxRating; i++) {
      stars.push(
        <span
          key={i}
          className={cn(
            "cursor-pointer transition-all duration-200",
            readOnly || !interactive ? "cursor-default" : "hover:scale-110"
          )}
          onClick={() => handleClick(i)}
          onMouseEnter={() => handleMouseEnter(i)}
          onMouseLeave={handleMouseLeave}
        >
          <Star
            className={cn(
              "transition-colors duration-200",
              sizeClasses[size],
              i <= activeRating
                ? "text-secondary fill-secondary animate-star-burst"
                : i - 0.5 === activeRating
                ? "text-secondary fill-secondary/50"
                : "text-muted stroke-muted-foreground/70"
            )}
          />
        </span>
      );
    }
    return stars;
  };

  return (
    <div className={cn("flex items-center space-x-0.5", className)}>
      {renderStars()}
    </div>
  );
};

export default StarRating;
