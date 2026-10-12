const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// In-memory demo DB (Plaintext password)
const users = [
  { id: 1, username: 'admin', password: 'Password123' }
];

// Active sessions map
const sessions = {};

// Vulnerability 1 & 2: No rate limiting, Plaintext comparison, session in URL
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Vulnerability 3: Predictable or non-standard token generation
  const sessionId = crypto.randomBytes(8).toString('hex');
  sessions[sessionId] = { userId: user.id, username: user.username };

  // Exposing session identifier directly in payload for client to store insecurely
  return res.json({
    message: 'Login successful',
    sessionId: sessionId,
    profileUrl: `/api/profile?sessionId=${sessionId}`
  });
});

// Profile endpoint relying on URL tokens (leaks via referrers & logs)
app.get('/api/profile', (req, res) => {
  const sessionId = req.query.sessionId;
  const session = sessions[sessionId];

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized or invalid token' });
  }

  return res.json({ status: 'Access granted', user: session });
});

app.listen(3000, () => {
  console.log('Unsecured app running on internal port 3000');
});