// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand
        "brand-primary": "#1e2241",  // Stock Capital (pedido)
        "brand-navy": "#1c2846",     // Azul marinho institucional
        "brand-100": "#d6d6d6",      // Cinza claro de seções largas

        // Texto
        "ink": "#1a1a1a",            // Preto profundo
        "slate-ink": "#333846",      // Cinza azulado escuro (texto corrido)
      },
      boxShadow: {
        subtle: "0 6px 20px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
