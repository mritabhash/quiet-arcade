import { useEffect, useRef } from "react";
import { Viewer } from "mapillary-js";
import "mapillary-js/dist/mapillary.css";

/**
 * Owns a single mapillary-js Viewer instance. Drag to look around; the viewer's
 * built-in arrows step to adjacent street images. Rebuilds when the image id or
 * token changes and disposes on unmount to avoid leaking WebGL contexts.
 */
export function MapillaryViewer({
  imageId,
  accessToken,
  className,
}: {
  imageId: string;
  accessToken: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new Viewer({
      accessToken,
      container: containerRef.current,
      imageId,
      component: { cover: false },
    });
    viewerRef.current = viewer;
    return () => {
      viewer.remove();
      viewerRef.current = null;
    };
    // Rebuild only when the token changes; image changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    viewerRef.current?.moveTo(imageId).catch(() => {
      /* image unavailable; the game resolves a different round */
    });
  }, [imageId]);

  return <div ref={containerRef} className={className} />;
}
