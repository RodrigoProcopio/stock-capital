import { useEffect, useState } from "react";
import whatsappIcon from "../assets/WhatsApp.svg";

// Somente variáveis de ambiente (Netlify/.env)
const PHONE = import.meta.env.VITE_WA_PHONE;
const MESSAGE = import.meta.env.VITE_WA_MESSAGE;

export default function FloatingWhatsApp() {
  // ⚠️ Hooks SEMPRE no topo (sem early-return antes!)
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(true);
      const t = setTimeout(() => setAnimate(false), 600);
      return () => clearTimeout(t);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Se as envs não estiverem definidas, apenas não renderiza
  const disabled = !PHONE || !MESSAGE;
  if (disabled) return null;

  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed z-[60] rounded-full shadow-lg border border-black/5 transition
                 focus:outline-none focus:ring-2 focus:ring-emerald-300"
      style={{
        bottom: `calc(6.5rem + env(safe-area-inset-bottom, 0px))`,
        right: 16,
        width: 56,
        height: 56,
        backgroundColor: "#25D366",
      }}
    >
      <img
        src={whatsappIcon}
        alt="WhatsApp"
        className={`w-full h-full p-2 ${animate ? "animate-shake" : ""}`}
      />
    </a>
  );
}
