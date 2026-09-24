import { useRef } from "react";

// Puerto de SpotlightCard de React Bits (foco radial que sigue el cursor).
export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(56,189,248,0.25)",
}) {
  const divRef = useRef(null);

  const handleMouseMove = (e) => {
    const el = divRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    el.style.setProperty("--spotlight-color", spotlightColor);
  };

  return (
    <div ref={divRef} onMouseMove={handleMouseMove} className={`card-spotlight ${className}`}>
      {children}
    </div>
  );
}
