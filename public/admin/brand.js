// Injeta sua logo no header do Decap após o login
(function brandCMS() {
  const LOGO_URL = "/admin/logo.png";

  const HEADER_CANDIDATES = [
    '.nc-appHeader',
    '[class*="AppHeader_root"]',
  ];
  const LOGO_SLOTS = [
    '.nc-appHeader-brand',
    '.nc-appHeader-logo',
    '[class*="AppHeader_brand"]',
    '[class*="AppHeader_logo"]',
    '.nc-appHeader a[href="#/"]',
  ];

  function replaceWithLogo(el) {
    if (!el || el.dataset.stockBranded) return;
    el.dataset.stockBranded = "1";
    // Remove SVGs/IMGs padrão
    el.querySelectorAll('svg, img').forEach(n => n.remove());
    // Aplica background com sua logo
    Object.assign(el.style, {
      backgroundImage: `url("${LOGO_URL}")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "left center",
      backgroundSize: "contain",
      display: "inline-block",
      width: "180px",
      height: "40px",
    });
  }

  function trySwapHeader() {
    const header = document.querySelector(HEADER_CANDIDATES.join(','));
    if (!header) return false;
    const slots = header.querySelectorAll(LOGO_SLOTS.join(','));
    if (slots.length === 0) return false;
    slots.forEach(replaceWithLogo);
    return true;
  }

  const tick = () => trySwapHeader();

  const mo = new MutationObserver(tick);
  mo.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('load', tick);
  document.addEventListener('DOMContentLoaded', tick);
  setTimeout(tick, 0);
  setTimeout(tick, 300);
  setTimeout(tick, 1000);
})();
