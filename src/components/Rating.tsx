import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  max?: number;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  onChange,
  readOnly = false,
  max = 5,
  className
}) => {
  const handleClick = (index: number) => {
    if (readOnly || !onChange) return;
    onChange(index + 1);
  };

  return (
    <div className={cn("flex items-center", className)}>
      {[...Array(max)].map((_, index) => (
        <Star
          key={index}
          className={cn(
            "h-5 w-5 cursor-pointer transition-all",
            index < value
              ? "fill-yellow-400 text-yellow-400"
              : "fill-transparent text-gray-300",
            !readOnly && "hover:scale-110"
          )}
          onClick={() => handleClick(index)}
        />
      ))}
    </div>
  );
};
