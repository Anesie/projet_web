
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    document.body.innerHTML = '<p>Identifiant de randonnée manquant.</p>';
    return;
  }

  let isLogged = false;
  // Vérifier si l'utilisateur est connecté
  fetch('/api/user')
    .then(res => {
      if (res.ok) isLogged = true;
    })
    .catch(() => {});

  // Charger les données de la randonnée
  fetch(`/api/randonnees/${id}`)
    .then(res => {
      if (!res.ok) throw new Error('Randonnée non trouvée.');
      return res.json();
    })
    .then(h => {
      // Afficher la photo
      if (h.filename) {
        const img = document.createElement('img');
        img.src = `/uploads/${h.filename}`;
        img.alt = h.name;
        img.className = 'hike-photo';
        document.getElementById('photo-container').appendChild(img);
      }
      
      document.getElementById('hike-name').textContent  = h.name;
      document.getElementById('hike-desc').textContent  = h.description;
      document.getElementById('hike-start').textContent = h.start_address;

      // Statistiques initiales
      const avgEl   = document.getElementById('avg-rating');
      const votesEl = document.getElementById('votes');
      const plural  = document.getElementById('vote-s-plural');
      if (h.votes > 0) {
        avgEl.textContent   = h.avg_rating;
        votesEl.textContent = h.votes;
        plural.textContent  = h.votes > 1 ? 's' : '';
      }

      // Gestion des étoiles
      const stars = document.querySelectorAll('#rate-stars span');
      stars.forEach(star => {
        star.addEventListener('click', () => {
          // Si pas connecté, rediriger vers connexion
          if (!isLogged) {
            window.location.href = '/connexion.html';
            return;
          }
          const rating = star.dataset.value;
          fetch(`/api/randonnees/${id}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating })
          })
          .then(res => {
            if (!res.ok) throw new Error('Échec de l’envoi de la note.');
            return res.json();
          })
          .then(stats => {
            // Mettre à jour moyenne et votes
            avgEl.textContent   = stats.avg_rating;
            votesEl.textContent = stats.votes;
            plural.textContent  = stats.votes > 1 ? 's' : '';
            // Afficher étoiles pleines jusqu’à la note
            stars.forEach(s => {
              s.textContent = s.dataset.value <= rating ? '★' : '☆';
            });
            document.getElementById('rating-error').textContent = '';
          })
          .catch(err => {
            document.getElementById('rating-error').textContent = err.message;
          });
        });
      });
    })
    .catch(err => {
      document.body.innerHTML = `<p>${err.message}</p>`;
    });
});
