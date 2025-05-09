const path = require('path');

function serveHTML(res, ...segments) {
  res.sendFile(path.join(__dirname, '..', ...segments));
}

module.exports = { serveHTML };
