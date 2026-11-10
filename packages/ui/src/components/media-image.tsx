'use client';
import React, { useEffect, useRef, useState } from 'react';

export interface MediaImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string;
  alt: string;
}

/**
 * Vehicle or listing photo that degrades to a labelled placeholder when the file cannot be loaded.
 *
 * A server-rendered image can fail before React attaches `onError`, so the load state is also
 * read from the element after mount.
 */
export function MediaImage({ src, alt, className = '', onError, ...rest }: MediaImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`${className} flex items-center justify-center bg-surface-container-high text-on-surface-variant`}
      >
        <svg className="h-1/2 max-h-12 w-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <path d="M5 17h14l-1.5-5h-11L5 17Z" />
          <path d="M8 12l2-4h4l2 4M7 17v2m10-2v2M8 15h.01M16 15h.01" />
        </svg>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
