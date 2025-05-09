const express       = require('express');
const session       = require('express-session');
const SQLiteStore   = require('connect-sqlite3')(session);
const bcrypt        = require('bcrypt');
const multer        = require('multer');
const path          = require('path');
const sqlite3       = require('sqlite3').verbose();

const app  = express();
const PORT = 8080;


const db = new sqlite3.Database('./scripts/randonnees.db', err => {
  if (err) console.error('Erreur ouverture DB:', err);
});


app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: './scripts' }),
  secret: 'changez_ce_secret_pour_prod',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } 
}));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const upload = multer({ dest: path.join(__dirname, 'public/uploads') });


function requireLogin(req, res, next) {
  console.log('↳ requireLogin pour :', req.path, '— userId =', req.session.userId);
  if (!req.session.userId) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Connexion requise' });
    }
    return res.redirect('/connexion.html');
  }
  next();
}

// --- Authentication routes ---

app.post('/api/login', (req, res) => {
  console.log('↳ POST /api/login body =', req.body);
  const { username, password, register } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      console.error('Erreur DB lors du SELECT:', err);
      return res.status(500).json({ error: 'Erreur base' });
    }
    console.log('Utilisateur trouvé en base ? ', !!user);

    // Inscription
    if (register === 'on') {
      console.log('→ Inscription demandée pour', username);
      if (user) {
        console.log('→ Échec : utilisateur existe déjà');
        return res.status(409).json({ error: 'Identifiant déjà utilisé' });
      }
      const hash = await bcrypt.hash(password, 10);
      return db.run(
        'INSERT INTO users (username, password_hash) VALUES (?, ?)',
        [username, hash],
        function(err) {
          if (err) {
            console.error('Erreur INSERT user :', err);
            return res.status(500).json({ error: 'Impossible de créer user' });
          }
          console.log('→ Inscription réussie, id =', this.lastID);
          req.session.userId   = this.lastID;
          req.session.username = username;
          return res.json({ username });
        }
      );
    }

    // Connexion
    console.log('→ Tentative de connexion pour', username);
    if (!user) {
      console.log('→ Échec connexion : utilisateur introuvable');
      return res.status(401).json({ error: 'Identifiant inconnu' });
    }
    console.log('→ Hash stocké =', user.password_hash);
    const valid = await bcrypt.compare(password, user.password_hash);
    console.log('→ Mot de passe correct ? ', valid);
    if (!valid) {
      console.log('→ Échec connexion : mot de passe incorrect');
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }
    console.log('→ Connexion OK pour', username);
    req.session.userId   = user.id;
    req.session.username = user.username;
    return res.json({ username: user.username });
  });
});

// logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Impossible de déconnecter' });
    res.clearCookie('connect.sid');
    res.json({ loggedOut: true });
  });
});

// user
app.get('/api/user', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Non connecté' });
  }
  res.json({ username: req.session.username });
});

// --- Randonnees API ---
app.get('/api/randonnees', (req, res) => {
  db.all(
    `SELECT 
       h.id,
       h.name,
       h.start_address,
       p.filename,
       ROUND(AVG(r.rating),2) AS avg_rating
     FROM hikes h
     LEFT JOIN photos  p ON p.hike_id   = h.id
     LEFT JOIN ratings r ON r.hike_id   = h.id
     GROUP BY h.id
     ORDER BY h.name COLLATE NOCASE`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

//détail + photo + stats
app.get('/api/randonnees/:id', (req, res) => {
  db.get(
    `SELECT 
       h.*, 
       p.filename, 
       ROUND(AVG(r.rating),2) AS avg_rating, 
       COUNT(r.rating) AS votes 
     FROM hikes h 
     LEFT JOIN photos p ON p.hike_id = h.id 
     LEFT JOIN ratings r ON r.hike_id = h.id 
     WHERE h.id = ? 
     GROUP BY h.id`,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Non trouvé' });
      res.json(row);
    }
  );
});

app.post(
  '/api/randonnees',
  requireLogin,
  upload.single('photo'),
  (req, res) => {
    const { name, description, start_address } = req.body;
    db.run(
      'INSERT INTO hikes (name, description, start_address) VALUES (?, ?, ?)',
      [name, description, start_address],
      function(err) {
        if (err) return res.status(500).send('Erreur enregistrement randonnée');
        const hikeId = this.lastID;
        const filename = req.file ? req.file.filename : null;
        if (filename) {
          db.run(
            'INSERT INTO photos (hike_id, filename) VALUES (?, ?)',
            [hikeId, filename],
            err2 => {
              if (err2) console.error('Erreur insertion photo :', err2);
              res.redirect(`/randonnee.html?id=${hikeId}`);
            }
          );
        } else {
          res.redirect(`/randonnee.html?id=${hikeId}`);
        }
      }
    );
  }
);

app.post(
  '/api/randonnees/:id/rate',
  requireLogin,
  express.json(),
  (req, res) => {
    const hikeId = req.params.id;
    const userId = req.session.userId;
    const rating = parseInt(req.body.rating, 10);
    if (!(rating >= 1 && rating <= 5)) {
      return res.status(400).json({ error: 'Notation invalide' });
    }

    db.run(
      `INSERT INTO ratings (hike_id, user_id, rating)
       VALUES (?, ?, ?)
       ON CONFLICT(hike_id, user_id) DO UPDATE SET rating=excluded.rating`,
      [hikeId, userId, rating],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get(
          `SELECT ROUND(AVG(rating),2) AS avg_rating, COUNT(*) AS votes
           FROM ratings WHERE hike_id = ?`,
          [hikeId],
          (e2, stats) => {
            if (e2) return res.status(500).json({ error: e2.message });
            res.json(stats);
          }
        );
      }
    );
  }
);

// --- HTML pages ---
app.get('/connexion.html',                (req,res) => res.sendFile(path.join(__dirname,'/public/connexion.html')));
app.get('/contribuer.html', requireLogin, (req,res) => res.sendFile(path.join(__dirname,'/public/contribuer.html')));
app.get('/contribuer',      requireLogin, (req,res) => res.redirect('/contribuer.html'));
app.get('/randonnee.html',                (req,res) => res.sendFile(path.join(__dirname,'/public/randonnee.html')));
app.get('/',                              (req,res) => res.sendFile(path.join(__dirname,'/public/index.html')));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// --- Démarrer le serveur ---
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
