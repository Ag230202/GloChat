import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, LogOut, User, Image, Search } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
const WS_BASE = import.meta.env.VITE_WS_BASE || 'ws://localhost:8000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [authTab, setAuthTab] = useState('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState(null);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch current user details if token exists
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetch(`${API_BASE}/api/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Unauthorized');
          return res.json();
        })
        .then(data => {
          setCurrentUser(data);
          loadUsersList();
        })
        .catch(() => handleLogout());
    } else {
      localStorage.removeItem('token');
      setCurrentUser(null);
    }
  }, [token]);

  // Load user list
  const loadUsersList = () => {
    fetch(`${API_BASE}/api/users/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(console.error);
  };

  // Connect to WebSocket room when selected user changes
  useEffect(() => {
    if (!currentUser || !selectedUser) {
      if (wsRef.current) wsRef.current.close();
      setMessages([]);
      return;
    }

    // Determine unique room name by sorting usernames
    const sortedNames = [currentUser.username, selectedUser.username].sort();
    const roomName = `${sortedNames[0]}_${sortedNames[1]}`;

    // Fetch message history first
    fetch(`${API_BASE}/api/messages/${roomName}/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(console.error);

    // Open WebSocket
    const ws = new WebSocket(`${WS_BASE}/ws/chat/${roomName}/`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Construct message object matching serializer format
      const newMsg = {
        id: Date.now(),
        content: data.message,
        timestamp: data.timestamp,
        sender: {
          username: data.username
        }
      };
      setMessages(prev => [...prev, newMsg]);
    };

    return () => {
      ws.close();
    };
  }, [selectedUser, currentUser]);

  // Auto-scroll messages list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = (e) => {
    e.preventDefault();
    setFeedback(null);
    fetch(`${API_BASE}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid credentials');
        return res.json();
      })
      .then(data => {
        setToken(data.access);
      })
      .catch(err => setFeedback({ type: 'error', text: err.message }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setFeedback(null);
    fetch(`${API_BASE}/api/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: usernameInput,
        password: passwordInput,
        email: emailInput,
        name: nameInput
      })
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          let msg = Object.values(errData).flat().join(' ') || 'Registration failed.';
          if (msg.toLowerCase().includes('already exists')) {
            msg = 'User already exists.';
          } else if (msg.toLowerCase().includes('blank') || msg.toLowerCase().includes('required')) {
            msg = 'All fields are required.';
          }
          throw new Error(msg);
        }
        return res.json();
      })
      .then(() => {
        setFeedback({ type: 'success', text: 'Registration successful! Please login.' });
        setAuthTab('login');
      })
      .catch(err => setFeedback({ type: 'error', text: err.message }));
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    setSelectedUser(null);
    setUsers([]);
    setMessages([]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      message: messageText,
      username: currentUser.username
    }));

    setMessageText('');
  };

  const getInitials = (userObj) => {
    if (userObj.profile?.name) {
      return userObj.profile.name.substring(0, 2).toUpperCase();
    }
    return userObj.username.substring(0, 2).toUpperCase();
  };

  const filteredUsers = users.filter(u =>
    (u.profile?.name || u.username).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="auth-container glass-panel">
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '700', background: 'linear-gradient(135deg, #8b5cf6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GloChat</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>Real-time conversations with a vibrant glow.</p>
        </div>
        <div className="auth-tabs">
          <div
            className={`auth-tab ${authTab === 'login' ? 'active' : ''}`}
            onClick={() => { setAuthTab('login'); setFeedback(null); }}
          >
            Login
          </div>
          <div
            className={`auth-tab ${authTab === 'register' ? 'active' : ''}`}
            onClick={() => { setAuthTab('register'); setFeedback(null); }}
          >
            Register
          </div>
        </div>

        {feedback && (
          <div className={`feedback-msg ${feedback.type}`} style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.9rem',
            textAlign: 'center',
            background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: feedback.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
            color: feedback.type === 'error' ? '#f87171' : '#34d399'
          }}>
            {feedback.text}
          </div>
        )}

        {authTab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="text"
              placeholder="Username"
              className="input-field"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input-field"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">Sign In</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="text"
              placeholder="Name"
              className="input-field"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <input
              type="text"
              placeholder="Username"
              className="input-field"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              className="input-field"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="input-field"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">Sign Up</button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="app-layout glass-panel">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="avatar">
              {currentUser.profile?.avatar ? (
                <img src={`${API_BASE}${currentUser.profile.avatar}`} alt="Avatar" />
              ) : (
                getInitials(currentUser)
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{currentUser.profile?.name || currentUser.username}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Online</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        </div>

        <div style={{ padding: '12px', borderBottom: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%' }}
          />
        </div>

        <div className="user-list">
          {filteredUsers.map(u => (
            <div
              key={u.id}
              className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="avatar" style={{ border: selectedUser?.id === u.id ? '2px solid var(--accent-color)' : '' }}>
                {u.profile?.avatar ? (
                  <img src={`${API_BASE}${u.profile.avatar}`} alt="Avatar" />
                ) : (
                  getInitials(u)
                )}
              </div>
              <div>
                <div style={{ fontWeight: 550 }}>{u.profile?.name || u.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="avatar">
                {selectedUser.profile?.avatar ? (
                  <img src={`${API_BASE}${selectedUser.profile.avatar}`} alt="Avatar" />
                ) : (
                  getInitials(selectedUser)
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{selectedUser.profile?.name || selectedUser.username}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Chatting</div>
              </div>
            </div>

            <div className="messages-list">
              {messages.map(msg => {
                const isSelf = msg.sender.username === currentUser.username;
                return (
                  <div key={msg.id} className={`message-bubble ${isSelf ? 'self' : 'other'}`}>
                    <div className="msg-text">{msg.content}</div>
                    <div className="msg-time">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-area">
              <input
                type="text"
                placeholder="Type your message..."
                className="input-field"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignSelf: 'center', color: 'var(--text-secondary)', gap: '12px' }}>
            <MessageSquare size={48} style={{ alignSelf: 'center', opacity: 0.5 }} />
            <div>Select user to start chat</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
