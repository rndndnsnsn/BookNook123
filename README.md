# BookNook - Book Discovery Community
BookNook is a website where readers discover books, write reviews, build reading lists
and track their reading progress. It was made as a web development course project.
**Author:** Keida Marku, Epoka University
## Features
| Feature | What you can do |
|---|---|
| User accounts | Register, log in, log out, public profile page for every user |
| Book reviews | Rate a book from 1 to 5 stars and write a review. Edit or delete your own review |
| Reading lists | Create lists such as "Books for summer", add and remove books, browse lists from other users |
| Author profiles | Page for each author with a short bio and all of their books |
| Reading progress tracker | Mark a book as *want to read*, *reading* or *finished*, save the page you are on and see a progress bar |
| Discovery | Search by title or author, filter by genre, see top rated books on the home page |
| Add books | Logged-in users can add books (and new authors) to the community |
## Technologies
- **Node.js + Express** - the web server and routes
- **SQLite** (`better-sqlite3`) - the database, stored in one file
- **EJS** - HTML templates rendered on the server
- **bcryptjs** - password hashing
- **express-session** - keeps users logged in
- Plain **HTML and CSS**, almost no JavaScript in the browser
## How to run
You need [Node.js](https://nodejs.org) version 18 or newer.
```bash
git clone <your-repository-url>
cd booknook
npm install
npm start
```
Open http://localhost:3000 in your browser.
The first time the server starts it creates the database and fills it with sample books and authors.
You can log in with the demo account:
- username: `demo`
- password: `demo123`
Or create your own account on the *Join* page.
## Project structure
```
booknook/
├── server.js           Starts the app, sets up sessions and connects the routes
├── db.js               Opens the database and creates the tables
├── seed.js             Sample data (authors, books, demo user)
├── middleware.js       requireLogin: blocks pages for users who are not logged in
├── routes/
│   ├── auth.js         Register, login, logout, user profile
│   ├── books.js        Browse, search, book page, add book, reviews
│   ├── authors.js      Author list and author profile
│   ├── lists.js        Reading lists
│   └── progress.js     Reading progress tracker
├── views/              EJS pages (+ partials/ for header, footer, book cover and book card)
└── public/style.css    All the styling
```
## Database design
```
users ──< reviews >── books >── authors
│                     │
├──< lists ──< list_books >──┘
└──< progress >───────┘
```
- `users` - username, email, password hash
- `authors` - name, bio, birth year, country
- `books` - title, genre, pages, year, description, author
- `reviews` - rating (1-5) and text. A `UNIQUE(book_id, user_id)` rule allows one review per user per book
- `lists` and `list_books` - a many-to-many relation between lists and books
- `progress` - status and current page for each user and book
## Security notes
- Passwords are hashed with bcrypt, never stored as plain text.
- All SQL uses prepared statements (`?` placeholders), which prevents SQL injection.
- EJS escapes output with `<%= %>`, which prevents XSS from reviews and other user text.
- Users can only edit or delete their own reviews and lists (checked on the server).
- Set the `SESSION_SECRET` environment variable when running outside of development.
## Possible improvements
- CSRF protection for forms
- Book cover images and an edit page for books
- Following other users and a feed of their reviews
- Automated tests
