// db.js - opens the SQLite database and creates the tables if they don't exist yet.
const Database = require('better-sqlite3');
const path = require('path'); 4
const db = new Database(path.join(__dirname, 'booknook.db'));
db.pragma('foreign_keys = ON'); // makes SQLite enforce FOREIGN KEY rules 7
db.exec(`
CREATE TABLE IF NOT EXISTS users (
id            INTEGER PRIMARY KEY AUTOINCREMENT,
username      TEXT NOT NULL UNIQUE,
email         TEXT NOT NULL UNIQUE,
password_hash TEXT NOT NULL,
created_at    TEXT DEFAULT CURRENT_TIMESTAMP
); 16
CREATE TABLE IF NOT EXISTS authors (
id      INTEGER PRIMARY KEY AUTOINCREMENT,
name    TEXT NOT NULL UNIQUE,
bio     TEXT,
born    INTEGER,
country TEXT
); 24
CREATE TABLE IF NOT EXISTS books (
id          INTEGER PRIMARY KEY AUTOINCREMENT,
title       TEXT NOT NULL,
author_id   INTEGER NOT NULL REFERENCES authors(id),
genre       TEXT NOT NULL,
description TEXT,
pages       INTEGER NOT NULL,
year        INTEGER,
added_by    INTEGER REFERENCES users(id)
); 35
-- One review per user per book (the UNIQUE line enforces that)
CREATE TABLE IF NOT EXISTS reviews (
id         INTEGER PRIMARY KEY AUTOINCREMENT,
book_id    INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
text       TEXT,
created_at TEXT DEFAULT CURRENT_TIMESTAMP,
UNIQUE (book_id, user_id)
); 46
CREATE TABLE IF NOT EXISTS lists (
id          INTEGER PRIMARY KEY AUTOINCREMENT,
user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
title       TEXT NOT NULL,
description TEXT,
created_at TEXT DEFAULT CURRENT_TIMESTAMP
); 54
-- Many-to-many: a list has many books, a book can be in many lists
CREATE TABLE IF NOT EXISTS list_books (
list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
PRIMARY KEY (list_id, book_id)
); 61
-- Reading tracker: status is want_to_read, reading or finished
CREATE TABLE IF NOT EXISTS progress (
id           INTEGER PRIMARY KEY AUTOINCREMENT,
user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
book_id      INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
status       TEXT NOT NULL DEFAULT 'want_to_read',
current_page INTEGER NOT NULL DEFAULT 0,
updated_at   TEXT DEFAULT CURRENT_TIMESTAMP,
UNIQUE (user_id, book_id)
);
`); 73
module.exports = db;
