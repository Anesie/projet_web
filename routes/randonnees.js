const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const upload  = multer({ dest: './public/uploads' });

module.exports = (db, requireLogin) => {
  
  router.get('/', (req, res) => {
    db.all('SELECT * FROM hikes ORDER BY name COLLATE NOCASE', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

 
  router.get('/:id', (req, res) => {
    db.get('SELECT * FROM hikes WHERE id = ?', [req.params.id], (err, row) => {
      if (err)   return res.status(500).json({ error: err.message });
      if (!row)  return res.status(404).json({ error: 'Non trouvé' });
      res.json(row);
    });
  });

 
  router.post('/', requireLogin, upload.single('photo'), (req, res) => {
    const { name, description, start_address } = req.body;
    db.run(
      'INSERT INTO hikes (name, description, start_address) VALUES (?, ?, ?)',
      [name, description, start_address],
      function(err) {
        if (err) return res.status(500).send('Erreur enregistrement');
        
        res.redirect(`/randonnee.html?id=${this.lastID}`);
      }
    );
  });

  return router;
};
