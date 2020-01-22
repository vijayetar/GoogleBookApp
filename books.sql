DROP TABLE IF EXISTS book_table;

CREATE TABLE book_table (
    id SERIAL PRIMARY KEY NOT NULL, 
    author VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(30) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
)
