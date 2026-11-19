// routes/auth.js - register, login, logout and user profile pages.
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router(); 6
router.get('/register', (req, res) => {
res.render('register', { title: 'Create account', errors: [], form: {} });
}); 10
router.post('/register', (req, res) => {
const { username, email, password } = req.body;
const errors = []; 14
if (!/^[A-Za-z0-9_]{3,20}$/.test(username || '')) errors.push('Username must be 3-20 letters, numbers or underscores.');
if (!/^\S+@\S+\.\S+$/.test(email || '')) errors.push('Enter a valid email address.');
if (!password || password.length < 6) errors.push('Password must be at least 6 characters.'); 18
if (errors.length === 0) {
const taken = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
if (taken) errors.push('That username or email is already taken.');
}
if (errors.length > 0) {
return res.status(400).render('register', { title: 'Create account', errors, form: { username, email } });
} 26
// Never store the real password, only a bcrypt hash of it
const hash = bcrypt.hashSync(password, 10);
const info = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, hash);
req.session.userId = info.lastInsertRowid;
req.session.flash = { type: 'ok', text: `Welcome to BookNook, ${username}!` };
res.redirect('/');
}); 34
router.get('/login', (req, res) => {
res.render('login', { title: 'Log in', error: null });
}); 38
router.post('/login', (req, res) => {
const { username, password } = req.body;
const found = db.prepare('SELECT * FROM users WHERE username = ?').get(username || '');
// Same message for wrong username or wrong password, so nobody can guess usernames
if (!found || !bcrypt.compareSync(password || '', found.password_hash)) {
return res.status(401).render('login', { title: 'Log in', error: 'Wrong username or password.' });
}
req.session.userId = found.id;
req.session.flash = { type: 'ok', text: 'You are logged in.' };
res.redirect('/');
}); 50
router.post('/logout', (req, res) => {
req.session.destroy(() => res.redirect('/'));
}); 54
// Public profile: reviews, lists and reading stats of one user
router.get('/u/:username', (req, res, next) => {
const profile = db.prepare('SELECT id, username, created_at FROM users WHERE username = ?').get(req.params.username);
if (!profile) return next(); 59
const reviews = db.prepare(`
SELECT r.*, b.title, b.id AS book_id FROM reviews r
JOIN books b ON b.id = r.book_id
WHERE r.user_id = ? ORDER BY r.created_at DESC`).all(profile.id);
const lists = db.prepare(`
SELECT l.*, (SELECT COUNT(*) FROM list_books lb WHERE lb.list_id = l.id) AS book_count
FROM lists l WHERE l.user_id = ? ORDER BY l.created_at DESC`).all(profile.id);
const finished = db.prepare("SELECT COUNT(*) AS n FROM progress WHERE user_id = ? AND status = 'finished'").get(profile.id).n; 68
res.render('profile', { title: profile.username, profile, reviews, lists, finished });
}); 71
module.exports = router;
