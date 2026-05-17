const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup (Using JSON File for Vercel Compatibility)
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/database.json' 
  : path.resolve(__dirname, 'database.json');

// Initialize DB if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Routes

// Get all todos
app.get('/api/todos', (req, res) => {
  try {
    const todos = readDB();
    // Sort by descending id (newest first)
    todos.sort((a, b) => b.id - a.id);
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new todo
app.post('/api/todos', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const todos = readDB();
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    todos.push(newTodo);
    writeDB(todos);
    
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a todo
app.put('/api/todos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { text, completed } = req.body;
    
    const todos = readDB();
    const index = todos.findIndex(t => t.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    if (text !== undefined) todos[index].text = text;
    if (completed !== undefined) todos[index].completed = completed;
    
    writeDB(todos);
    res.json(todos[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a todo
app.delete('/api/todos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const todos = readDB();
    const index = todos.findIndex(t => t.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    todos.splice(index, 1);
    writeDB(todos);
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
