import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

// se estiver usando lucide-react, senão use um svg simples

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300); // só aparece após 300px
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 rounded-full bg-gray-600 p-3 text-white shadow-lg hover:bg-brand-primary transition"
      aria-label="Voltar ao topo"
    >
      <ChevronUp size={20} />
    </button>
  );
}
