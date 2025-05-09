document.addEventListener('DOMContentLoaded', () => {
  const authContainer = document.getElementById('auth-container');
  if (!authContainer) return;

  fetch('/api/user')
    .then(res => {
      if (res.ok) {
        // Utilisateur connecté
        return res.json().then(data => {
          authContainer.innerHTML = `
            <span class="welcome"> Mon compte : ${data.username}</span>
            <button id="logout-btn" class="nav-btn small">Déconnexion</button>
          `;
          document.getElementById('logout-btn').addEventListener('click', () => {
            fetch('/api/logout', { method: 'POST' })
              .then(() => window.location.reload());
          });
        });
      } else {
        // Pas connecté
        authContainer.innerHTML = `
          <button id="login-btn" class="nav-btn small">Connexion</button>
        `;
        document.getElementById('login-btn').addEventListener('click', () => {
          window.location.href = '/connexion.html';
        });
      }
    })
    .catch(() => {
      authContainer.innerHTML = `
        <button id="login-btn" class="nav-btn small">Connexion</button>
      `;
      document.getElementById('login-btn').addEventListener('click', () => {
        window.location.href = '/connexion.html';
      });
    });
});
