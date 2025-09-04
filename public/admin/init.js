// Estilo do preview
CMS.registerPreviewStyle("/index.css");
document.title = "Stock Capital — CMS";

if (window.netlifyIdentity) {
  window.netlifyIdentity.init();

  // Debug: token na URL
  if (/#(?:invite_token|confirmation_token|recovery_token)=/.test(window.location.hash)) {
    console.log("Token detectado:", window.location.hash);
  }

  window.netlifyIdentity.on("login", (user) => {
    console.log("Usuário logado no CMS:", user);

    if (/#(?:invite_token|confirmation_token|recovery_token)=/.test(window.location.hash)) {
      window.location.replace("/admin/");
    }
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
