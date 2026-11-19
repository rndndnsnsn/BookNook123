// routes/progress.js - the reading progress tracker (one row per user per book).
const express = require('express');
const db = require('../db');
const { requireLogin } = require('../middleware');
const router = express.Router();
router.get('/', requireLogin, (req, res) => {
const rows = db.prepare(`
SELECT p.*, b.title, b.pages, a.name AS author_name
FROM progress p
JOIN books b ON b.id = p.book_id
JOIN authors a ON a.id = b.author_id
WHERE p.user_id = ? ORDER BY p.updated_at DESC`).all(req.session.userId);
// Split into the three shelves shown on the page
const shelves = {
reading: rows.filter(r => r.status === 'reading'),
want_to_read: rows.filter(r => r.status === 'want_to_read'),
finished: rows.filter(r => r.status === 'finished')
};
res.render('progress', { title: 'My reading', shelves });
});
// Save status and page for a book
router.post('/', requireLogin, (req, res) => {
const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.body.book_id);
const status = req.body.status;
if (!book || !['want_to_read', 'reading', 'finished'].includes(status)) {
return res.status(400).send('Invalid data.');
}
// Keep the page number sensible for each status
let page = parseInt(req.body.current_page) || 0;
page = Math.max(0, Math.min(page, book.pages));
if (status === 'finished') page = book.pages;
if (status === 'want_to_read') page = 0;
db.prepare(`
INSERT INTO progress (user_id, book_id, status, current_page) VALUES (?, ?, ?, ?)
ON CONFLICT (user_id, book_id) DO UPDATE
SET status = excluded.status, current_page = excluded.current_page, updated_at = CURRENT_TIMESTAMP`)
.run(req.session.userId, book.id, status, page);
req.session.flash = { type: 'ok', text: 'Progress saved.' };
res.redirect(req.get('Referer') || '/progress');
});
router.post('/:bookId/delete', requireLogin, (req, res) => {
db.prepare('DELETE FROM progress WHERE user_id = ? AND book_id = ?').run(req.session.userId, req.params.bookId);
res.redirect('/progress');
});
module.exports = router;
