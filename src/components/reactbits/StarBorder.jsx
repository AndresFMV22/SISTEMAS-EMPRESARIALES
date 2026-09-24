// Puerto de StarBorder de React Bits (borde con brillo/estrella que recorre el contorno).
export default function StarBorder({
  as: Component = "div",
  className = "",
  color = "#38bdf8",
  speed = "6s",
  thickness = 1,
  children,
  ...rest
}) {
  return (
    <Component
      className={`star-border-container ${className}`}
      style={{ padding: `${thickness}px 0`, ...(rest.style || {}) }}
      {...rest}
    >
      <div className="star-glow star-bottom" style={{ background: `radial-gradient(circle, ${color}, transparent 12%)`, animationDuration: speed }} />
      <div className="star-glow star-top" style={{ background: `radial-gradient(circle, ${color}, transparent 12%)`, animationDuration: speed }} />
      <div className="star-inner">{children}</div>
    </Component>
  );
}
