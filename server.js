// server.js - Main Express server file
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite database
const db = new sqlite3.Database('./recipes.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    // Create tables if they don't exist
    createTables();
  }
});

// Create necessary tables
function createTables() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Saved Recipes table
    db.run(`
      CREATE TABLE IF NOT EXISTS saved_recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        recipe_id INTEGER NOT NULL,
        recipe_title TEXT NOT NULL,
        recipe_image TEXT,
        source_url TEXT,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, recipe_id)
      )
    `);

    // User Preferences table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        preferred_cuisine TEXT,
        dietary_restrictions TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables created or already exist');
  });
}

// API Routes

// Register a new user
app.post('/api/users/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // In a real app, you should hash passwords before storing
  const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
  
  db.run(query, [username, email, password], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    
    return res.status(201).json({ 
      message: 'User created successfully',
      userId: this.lastID
    });
  });
});

// Login a user
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const query = `SELECT id, username, email FROM users WHERE email = ? AND password = ?`;
  
  db.get(query, [email, password], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // In a real app, implement proper session management or JWT
    return res.status(200).json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  });
});

// Save a recipe
app.post('/api/recipes/save', (req, res) => {
  const { userId, recipeId, recipeTitle, recipeImage, sourceUrl } = req.body;
  
  if (!userId || !recipeId || !recipeTitle) {
    return res.status(400).json({ error: 'Required fields missing' });
  }
  
  const query = `
    INSERT INTO saved_recipes (user_id, recipe_id, recipe_title, recipe_image, source_url)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [userId, recipeId, recipeTitle, recipeImage, sourceUrl], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Recipe already saved' });
      }
      return res.status(500).json({ error: err.message });
    }
    
    return res.status(201).json({ 
      message: 'Recipe saved successfully',
      savedRecipeId: this.lastID
    });
  });
});

// Get all saved recipes for a user
app.get('/api/recipes/saved/:userId', (req, res) => {
  const userId = req.params.userId;
  
  const query = `SELECT * FROM saved_recipes WHERE user_id = ? ORDER BY saved_at DESC`;
  
  db.all(query, [userId], (err, recipes) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    return res.status(200).json({ recipes });
  });
});

// Delete a saved recipe
app.delete('/api/recipes/saved/:recipeId/:userId', (req, res) => {
  const { recipeId, userId } = req.params;
  
  const query = `DELETE FROM saved_recipes WHERE recipe_id = ? AND user_id = ?`;
  
  db.run(query, [recipeId, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Recipe not found or not saved by this user' });
    }
    
    return res.status(200).json({ message: 'Recipe removed successfully' });
  });
});

// Update user preferences
app.post('/api/users/:userId/preferences', (req, res) => {
  const userId = req.params.userId;
  const { preferredCuisine, dietaryRestrictions } = req.body;
  
  const query = `
    INSERT INTO user_preferences (user_id, preferred_cuisine, dietary_restrictions) 
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
    preferred_cuisine = ?,
    dietary_restrictions = ?
  `;
  
  db.run(query, [
    userId, preferredCuisine, dietaryRestrictions, 
    preferredCuisine, dietaryRestrictions
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    return res.status(200).json({ 
      message: 'Preferences updated successfully',
      userId: userId
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Close database connection on application exit
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});