'use strict';

const express= require('express');
require('dotenv').config();
const PORT = process.env.PORT||3001;
require('ejs');
const superagent = require('superagent');
const methodOverride = require('method-override');

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

const app = express();

//connecting public
app.use(express.static('./public'));
app.use((methodOverride('_method')));

//set up the view engine
app.set('view engine', 'ejs');

//bodyParser
app.use(express.urlencoded({extended:true}));

////routes
app.get('/', showFavBooks);
app.get('/searches/new', displaySearch);
app.post('/searches/new', collectBookSearchData);
app.get('/books/:id', findDetails);
app.post('/books', addBookToDb);
app.post('/books/:id', showDetails);

/// update and delete
app.put('/update/:id', updateBook);
app.delete('/books/:id', deleteBook);

// error handlers routes
app.use('*', notFoundHandler);
app.use(errorHandler);

///// delete book from the database
function deleteBook (request,response){
  let SQL6 = `DELETE FROM book_table WHERE id=$1;`;
  let values = [request.params.id]

  client.query(SQL6, values)
  .then(response.redirect('/'))
  .catch(() => {
    errorHandler ('cannot delete request here!', request, response);
  });
}

///// update book in the database new code
function updateBook(request, response) {
    // // destructure variables
  let { title, descript, authors, bookshelf } = request.body;

  console.log('this is the bookshelf entered', request.body.bookshelf);

  let SQL7= `SELECT id FROM bookshelves WHERE name=$1;`;

  let valuesnow = [request.body.bookshelf];

  return client.query(SQL7, valuesnow)
    .then (results => {console.log('this is getting the results from bookshelves',results.rows[0].id);

      let sql8=`UPDATE book_table SET bookshelf_id=$1 WHERE title=$2;`;
      let valueshere = [results.rows[0].id, request.body.title];

      return client.query(sql8, valueshere)
      .then(response.redirect(`/`))
      .catch(err => console.error('this is inside the second update client query'))

    })
    .catch(err => console.error('inside first update function',err));

}

function findDetails(request, response) {
    let SQL = 'SELECT book_table.title, book_table.authors, book_table.image_url, book_table.descript,book_table.bookshelf_id, bookshelves.name FROM book_table FULL OUTER JOIN bookshelves ON book_table.bookshelf_id=bookshelves.id WHERE book_table.id=$1;';

  let values = [request.params.id];

  console.log('this is inside the find Details function', request.params.id);

  client.query(SQL, values)
    .then((results) => {
      console.log('this is results in findDetails function', results.rows[0]);
      response.render('./pages/books/details.ejs', {results: results.rows[0]});
    })
    .catch((err) => {
      console.error('cannot find details here!', err);
    });
}

function displaySearch(request, response) {
  response.status(200).render('./pages/searches/new.ejs');
}

function collectBookSearchData (request, response){

  let searchWord = request.body.search[0];
  let searchType = request.body.search[1];

  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  if (searchType === 'title'){
    url += `+intitle:${searchWord}`;
  } else {
    url += `+inauthor:${searchWord}`;
  }

  superagent.get(url)
    .then(agentResults => {
      let bookArray = agentResults.body.items;
      const booksToRender = bookArray.map(book => new CreateBook(book.volumeInfo));
      response.status(200).render('./pages/searches/show.ejs', {books: booksToRender});
    }) .catch(error => {
      console.error('this is the catch', error);
    });
}

function showDetails(request, response) {
  response.status(200).render('./pages/books/details.ejs');
}

function addBookToDb(request, response) {
  let title = request.body.title;
  let authors= request.body.authors;
  let image_url= request.body.image_url;
  let descript= request.body.descript;

  let SQL1= `SELECT * FROM book_table WHERE title=$1;`;
  let value = [title];

  return client.query(SQL1, value)
  .then(result=> {
    if (result.rows.length>0) {
      console.log('it exists already in the database');
      response.redirect(`/books/${result.rows[0].id}`);
    }
    else {
    let SQL2 = 'INSERT INTO book_table (authors, title, image_url, descript) VALUES ($1, $2, $3, $4) RETURNING id;';
    let safeValues = [authors, title, image_url, descript];
      return client.query(SQL2, safeValues)
        .then(result => response.redirect(`/books/${result.rows[0].id}`))
        .catch((error) => {
        console.error('this is inside the add to databse handler', error);
        });
    }
  })
  .catch((error) => {
    console.error('this is outside the add to databse handler', error);
  });
}

//////RENDER SAVED BOOKS /////
function showFavBooks (request, response){
  let sql3 = 'SELECT book_table.title, book_table.authors, book_table.image_url, book_table.descript,book_table.bookshelf_id, bookshelves.name FROM book_table FULL OUTER JOIN bookshelves ON book_table.bookshelf_id=bookshelves.id;';

  return client.query(sql3)
    .then(results => {
      console.log('these are results in the home page showFavBooks function', results.rows);
      response.render('./pages/index', {results: results.rows});
    })
    .catch(() => {
      errorHandler ('So sorry saved books handler here', request, response);
    });
}


// CONSTRUCTORS //

function CreateBook(bookData) {
  bookData.imageLinks !== undefined ? this.image_url = bookData.imageLinks.thumbnail.replace('http:', 'https:') : this.image_url = 'https://i.imgur.com/J5LVHEL.jpg';
  bookData.title !== undefined ? this.title = bookData.title : this.title = 'No title available';
  bookData.authors !== undefined ? this.authors = bookData.authors.join(', ') : this.authors = 'no authors available';
  bookData.description !== undefined ? this.descript = bookData.description : this.descript = 'no descript';
}



/////// ERROR FUNCTIONS /////////

function notFoundHandler(request, response){
  response.status(404).send('This route does not exist');
}

function errorHandler(error, request, response){
  console.log('Error', error);
  // response.status(500).send(error);
}

client.connect()
  .then(() => {
    app.listen(PORT, ()=> (console.log(`Ally,Vij and Cait are chatting on ${PORT}`)));
  })
  .catch(err => console.log('we have problem Houston', err));
