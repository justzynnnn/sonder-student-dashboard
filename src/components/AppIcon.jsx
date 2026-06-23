export default function AppIcon({ className = 'h-9 w-9', alt = 'Sonder' }) {
  return (
    <img
      src="/icons/icon-512.png"
      alt={alt}
      className={`${className} rounded-2xl object-cover shadow-glow`}
      draggable="false"
    />
  );
}
