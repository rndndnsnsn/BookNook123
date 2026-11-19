// middleware.js - small helper that protects pages for logged-in users only.
function requireLogin(req, res, next) {
if (!req.session.userId) {
req.session.flash = { type: 'error', text: 'Please log in first.' };
return res.redirect('/login');
}
next();
}
module.exports = { requireLogin };
