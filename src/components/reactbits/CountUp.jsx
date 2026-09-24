import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

// Puerto de CountUp de React Bits (conteo animado con framer-motion).
export default function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = ".",
  prefix = "",
  suffix = "",
  decimals = 0,
}) {
  const ref = useRef(null);
  const motionValue = useMotionValue(direction === "down" ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, { damping, stiffness });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const format = (value) => {
    const fixed = Number(value).toFixed(decimals);
    const [intPart, decPart] = fixed.split(".");
    const withSep = separator
      ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
      : intPart;
    const body = decPart ? `${withSep},${decPart}` : withSep;
    return `${prefix}${body}${suffix}`;
  };

  useEffect(() => {
    if (ref.current) ref.current.textContent = format(direction === "down" ? to : from);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isInView && startWhen) {
      const t = setTimeout(() => {
        motionValue.set(direction === "down" ? from : to);
      }, delay * 1000);
      return () => clearTimeout(t);
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay]);

  useEffect(() => {
    const unsub = springValue.on("change", (latest) => {
      if (ref.current) ref.current.textContent = format(latest);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [springValue, decimals, separator, prefix, suffix]);

  return <span className={className} ref={ref} />;
}
