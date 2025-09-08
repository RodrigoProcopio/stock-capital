// src/components/charts/ChartsCarousel.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import ChartRenderer from "./ChartRenderer.jsx";

export default function ChartsCarousel({ charts = [] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selected, setSelected] = useState(0);

  // autoplay (usa autoplay_seconds do slide atual)
  const timer = useRef(null);
  const hovering = useRef(false);
  const pageHidden = useRef(false);

  const clear = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const play = useCallback(() => {
    clear();
    if (!emblaApi || !charts.length) return;
    const idx = emblaApi.selectedScrollSnap();
    const cfg = charts[idx];
    const sec = Number(cfg?.autoplay_seconds || 0);
    if (!sec || hovering.current || pageHidden.current) return;
    timer.current = setInterval(() => {
      if (!emblaApi) return;
      const next = (emblaApi.selectedScrollSnap() + 1) % charts.length;
      emblaApi.scrollTo(next);
    }, sec * 1000);
  }, [emblaApi, charts]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("settle", play);
    onSelect();
    play();
    return clear;
  }, [emblaApi, onSelect, play]);

  useEffect(() => {
    const onVis = () => {
      pageHidden.current = document.hidden;
      play();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [play]);

  return (
    <div
      className="w-full"
      onMouseEnter={() => { hovering.current = true; clear(); }}
      onMouseLeave={() => { hovering.current = false; play(); }}
    >
      {/* viewport */}
      <div ref={emblaRef} className="w-full overflow-hidden">
        {/* container */}
        <div className="flex touch-pan-y select-none">
          {charts.map((cfg, i) => (
            // cada slide ocupa 100% da largura do carrossel
            <div key={i} className="shrink-0 grow-0 basis-full">
              <div className="w-full">
                {/* Renderiza pelo ChartRenderer, que decide qual tipo de gráfico */}
                <ChartRenderer config={cfg} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* bullets */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {charts.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-2 w-2 rounded-full ${i === selected ? "bg-brand-navy" : "bg-black/20"}`}
            aria-label={`Ir para o slide ${i + 1}`}
            aria-current={i === selected}
          />
        ))}
      </div>
    </div>
  );
}
