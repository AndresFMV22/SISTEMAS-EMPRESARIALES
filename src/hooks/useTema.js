import { useEffect, useState } from "react";

export default function useTema() {
  const [oscuro, cambiarOscuro] = useState(() => {
    try { return localStorage.getItem("nt_theme") === "dark"; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", oscuro);
    document.documentElement.style.colorScheme = oscuro ? "dark" : "light";
    try { localStorage.setItem("nt_theme", oscuro ? "dark" : "light"); } catch { /* noop */ }
  }, [oscuro]);
  return [oscuro, cambiarOscuro];
}
