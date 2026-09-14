import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../shared/cn";
import "./MediaCard.css";

export interface MediaCardProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "title"
> {
  orientation?: "portrait" | "landscape";
  image?: string;
  imageAlt?: string;
  hideImage?: boolean;
  fallback: ReactNode;
  overlays?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  progress?: {
    label: string;
    value: number;
    max: number;
    caption?: ReactNode;
  };
  mediaClassName?: string;
  artClassName?: string;
  copyClassName?: string;
}

export function MediaCard({
  orientation = "portrait",
  image,
  imageAlt = "",
  hideImage = false,
  fallback,
  overlays,
  title,
  children,
  progress,
  className,
  mediaClassName,
  artClassName,
  copyClassName,
  ...props
}: MediaCardProps) {
  const [failedImage, setFailedImage] = useState<string>();

  useEffect(() => {
    if (failedImage !== image) setFailedImage(undefined);
  }, [failedImage, image]);

  const showImage = !!image && failedImage !== image && !hideImage;

  return (
    <button
      className={cn("media-card", className)}
      data-orientation={orientation}
      {...props}
    >
      <span className={cn("media-card__media", mediaClassName)}>
        <span className={cn("media-card__art", artClassName)}>
          {showImage ? (
            <img
              src={image}
              alt={imageAlt}
              loading="lazy"
              onError={() => setFailedImage(image)}
            />
          ) : (
            <span className="media-card__fallback">{fallback}</span>
          )}
        </span>
        {overlays}
      </span>
      <span className={cn("media-card__copy", copyClassName)}>
        <strong>{title}</strong>
        {children}
        {progress && (
          <>
            <progress
              aria-label={progress.label}
              value={progress.value}
              max={progress.max || 1}
            />
            {progress.caption && <small>{progress.caption}</small>}
          </>
        )}
      </span>
    </button>
  );
}
