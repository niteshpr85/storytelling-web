const API_BASE = '/api';
let stories = [];
let filteredStories = [];
let isEditing = false;
let editingId = null;

// DOM elements
const storyForm = document.getElementById('story-form');
const storiesList = document.getElementById('stories-list');
const searchInput = document.getElementById('search-input');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadStories();
  storyForm.addEventListener('submit', handleStorySubmit);
  searchInput.addEventListener('input', handleSearch);
});

// Load stories
async function loadStories() {
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/stories`);
    if (!response.ok) throw new Error('Failed to load stories');
    stories = await response.json();
    filteredStories = [...stories];
    renderStories();
  } catch (error) {
    showError('Failed to load stories: ' + error.message);
  }
}

// Search/filter
function handleSearch(e) {
  const term = e.target.value.toLowerCase();
  filteredStories = stories.filter(story => 
    story.title.toLowerCase().includes(term) || 
    story.content.toLowerCase().includes(term) ||
    story.author.toLowerCase().includes(term) ||
    story.category.toLowerCase().includes(term)
  );
  renderStories();
}

// Create/Update story
async function saveStory(formData, id = null) {
  try {
    let response;
    if (id && isEditing) {
      response = await fetch(`${API_BASE}/stories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    } else {
      response = await fetch(`${API_BASE}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    }
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  } catch (error) {
    throw new Error('Failed to save story: ' + error.message);
  }
}

// Delete story
async function deleteStory(id) {
  if (!confirm('Delete this story forever?')) return;
  try {
    const response = await fetch(`${API_BASE}/stories/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await response.text());
    loadStories();
    showSuccess('Story deleted!');
  } catch (error) {
    showError(error.message);
  }
}

// Like story
async function likeStory(id) {
  try {
    const response = await fetch(`${API_BASE}/stories/${id}/like`, { method: 'POST' });
    if (!response.ok) throw new Error(await response.text());
    loadStories(); // Refresh likes
  } catch (error) {
    showError(error.message);
  }
}

// Render stories
function renderStories() {
  const html = filteredStories.map(story => `
    <div class="story-card slide-up" style="animation-delay: ${Math.random() * 0.2}s">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px">
        <h3 class="story-title" onclick="viewStory(${story.id})">${story.title}</h3>
        <span class="category-badge" style="background: ${getCategoryColor(story.category)}; padding: 4px 12px; border-radius: 20px; color: white; font-size: 0.8em; font-weight: 600;">${story.category}</span>
      </div>
      <div class="story-meta">
        <i class="fas fa-user"></i> ${story.author || 'Anonymous'} • 
        <i class="fas fa-clock"></i> ${new Date(story.created_at).toLocaleDateString()} • 
        <i class="fas fa-heart"></i> ${story.likes}
      </div>
      <p class="story-content">${story.content.substring(0, 150)}${story.content.length > 150 ? '...' : ''}</p>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <a href="#" class="story-read-more" onclick="viewStory(${story.id}); return false;">
          <i class="fas fa-eye"></i> Read more
        </a>
        <button class="btn-small btn-edit" onclick="editStory(${story.id})" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-small btn-delete" onclick="deleteStory(${story.id})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
        <button class="btn-small" style="background: linear-gradient(135deg, #ed8936, #dd6b20);" onclick="likeStory(${story.id})" title="Like">
          <i class="fas fa-heart"></i> ${story.likes}
        </button>
      </div>
    </div>
  `).join('');
  
  storiesList.innerHTML = html || '<div style="text-align: center; padding: 40px; color: #a0aec0;"><i class="fas fa-search"></i><br>No stories match your search. Try something else!</div>';
}

// Edit story
function editStory(id) {
  const story = stories.find(s => s.id === id);
  if (story) {
    isEditing = true;
    editingId = id;
    document.getElementById('title').value = story.title;
    document.getElementById('content').value = story.content;
    document.getElementById('author').value = story.author || '';
    document.querySelector('#story-form button').textContent = 'Update Story ✨';
    document.getElementById('title').focus();
  }
}

// Cancel edit
function cancelEdit() {
  isEditing = false;
  editingId = null;
  storyForm.reset();
  document.querySelector('#story-form button').innerHTML = '<i class="fas fa-rocket"></i> Launch Story';
}

// Handle form submit
async function handleStorySubmit(e) {
  e.preventDefault();
  
  const formData = {
    title: document.getElementById('title').value,
    content: document.getElementById('content').value,
    author: document.getElementById('author').value,
    category: document.querySelector('#category')?.value || 'General'
  };

  try {
    await saveStory(formData, editingId);
    const message = isEditing ? 'Story updated!' : 'Story created successfully!';
    showSuccess(message);
    
    storyForm.reset();
    cancelEdit();
    await loadStories();
    
  } catch (error) {
    showError(error.message);
  }
}

// View story
function viewStory(id) {
  window.location.href = `story-view.html?id=${id}`;
}

// Category color helper
function getCategoryColor(category) {
  const colors = {
    'Fantasy': '#9f7aea',
    'Sci-Fi': '#63b3ed', 
    'Mystery': '#f56565',
    'Romance': '#ed64a6',
    'Horror': '#805ad5',
    'General': '#a0aec0'
  };
  return colors[category] || '#a0aec0';
}

// Utility functions
function showLoading() {
  storiesList.innerHTML = '<div class="loading">Loading magical tales...</div>';
}

function showError(message) {
  storiesList.innerHTML = `<div class="error"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success fade-in';
  successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.querySelector('#stories-section').prepend(successDiv);
  setTimeout(() => successDiv.remove(), 4000);
}
