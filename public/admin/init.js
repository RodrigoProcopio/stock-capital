// public/admin/init.js
import CMS from "decap-cms-app";
import "./preview.js";

// Use um CSS estático servido em /public/admin/preview.css
CMS.registerPreviewStyle("/admin/preview.css", { raw: false });

document.title = "Stock Capital — CMS";

/* Netlify Identity */
if (window.netlifyIdentity) {
  window.netlifyIdentity.init();

  const hasToken = /(?:invite_token|confirmation_token|recovery_token)=/.test(
    window.location.hash
  );

  if (hasToken) {
    console.log("Token detectado:", window.location.hash);
  }

  window.netlifyIdentity.on("login", (user) => {
    // Fallback seguro de nome (evita erros de full_name undefined em quaisquer logs)
    const displayName =
      user?.user_metadata?.full_name || user?.full_name || user?.email || "Usuário";

    console.log("Usuário logado no CMS:", displayName);

    if (hasToken) window.location.replace("/admin/");
  });

  window.netlifyIdentity.on("logout", () => {
    console.log("Usuário saiu");
  });

  window.netlifyIdentity.on("error", (err) => {
    console.error("Erro no Netlify Identity (admin):", err);
  });
} else {
  console.error("Identity widget não carregou.");
}
