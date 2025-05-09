const express = require('express');
const router  = express.Router();

module.exports = (db, hashPassword, comparePassword) => {

  router.post('/login', express.urlencoded({ extended: true }), async (req, res) => {
    const { username, password, register } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) return res.status(500).json({ error: 'Erreur base' });

      // INSCRIPTION
      if (register === 'on') {
        if (user) return res.status(409).json({ error: 'Identifiant déjà utilisé' });
        const hash = await hashPassword(password);
        db.run(
          'INSERT INTO users (username, password_hash) VALUES (?, ?)',
          [username, hash],
          function(err) {
            if (err) return res.status(500).json({ error: 'Impossible de créer user' });
            req.session.userId   = this.lastID;
            req.session.username = username;
            return res.json({ username });
          }
        );
        return;
      }

      // CONNEXION
      if (!user) {
        return res.status(401).json({ error: 'Identifiant inconnu' });
      }
      const ok = await comparePassword(password, user.password_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Mot de passe incorrect' });
      }
      req.session.userId   = user.id;
      req.session.username = user.username;
      res.json({ username: user.username });
    });
  });

  //logout
  router.post('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) return res.status(500).json({ error: 'Impossible de déconnecter' });
      res.clearCookie('connect.sid');
      res.json({ loggedOut: true });
    });
  });

  //user
  router.get('/user', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Non connecté' });
    res.json({ username: req.session.username });
  });

  return router;
};
