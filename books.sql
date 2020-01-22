DROP TABLE IF EXISTS book_table;

CREATE TABLE IF NOT EXISTS book_table (
    id SERIAL PRIMARY KEY, 
    author VARCHAR(255),
    title VARCHAR(255),
    isbn VARCHAR(30),
    image_url VARCHAR(255),
    description VARCHAR(255)
);

INSERT INTO book_table (author, title, isbn, image_url, description) VALUES ('Vij', 'Vij', 'Vij', 'vij', 'vijjjjj');