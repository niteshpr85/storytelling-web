const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store (serverless compatible - resets on cold starts)
let stories = [
  {
    id: 1,
    title: 'The Enchanted Forest',
    content: 'Once upon a time in a magical forest where trees whispered secrets and fireflies danced like living stars, a young girl named Elara discovered a hidden path...',
    author: 'Elara Green',
    category: 'Fantasy',
    likes: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Space Odyssey Begins',
    content: 'Captain Nova gripped the controls as the Stellar Wing pierced the atmosphere. Stars became rivers of light as she entered hyperspace...',
    author: 'Nova Starr',
    category: 'Sci-Fi',
    likes: 28,
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 3,
    title: 'Mystery of the Old Manor',
    content: 'Rain lashed the windows of Blackwood Manor as detective Riley uncovered the first clue - a locket hidden behind a portrait...',
    author: 'Riley Black',
    category: 'Mystery',
    likes: 8,
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 172800000).toISOString()
  }
];

let nextId = 4;

// Generate next ID
function getNextId() {
  const id = nextId;
  nextId++;
  return id;
}

// Helper: Find story by ID
function findStory(id) {
  return stories.find(s => s.id === parseInt(id));
}

// GET all stories
app.get('/api/stories', (req, res) => {
  const sortedStories = [...stories].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(sortedStories);
});

// GET single story
app.get('/api/stories/:id', (req, res) => {
  const story = findStory(req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  res.json(story);
});

// POST new story
app.post('/api/stories', (req, res) => {
  const { title, content, author, category } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  const newStory = {
    id: getNextId(),
    title,
    content,
    author: author || 'Anonymous',
    category: category || 'General',
    likes: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  stories.push(newStory);
  res.json({ id: newStory.id });
});

// PUT update story
app.put('/api/stories/:id', (req, res) => {
  const story = findStory(req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  const { title, content, author, category } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  story.title = title;
  story.content = content;
  story.author = author || 'Anonymous';
  story.category = category || 'General';
  story.updated_at = new Date().toISOString();

  res.json({ message: 'Story updated' });
});

// DELETE story
app.delete('/api/stories/:id', (req, res) => {
  const index = stories.findIndex(s => s.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Story not found' });
  }

  stories.splice(index, 1);
  res.json({ message: 'Story deleted' });
});

// POST like story
app.post('/api/stories/:id/like', (req, res) => {
  const story = findStory(req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  story.likes += 1;
  res.json({ likes: story.likes });
});

// Export for Vercel serverless
module.exports = app;

