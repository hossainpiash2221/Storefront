/* eslint-disable @next/next/no-img-element */
export default function Img({ src, alt = '', className = '', priority = false }) {
  if (!src) return <div className={`bg-mist ${className}`} aria-hidden="true" />;
  return <img src={src} alt={alt} className={className} loading={priority ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer" />;
}
