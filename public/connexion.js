document.addEventListener('DOMContentLoaded', () => {
    const form     = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
  
    form.addEventListener('submit', event => {
      event.preventDefault();
      errorDiv.textContent = '';

      const formData = new FormData(form); 
      const params   = new URLSearchParams();
      for (const [key, value] of formData) {
        params.append(key, value);
      }
      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      })
  
      
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => {
            errorDiv.textContent = err.error;
          });
        }
        window.location.href = '/';
      })
      .catch(() => {
        errorDiv.textContent = 'Erreur réseau, veuillez réessayer.';
      });
    });
  });
  