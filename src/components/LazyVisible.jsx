// src/components/LazyVisible.jsx
import { useEffect, useRef, useState } from "react";

export default function LazyVisible({ children, rootMargin = "200px" }) {
  const ref = useRef(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return; // já visível, não precisa observar
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { root: null, rootMargin, threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isVisible, rootMargin]);

  return <div ref={ref}>{isVisible ? children : null}</div>;
}
