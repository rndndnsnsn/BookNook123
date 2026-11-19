// seed.js - fills an empty database with sample authors, books and one demo user.
const bcrypt = require('bcryptjs');
module.exports = function seed(db) {
const count = db.prepare('SELECT COUNT(*) AS n FROM authors').get().n;
if (count > 0) return; // already has data
const authors = [
['Gabriel García Márquez', 'Colombian novelist who made magical realism famous. He won the Nobel Prize in Literature in 1982.', 1927, 'Colombia'],
['Ismail Kadare', 'Albania\'s best-known writer. His novels often use history and myth to talk about life under dictatorship.', 1936, 'Albania'],
['Jane Austen', 'English novelist who wrote sharp, funny stories about families, money and marriage in the early 1800s.', 1775, 'United Kingdom'],
['George Orwell', 'English writer and journalist. He wrote about power, propaganda and the truth.', 1903, 'United Kingdom'],
['Haruki Murakami', 'Japanese author known for quiet, dreamlike stories with music, cats and lonely narrators.', 1949, 'Japan'],
['Agatha Christie', 'The best-selling mystery writer of all time, creator of the detectives Poirot and Miss Marple.', 1890, 'United Kingdom'],
['Chimamanda Ngozi Adichie', 'Nigerian writer whose novels and essays explore identity, history and migration.', 1977, 'Nigeria'],
['Frank Herbert', 'American author who built the huge desert world of the Dune series.', 1920, 'United States'],
['Paulo Coelho', 'Brazilian author whose short, simple stories about following your dreams sold millions of copies.', 1947, 'Brazil'],
['Mary Shelley', 'English writer who created Frankenstein when she was only eighteen.', 1797, 'United Kingdom']
];
const addAuthor = db.prepare('INSERT INTO authors (name, bio, born, country) VALUES (?, ?, ?, ?)');
authors.forEach(a => addAuthor.run(...a));
// [title, author_id, genre, pages, year, description]
const books = [
['One Hundred Years of Solitude', 1, 'Magical realism', 417, 1967, 'The Buendía family builds a town called Macondo and lives through seven generations of love, war and strange miracles.'],
['Chronicle in Stone', 2, 'Historical fiction', 304, 1971, 'A boy describes his hometown of Gjirokastër as it is bombed and occupied during the Second World War.'],
['The General of the Dead Army', 2, 'Historical fiction', 240, 1963, 'An Italian general travels to Albania years after the war to find and bring home the bones of his fallen soldiers.'],
['Pride and Prejudice', 3, 'Classic', 432, 1813, 'Elizabeth Bennet and Mr Darcy must get past first impressions and family pressure before they can admit how they feel.'],
['Emma', 3, 'Classic', 474, 1815, 'A confident young woman loves matchmaking for her friends, and slowly finds out she misreads everyone, including herself.'],
['1984', 4, 'Dystopian', 328, 1949, 'Winston Smith lives in a country where the Party watches everyone and rewrites the past. He decides to rebel in secret.'],
['Animal Farm', 4, 'Dystopian', 112, 1945, 'The animals on a farm chase out their owner, but soon the pigs who lead them start acting just like him.'],
['Norwegian Wood', 5, 'Fiction', 296, 1987, 'Toru remembers his student days in Tokyo and his complicated bond with two very different women.'],
['Kafka on the Shore', 5, 'Fantasy', 467, 2002, 'A teenage runaway and an old man who can talk to cats follow two paths that slowly move toward each other.'],
['Murder on the Orient Express', 6, 'Mystery', 256, 1934, 'A snowed-in train, a dead passenger and twelve suspects. Detective Poirot has one night to find the killer.'],
['And Then There Were None', 6, 'Mystery', 272, 1939, 'Ten strangers are invited to an island and are killed one by one, following the lines of an old nursery rhyme.'],
['Half of a Yellow Sun', 7, 'Historical fiction', 433, 2006, 'Three people\'s lives are changed by the Nigerian civil war and the short life of the state of Biafra.'],
['Americanah', 7, 'Fiction', 477, 2013, 'Ifemelu leaves Nigeria for the United States and writes about race, while her first love waits for her at home.'],
['Dune', 8, 'Science fiction', 688, 1965, 'Paul Atreides moves to the desert planet Arrakis, the only source of the most valuable substance in the universe.'],
['The Alchemist', 9, 'Fiction', 208, 1988, 'A shepherd boy named Santiago travels from Spain to Egypt to find a treasure he saw in a dream.'],
['Frankenstein', 10, 'Gothic', 280, 1818, 'A young scientist brings a creature to life, then runs away from it, and has to face what he has done.']
];
const addBook = db.prepare('INSERT INTO books (title, author_id, genre, pages, year, description) VALUES (?, ?, ?, ?, ?, ?)');
books.forEach(b => addBook.run(b[0], b[1], b[2], b[3], b[4], b[5]));
// A demo account so the site is not empty on first run
const hash = bcrypt.hashSync('demo123', 10);
const demoId = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
.run('demo', 'demo@example.com', hash).lastInsertRowid;
const addReview = db.prepare('INSERT INTO reviews (book_id, user_id, rating, text) VALUES (?, ?, ?, ?)');
addReview.run(6, demoId, 5, 'Scary because it still feels possible. The ending stayed with me for days.');
addReview.run(4, demoId, 5, 'Funny, quick and full of great arguments. I reread the first chapter twice.');
addReview.run(14, demoId, 4, 'Slow at the start, but the world is huge. Worth it once the story gets going.');
addReview.run(2, demoId, 4, 'A small town seen through a child\'s eyes. Very good if you like Albanian history.');
const listId = db.prepare('INSERT INTO lists (user_id, title, description) VALUES (?, ?, ?)')
.run(demoId, 'Start here: classics', 'Books I would give to anyone who says they never read.').lastInsertRowid;
const addToList = db.prepare('INSERT INTO list_books (list_id, book_id) VALUES (?, ?)');
[4, 6, 7, 16].forEach(id => addToList.run(listId, id));
db.prepare('INSERT INTO progress (user_id, book_id, status, current_page) VALUES (?, ?, ?, ?)')
.run(demoId, 14, 'reading', 210);
};
