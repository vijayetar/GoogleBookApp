DROP TABLE IF EXISTS book_table;

CREATE TABLE IF NOT EXISTS book_table (
    id SERIAL PRIMARY KEY, 
    title VARCHAR(255),
    authors VARCHAR(255),
    image_url VARCHAR(255),
    descript VARCHAR,
    bookshelf VARCHAR(255)
);

INSERT INTO book_table (authors, title, image_url, descript, bookshelf) VALUES ('Vij', 'Vij', 'Vij', 'vij', 'vijjjjj');