// routes/books.js - browse/search books, book page, add a book, write reviews.
const express = require('express');
const db = require('../db');
const { requireLogin } = require('../middleware');
const router = express.Router();
// Browse and search: /books?q=dune&genre=Mystery
router.get('/', (req, res) => {
const q = (req.query.q || '').trim();
const genre = req.query.genre || '';
const books = db.prepare(`
SELECT b.*, a.name AS author_name, ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(r.id) AS review_count
FROM books b
JOIN authors a ON a.id = b.author_id
LEFT JOIN reviews r ON r.book_id = b.id
WHERE (b.title LIKE ? OR a.name LIKE ?) AND (? = '' OR b.genre = ?)
GROUP BY b.id
ORDER BY b.title`).all(`%${q}%`, `%${q}%`, genre, genre);
const genres = db.prepare('SELECT DISTINCT genre FROM books ORDER BY genre').all();
res.render('books', { title: 'Books', books, genres, q, genre });
});
// This must come BEFORE /:id, otherwise "new" would be read as an id
router.get('/new', requireLogin, (req, res) => {
const authors = db.prepare('SELECT name FROM authors ORDER BY name').all();
res.render('book-new', { title: 'Add a book', authors, errors: [], form: {} });
});
router.post('/', requireLogin, (req, res) => {
const { title, author, genre, pages, year, description, author_bio } = req.body;
const errors = [];
if (!title || !title.trim()) errors.push('Title is required.');
if (!author || !author.trim()) errors.push('Author is required.');
if (!genre || !genre.trim()) errors.push('Genre is required.');
if (!(parseInt(pages) > 0)) errors.push('Pages must be a number above 0.');
if (errors.length > 0) {
const authors = db.prepare('SELECT name FROM authors ORDER BY name').all();
return res.status(400).render('book-new', { title: 'Add a book', authors, errors, form: req.body });
}
// Use the author if they already exist, otherwise create them
let found = db.prepare('SELECT id FROM authors WHERE name = ? COLLATE NOCASE').get(author.trim());
const authorId = found
? found.id
: db.prepare('INSERT INTO authors (name, bio) VALUES (?, ?)').run(author.trim(), (author_bio || '').trim()).lastInsertRowid;
const info = db.prepare(`INSERT INTO books (title, author_id, genre, pages, year, description, added_by)
VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
title.trim(), authorId, genre.trim(), parseInt(pages), parseInt(year) || null, (description || '').trim(), req.session.userId);
req.session.flash = { type: 'ok', text: 'Book added.' };
res.redirect('/books/' + info.lastInsertRowid);
});
// Single book page
router.get('/:id', (req, res, next) => {
const book = db.prepare(`
SELECT b.*, a.name AS author_name, ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(r.id) AS review_count
FROM books b
JOIN authors a ON a.id = b.author_id
LEFT JOIN reviews r ON r.book_id = b.id
WHERE b.id = ? GROUP BY b.id`).get(req.params.id);
if (!book) return next();
const reviews = db.prepare(`
SELECT r.*, u.username FROM reviews r JOIN users u ON u.id = r.user_id
WHERE r.book_id = ? ORDER BY r.created_at DESC`).all(book.id);
let myReview = null, myProgress = null, myLists = [];
if (req.session.userId) {
const uid = req.session.userId;
myReview = db.prepare('SELECT * FROM reviews WHERE book_id = ? AND user_id = ?').get(book.id, uid);
myProgress = db.prepare('SELECT * FROM progress WHERE book_id = ? AND user_id = ?').get(book.id, uid);
myLists = db.prepare('SELECT * FROM lists WHERE user_id = ? ORDER BY title').all(uid);
}
res.render('book', { title: book.title, book, reviews, myReview, myProgress, myLists });
});
// Write a review (or update your own: one review per user per book)
router.post('/:id/review', requireLogin, (req, res) => {
const rating = parseInt(req.body.rating);
const text = (req.body.text || '').trim();
if (!(rating >= 1 && rating <= 5)) {
req.session.flash = { type: 'error', text: 'Choose a rating from 1 to 5.' };
return res.redirect('/books/' + req.params.id);
}
db.prepare(`
INSERT INTO reviews (book_id, user_id, rating, text) VALUES (?, ?, ?, ?)
ON CONFLICT (book_id, user_id) DO UPDATE SET rating = excluded.rating, text = excluded.text`)
.run(req.params.id, req.session.userId, rating, text);
req.session.flash = { type: 'ok', text: 'Your review is saved.' };
res.redirect('/books/' + req.params.id);
});
// Delete your own review
router.post('/:id/review/delete', requireLogin, (req, res) => {
db.prepare('DELETE FROM reviews WHERE book_id = ? AND user_id = ?').run(req.params.id, req.session.userId);
req.session.flash = { type: 'ok', text: 'Review deleted.' };
res.redirect('/books/' + req.params.id);
});
module.exports = router;
