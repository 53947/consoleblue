import { useState, useCallback } from "react";
import { UI_ASSETS } from "@/lib/assets";
import { cn } from "@/lib/utils";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackInitials?: string;
  fallbackColor?: string;
}

export function SafeImage({
  src,
  alt,
  className,
  fallbackSrc,
  fallbackInitials,
  fallbackColor = "#E5E7EB",
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback(() => {
    if (import.meta.env.DEV) {
      console.warn(`[SafeImage] Failed to load: ${src}`);
    }
    setHasError(true);
    setIsLoading(false);
  }, [src]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Show initials fallback (colored circle with letters)
  if (hasError && fallbackInitials) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md font-semibold text-white select-none",
          className,
        )}
        style={{ backgroundColor: fallbackColor }}
        role="img"
        aria-label={alt}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {fallbackInitials.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  // Show fallback image
  if (hasError) {
    return (
      <img
        src={fallbackSrc || UI_ASSETS.placeholder}
        alt={alt}
        className={cn("opacity-50", className)}
        {...props}
      />
    );
  }

  return (
    <>
      {isLoading && (
        <div
          className={cn(
            "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
            className,
          )}
          style={{ width: props.width, height: props.height }}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(isLoading ? "hidden" : "", className)}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        {...props}
      />
    </>
  );
}
