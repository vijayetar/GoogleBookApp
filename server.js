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

function deleteBook (request,response){
  let SQL6 = `DELETE FROM book_table WHERE id=$1;`;
  let values = [request.params.id]

  client.query(SQL6, values)
  .then(response.redirect('/'))
  .catch(() => {
    errorHandler ('cannot delete request here!', request, response);
  });
}

function updateBook(request, response) {
  console.log(request.body);
  // destructure variables
  let { title, descript, authors, bookshelf } = request.body;
  let SQL4 = `UPDATE book_table SET title=$1, descript=$2, authors=$3, bookshelf_id=$4 WHERE id=$5;`;
  let valuesagain = [title, descript, authors, bookshelf, request.params.id];

  console.log(valuesagain);
  return client.query(SQL4, valuesagain)
    .then(response.redirect(`/books/${request.params.id}`))
    .catch((error) => {
      console.error(error);
    });
}



function findDetails(request, response) {
  //go into db and find book with unique id
  let SQL = 'SELECT * FROM book_table WHERE id=$1;';
  let values = [request.params.id];
  //render to page details.ejs
  return client.query(SQL, values)
    .then((results) => {
      response.render('./pages/books/details.ejs', {results: results.rows[0]});
    })
    .catch(() => {
      errorHandler ('cannot find details here!', request, response);
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
      response.status(200).render('pages/searches/show.ejs', {books: booksToRender});
    }) .catch(error => {
      console.log('this is the catch', error);
    });
}

function showDetails(request, response) {
    console.log('hi Vij, be patient');

  response.status(200).render('./pages/books/details.ejs');
}

function addBookToDb(request, response) {
  let authors = request.body.authors;
  let title = request.body.title;
  let image_url = request.body.image_url;
  let descript = request.body.descript;

  let SQL = 'INSERT INTO book_table (authors, title, image_url, descript) VALUES ($1, $2, $3, $4) RETURNING id;';

  let safeValues = [authors, title, image_url, descript];

  return client.query(SQL, safeValues)
    .then(result => response.redirect(`/books/${result.rows[0].id}`))
    .catch((error) => {
      // errorHandler ('So sorry outside handler here', request, response);
      console.error(error);
    });
}

//////RENDER SAVED BOOKS /////
function showFavBooks (request, response){
  let sql3 = 'SELECT * FROM book_table;';
  client.query(sql3)
    .then(results => {
      response.render('pages/index', {results: results.rows});
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
