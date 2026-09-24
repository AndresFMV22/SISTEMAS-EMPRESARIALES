import { useRef, useEffect } from "react";

// Puerto del componente Squares de React Bits (fondo de rejilla animada en canvas).
export default function Squares({
  direction = "diagonal",
  speed = 0.5,
  borderColor = "rgba(56,189,248,0.18)",
  squareSize = 44,
  hoverFillColor = "rgba(56,189,248,0.10)",
  fadeColor = "#eef4ff",
  className = "",
}) {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const gridOffset = useRef({ x: 0, y: 0 });
  const hoveredSquareRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize;
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize;

      for (let x = startX; x < canvas.width + squareSize; x += squareSize) {
        for (let y = startY; y < canvas.height + squareSize; y += squareSize) {
          const squareX = x - (gridOffset.current.x % squareSize);
          const squareY = y - (gridOffset.current.y % squareSize);

          if (
            hoveredSquareRef.current &&
            Math.floor((x - startX) / squareSize) === hoveredSquareRef.current.x &&
            Math.floor((y - startY) / squareSize) === hoveredSquareRef.current.y
          ) {
            ctx.fillStyle = hoverFillColor;
            ctx.fillRect(squareX, squareY, squareSize, squareSize);
          }
          ctx.strokeStyle = borderColor;
          ctx.strokeRect(squareX, squareY, squareSize, squareSize);
        }
      }

      // viñeta radial hacia el fondo azul oscuro
      const g = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2,
        Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
      );
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, fadeColor);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const updateAnimation = () => {
      const s = Math.max(speed, 0.1);
      switch (direction) {
        case "right": gridOffset.current.x = (gridOffset.current.x - s + squareSize) % squareSize; break;
        case "left": gridOffset.current.x = (gridOffset.current.x + s + squareSize) % squareSize; break;
        case "up": gridOffset.current.y = (gridOffset.current.y + s + squareSize) % squareSize; break;
        case "down": gridOffset.current.y = (gridOffset.current.y - s + squareSize) % squareSize; break;
        case "diagonal":
          gridOffset.current.x = (gridOffset.current.x - s + squareSize) % squareSize;
          gridOffset.current.y = (gridOffset.current.y - s + squareSize) % squareSize;
          break;
        default: break;
      }
      drawGrid();
      requestRef.current = requestAnimationFrame(updateAnimation);
    };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize;
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize;
      hoveredSquareRef.current = {
        x: Math.floor((mouseX + gridOffset.current.x - startX) / squareSize),
        y: Math.floor((mouseY + gridOffset.current.y - startY) / squareSize),
      };
    };
    const handleMouseLeave = () => { hoveredSquareRef.current = null; };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    requestRef.current = requestAnimationFrame(updateAnimation);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(requestRef.current);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [direction, speed, borderColor, hoverFillColor, squareSize]);

  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} />;
}
