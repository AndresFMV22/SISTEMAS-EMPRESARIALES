// Texto con degradado animado.
export default function TextoDegradado({
  children,
  className = "",
  colors = ["#38bdf8", "#8b9dff", "#38bdf8"],
  animationSpeed = 8,
  showBorder = false,
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
    animationDuration: `${animationSpeed}s`,
  };
  return (
    <span className={`animated-gradient-text ${className}`}>
      {showBorder && <span className="gradient-overlay" style={gradientStyle} />}
      <span className="gradient-text-content" style={gradientStyle}>
        {children}
      </span>
    </span>
  );
}
