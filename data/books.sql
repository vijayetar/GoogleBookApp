DROP TABLE IF EXISTS book_table;

CREATE TABLE book_table (
    id SERIAL PRIMARY KEY, 
    title VARCHAR(255),
    authors VARCHAR(255),
    image_url VARCHAR(255),
    descript TEXT,
    bookshelf VARCHAR(255)
);
