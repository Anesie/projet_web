const express    = require('express');
const router     = express.Router();
const { serveHTML } = require('../lib/espaces-html');

module.exports = (requireLogin) => {
  router.get('/',               (req, res) => serveHTML(res, '../public', 'index.html'));
  router.get('/connexion.html', (req, res) => serveHTML(res, '../public', 'connexion.html'));
  router.get('/randonnee.html', (req, res) => serveHTML(res, '../public', 'randonnee.html'));

  // protégé
  router.get('/contribuer.html', requireLogin, (req, res) =>
    serveHTML(res, '../public', 'contribuer.html')
  );

  return router;
};
