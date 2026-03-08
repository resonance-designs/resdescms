import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('server/cms.db');
db.get('SELECT * FROM rdcms_pages WHERE slug = ?', ['posts'], (err, row) => {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(row, null, 2));
  }
  db.close();
});
