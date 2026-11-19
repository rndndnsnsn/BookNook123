// server.js - starts the web server and connects everything together.
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');
require('./seed')(db);
const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false })); // reads form data
app.use(express.static(path.join(__dirname, 'public'))); // serves css
app.use(session({
secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
resave: false,
saveUninitialized: false
}));
// Runs on every request: makes "user" and flash messages available in all views
app.use((req, res, next) => {
res.locals.user = req.session.userId
? db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.session.userId)
: null;
res.locals.flash = req.session.flash;
delete req.session.flash;
next();
});
// Helper functions that views can call
const COVER_COLORS = ['#2E4A62', '#7A2E3A', '#3B5B3A', '#5A3E6B', '#8A5A2B', '#1F5F66', '#4B4F73', '#6B3F2A'];
app.locals.coverColor = (title) => {
let sum = 0;
for (const ch of title) sum += ch.charCodeAt(0);
return COVER_COLORS[sum % COVER_COLORS.length];
};
app.locals.stars = (n) => {
const full = Math.round(n || 0);
return '★'.repeat(full) + '☆'.repeat(5 - full);
};
app.locals.statusLabels = { want_to_read: 'Want to read', reading: 'Reading', finished: 'Finished' };
// Pages
app.get('/', (req, res) => {
const topBooks = db.prepare(`
SELECT b.*, a.name AS author_name, ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(r.id) AS review_count
FROM books b
JOIN authors a ON a.id = b.author_id
LEFT JOIN reviews r ON r.book_id = b.id
GROUP BY b.id
ORDER BY avg_rating DESC, review_count DESC, b.title
LIMIT 8`).all();
const latestReviews = db.prepare(`
SELECT r.*, u.username, b.title, b.id AS book_id
FROM reviews r
JOIN users u ON u.id = r.user_id
JOIN books b ON b.id = r.book_id
ORDER BY r.created_at DESC, r.id DESC
LIMIT 4`).all();
res.render('home', { title: 'Home', topBooks, latestReviews });
});
app.use(require('./routes/auth'));
app.use('/books', require('./routes/books'));
app.use('/authors', require('./routes/authors'));
app.use('/lists', require('./routes/lists'));
app.use('/progress', require('./routes/progress'));
app.use((req, res) => res.status(404).render('404', { title: 'Not found' }));
app.listen(PORT, () => console.log(`BookNook running at http://localhost:${PORT}`));
