// routes/lists.js - reading lists that users create and share.
const express = require('express');
const db = require('../db');
const { requireLogin } = require('../middleware');
const router = express.Router();
router.get('/', (req, res) => {
const lists = db.prepare(`
SELECT l.*, u.username, (SELECT COUNT(*) FROM list_books lb WHERE lb.list_id = l.id) AS book_count
FROM lists l JOIN users u ON u.id = l.user_id
ORDER BY l.created_at DESC, l.id DESC`).all();
res.render('lists', { title: 'Reading lists', lists });
});
router.get('/new', requireLogin, (req, res) => {
res.render('list-new', { title: 'New list', error: null, form: {} });
});
router.post('/', requireLogin, (req, res) => {
const title = (req.body.title || '').trim();
if (!title) {
return res.status(400).render('list-new', { title: 'New list', error: 'Give your list a title.', form: req.body });
}
const info = db.prepare('INSERT INTO lists (user_id, title, description) VALUES (?, ?, ?)')
.run(req.session.userId, title, (req.body.description || '').trim());
res.redirect('/lists/' + info.lastInsertRowid);
});
router.get('/:id', (req, res, next) => {
const list = db.prepare(`
SELECT l.*, u.username FROM lists l JOIN users u ON u.id = l.user_id WHERE l.id = ?`).get(req.params.id);
if (!list) return next();
const books = db.prepare(`
SELECT b.*, a.name AS author_name FROM list_books lb
JOIN books b ON b.id = lb.book_id
JOIN authors a ON a.id = b.author_id
WHERE lb.list_id = ? ORDER BY b.title`).all(list.id);
const isOwner = req.session.userId === list.user_id;
res.render('list', { title: list.title, list, books, isOwner });
});
// Add a book to one of your lists
router.post('/add-book', requireLogin, (req, res) => {
const list = db.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').get(req.body.list_id, req.session.userId);
if (!list) return res.status(403).send('You can only change your own lists.');
db.prepare('INSERT OR IGNORE INTO list_books (list_id, book_id) VALUES (?, ?)').run(list.id, req.body.book_id);
req.session.flash = { type: 'ok', text: `Added to "${list.title}".` };
res.redirect(req.get('Referer') || '/lists/' + list.id);
});
router.post('/:id/remove', requireLogin, (req, res) => {
const list = db.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);
if (!list) return res.status(403).send('You can only change your own lists.');
db.prepare('DELETE FROM list_books WHERE list_id = ? AND book_id = ?').run(list.id, req.body.book_id);
res.redirect('/lists/' + list.id);
});
router.post('/:id/delete', requireLogin, (req, res) => {
db.prepare('DELETE FROM lists WHERE id = ? AND user_id = ?').run(req.params.id, req.session.userId);
req.session.flash = { type: 'ok', text: 'List deleted.' };
res.redirect('/lists');
});
module.exports = router;
