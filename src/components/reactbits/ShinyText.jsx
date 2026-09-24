// Puerto de ShinyText de React Bits (brillo que recorre el texto).
export default function ShinyText({ text, disabled = false, speed = 5, className = "" }) {
  return (
    <span
      className={`shiny-text ${disabled ? "shiny-disabled" : ""} ${className}`}
      style={{ animationDuration: `${speed}s` }}
    >
      {text}
    </span>
  );
}
