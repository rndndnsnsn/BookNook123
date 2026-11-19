// routes/authors.js - list of authors and one author's profile.
const express = require('express');
const db = require('../db');
const router = express.Router();
router.get('/', (req, res) => {
const authors = db.prepare(`
SELECT a.*, COUNT(b.id) AS book_count
FROM authors a LEFT JOIN books b ON b.author_id = a.id
GROUP BY a.id ORDER BY a.name`).all();
res.render('authors', { title: 'Authors', authors });
});
router.get('/:id', (req, res, next) => {
const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id);
if (!author) return next();
const books = db.prepare(`
SELECT b.*, ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(r.id) AS review_count
FROM books b LEFT JOIN reviews r ON r.book_id = b.id
WHERE b.author_id = ? GROUP BY b.id ORDER BY b.year`).all(author.id);
res.render('author', { title: author.name, author, books });
});
module.exports = router;
