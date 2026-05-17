import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, X, CheckCircle, AlertCircle } from 'lucide-react';
import './index.css';

const API_URL = import.meta.env.PROD ? '/api/todos' : 'http://localhost:5000/api/todos';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_URL);
      setTodos(response.data);
    } catch (err) {
      setError('Failed to fetch tasks. Make sure the backend server is running.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await axios.post(API_URL, { text: inputText });
      setTodos([response.data, ...todos]);
      setInputText('');
    } catch (err) {
      setError('Failed to add task.');
      console.error('Add error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      setError(null);
      // Optimistic update
      setTodos(todos.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
      
      await axios.put(`${API_URL}/${id}`, { completed: !currentStatus });
    } catch (err) {
      // Revert on failure
      setTodos(todos.map(t => t.id === id ? { ...t, completed: currentStatus } : t));
      setError('Failed to update task status.');
    }
  };

  const handleDelete = async (id) => {
    try {
      setError(null);
      // Optimistic delete
      const previousTodos = [...todos];
      setTodos(todos.filter(t => t.id !== id));
      
      await axios.delete(`${API_URL}/${id}`);
    } catch (err) {
      setError('Failed to delete task.');
      fetchTodos(); // Refresh list to get accurate state
    }
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    
    try {
      setError(null);
      // Optimistic update
      const previousTodos = [...todos];
      setTodos(todos.map(t => t.id === id ? { ...t, text: editText } : t));
      setEditingId(null);
      
      await axios.put(`${API_URL}/${id}`, { text: editText });
    } catch (err) {
      setError('Failed to update task.');
      fetchTodos(); // Revert
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Task Master</h1>
        <p>Manage your tasks efficiently</p>
      </header>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form className="todo-form" onSubmit={handleAddTodo}>
        <input
          type="text"
          className="todo-input"
          placeholder="What needs to be done?"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isSubmitting || loading}
        />
        <button 
          type="submit" 
          className="btn-add" 
          disabled={!inputText.trim() || isSubmitting || loading}
        >
          {isSubmitting ? 'Adding...' : <><Plus size={20} style={{ marginRight: '4px' }} /> Add</>}
        </button>
      </form>

      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Loading your tasks...</p>
        </div>
      ) : todos.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} color="var(--text-muted)" opacity={0.5} />
          <p>You're all caught up! Enjoy your day.</p>
        </div>
      ) : (
        <ul className="todo-list">
          {todos.map(todo => (
            <li key={todo.id} className="todo-item">
              {editingId === todo.id ? (
                // Edit Mode
                <>
                  <input
                    type="text"
                    className="edit-input"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(todo.id)}
                    autoFocus
                  />
                  <div className="todo-actions">
                    <button className="btn-save" onClick={() => saveEdit(todo.id)}>
                      Save
                    </button>
                    <button className="btn-icon" onClick={cancelEditing} aria-label="Cancel">
                      <X size={18} />
                    </button>
                  </div>
                </>
              ) : (
                // View Mode
                <>
                  <div className="todo-content">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggle(todo.id, todo.completed)}
                    />
                    <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                      {todo.text}
                    </span>
                  </div>
                  <div className="todo-actions">
                    <button 
                      className="btn-icon edit" 
                      onClick={() => startEditing(todo)}
                      aria-label="Edit task"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      className="btn-icon delete" 
                      onClick={() => handleDelete(todo.id)}
                      aria-label="Delete task"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
