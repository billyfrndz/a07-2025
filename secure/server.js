const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// 1. Defend Against Automated Attacks: Rate-limit authentication attempts
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 5,               // Max 5 failed attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' }
});

// 2. Secure Session Lifecycle: Cookie-based, HttpOnly, secure flags
app.use(session({
  name: '__Host-session',
  secret: process.env.SESSION_SECRET || 'dev_fallback_secret_key_32_bytes',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,       // Prevents client-side script access (mitigates theft)
    secure: false,        // Set to true when serving behind HTTPS/TLS
    sameSite: 'strict',   // CSRF protection
    maxAge: 15 * 60 * 1000 // 15-minute expiration
  }
}));

// Pre-hashed password ('Password123')
const users = [
  {
    id: 1,
    username: 'admin',
    passwordHash: '$2b$10$wT33o2UqB7Msk6v24z/w7uNl8w4b2Z19lR5s4mI4x.j6WbF8H1Vq.'
  }
];

// Login route
app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = users.find(u => u.username === username);

  // Time-constant comparison check even if user doesn't exist
  const dummyHash = '$2b$10$invalidhashstringtopreventtimingattacks1234567890123';
  const match = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);

  if (!user || !match) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // 3. Mitigate Session Fixation: Regenerate session ID upon privilege elevation
  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).json({ error: 'Session initialization failed' });
    }

    req.session.user = { id: user.id, username: user.username };
    res.json({ message: 'Authentication successful. Secure session established.' });
  });
});

// Protected Profile
app.get('/api/profile', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Unauthorized: No active session' });
  }

  res.json({ status: 'Access granted', user: req.session.user });
});

// Explicit session destruction on logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Could not log out' });
    res.clearCookie('__Host-session');
    res.json({ message: 'Logged out successfully' });
  });
});

app.listen(3000, () => {
  console.log('Secured app running on internal port 3000');
});