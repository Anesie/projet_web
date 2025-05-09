fetch('/api/randonnees')
  .then(res => res.json())
  .then(hikes => {
    const ul = document.getElementById('hikes-list');
    ul.innerHTML = hikes.map(h => `
      <li>
        <div class="hike-info">
          <strong>${h.name}</strong><br>
          ${h.start_address}
        </div>
        <a href="/randonnee.html?id=${h.id}" class="btn-action">Consulter</a>
      </li>

      
    `).join('');
  })
  .catch(err => {
    console.error('Erreur lors du chargement de la page :', err);
    document.getElementById('hikes-list').innerHTML =
      '<li>Impossible de charger les randonnées.</li>';
  });

  let hikes = [];

  document.addEventListener('DOMContentLoaded', () => {
    const ul        = document.getElementById('hikes-list');
    const btnName   = document.getElementById('sort-name');
    const btnRating = document.getElementById('sort-rating');
  
    function render(list) {
      ul.innerHTML = list.map(h => `
        <li class="hike-item">
          ${h.filename
            ? `<img src="/uploads/${h.filename}" class="thumb">`
            : `<div class="thumb placeholder"></div>`
          }
          <div class="hike-info">
            <strong>${h.name}</strong><br>
            ${h.start_address}<br>
            Note moyenne : ${h.avg_rating ?? '–'}
          </div>
          <button class="btn-action" onclick="location.href='/randonnee.html?id=${h.id}'">
            Voir
          </button>
        </li>
      `).join('');
    }
  
 
    fetch('/api/randonnees')
      .then(res => res.json())
      .then(data => {
        hikes = data;
        render(hikes);
      })
      .catch(() => {
        ul.innerHTML = '<li>Impossible de charger les randonnées.</li>';
      });
  
    // Tri par nom
    btnName.addEventListener('click', () => {
      render([...hikes].sort((a, b) => a.name.localeCompare(b.name)));
    });
  
    // Tri par popularité
    btnRating.addEventListener('click', () => {
      render([...hikes].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)));
    });
  });
  

