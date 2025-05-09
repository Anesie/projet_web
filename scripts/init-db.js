// scripts/init-db.js
console.log('→ Lancement init-db.js');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./scripts/randonnees.db');

const schema = `
CREATE TABLE IF NOT EXISTS hikes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  start_address TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hike_id INTEGER NOT NULL REFERENCES hikes(id),
  filename TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hike_id INTEGER NOT NULL REFERENCES hikes(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  UNIQUE(hike_id, user_id)
);
`;

db.exec(schema, err => {
  if (err) console.error('Erreur création des tables :', err);
  else console.log('Schéma initialisé avec succès.');
  db.close();
});
