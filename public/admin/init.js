// public/admin/init.js

// título
document.title = "Stock Capital — CMS";

// registra CSS de preview (o link já está no <head>, mas o Decap também aceita registrar)
if (window.CMS?.registerPreviewStyle) {
  window.CMS.registerPreviewStyle("/admin/preview.css", { raw: false });
}

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
    const displayName =
      user?.user_metadata?.full_name ||
      user?.full_name ||
      user?.email ||
      "Usuário";
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
