import Image, { type ImageProps } from "next/image";

// next/image with one tweak: SVG placeholders are served as-is (the optimizer
// rejects SVG), while real JPG/PNG/WebP photos get resized, converted to modern
// formats and lazy-loaded automatically once they're swapped in.
export default function SiteImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  return <Image {...props} unoptimized={props.unoptimized ?? src.endsWith(".svg")} />;
}
