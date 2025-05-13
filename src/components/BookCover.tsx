
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  src: string;
  alt: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const BookCover = ({ src, alt, className, size = "md" }: BookCoverProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: "w-24",
    md: "w-36",
    lg: "w-48",
  };

  return (
    <div className={cn("book-cover", sizeClasses[size], className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-primary animate-spin"></div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center p-2">
            <span className="text-xs text-muted-foreground">Cover not available</span>
          </div>
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        className={cn("transition-opacity duration-300", isLoading || hasError ? "opacity-0" : "opacity-100")}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};

export default BookCover;
