const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const db = new sqlite3.Database(path.join(__dirname, 'stories.db'));

db.serialize(() => {
  db.run(`CREATE TABLE stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT,
    category TEXT DEFAULT 'General',
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed sample stories with categories and likes
  const stmt = db.prepare('INSERT INTO stories (title, content, author, category, likes) VALUES (?, ?, ?, ?, ?)');
  stmt.run('The Enchanted Forest', 'Once upon a time in a magical forest where trees whispered secrets and fireflies danced like living stars, a young girl named Elara discovered a hidden path...', 'Elara Green', 'Fantasy', 12);
  stmt.run('Space Odyssey Begins', 'Captain Nova gripped the controls as the Stellar Wing pierced the atmosphere. Stars became rivers of light as she entered hyperspace...', 'Nova Starr', 'Sci-Fi', 28);
  stmt.run('Mystery of the Old Manor', 'Rain lashed the windows of Blackwood Manor as detective Riley uncovered the first clue - a locket hidden behind a portrait...', 'Riley Black', 'Mystery', 8);
  stmt.finalize();
});

// GET all stories
app.get('/api/stories', (req, res) => {
  db.all('SELECT * FROM stories ORDER BY created_at DESC', (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

// GET single story
app.get('/api/stories/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM stories WHERE id = ?', [id], (err, row) => {
    if (err) res.status(500).json({ error: err.message });
    else if (!row) res.status(404).json({ error: 'Story not found' });
    else res.json(row);
  });
});

// POST new story
app.post('/api/stories', (req, res) => {
  const { title, content, author, category } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  
  db.run('INSERT INTO stories (title, content, author, category) VALUES (?, ?, ?, ?)', 
    [title, content, author || 'Anonymous', category || 'General'], 
    function(err) {
      if (err) res.status(500).json({ error: err.message });
      else res.json({ id: this.lastID });
    }
  );
});

// PUT update story
app.put('/api/stories/:id', (req, res) => {
  const id = req.params.id;
  const { title, content, author, category } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  
  db.run('UPDATE stories SET title = ?, content = ?, author = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [title, content, author || 'Anonymous', category || 'General', id], function(err) {
      if (err) res.status(500).json({ error: err.message });
      else if (this.changes === 0) res.status(404).json({ error: 'Story not found' });
      else res.json({ message: 'Story updated' });
    }
  );
});

// DELETE story
app.delete('/api/stories/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM stories WHERE id = ?', [id], function(err) {
    if (err) res.status(500).json({ error: err.message });
    else if (this.changes === 0) res.status(404).json({ error: 'Story not found' });
    else res.json({ message: 'Story deleted' });
  });
});

// POST like story
app.post('/api/stories/:id/like', (req, res) => {
  const id = req.params.id;
  db.run('UPDATE stories SET likes = likes + 1 WHERE id = ?', [id], function(err) {
    if (err) res.status(500).json({ error: err.message });
    else if (this.changes === 0) res.status(404).json({ error: 'Story not found' });
    else db.get('SELECT likes FROM stories WHERE id = ?', [id], (err, row) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json({ likes: row.likes });
    });
  });
});

app.listen(port, () => {
  console.log(`🚀 Advanced Storytelling Server: http://localhost:${port}`);
});
