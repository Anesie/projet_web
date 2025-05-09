document.addEventListener('DOMContentLoaded', () => {
    const nav = document.createElement('nav');
    nav.innerHTML = `
      <a href="/index.html">Accueil</a> |
      <a href="/contribuer.html">Contribuer</a>
      <hr>
    `;
    document.body.prepend(nav);
  });
  