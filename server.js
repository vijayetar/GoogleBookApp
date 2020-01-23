'use strict';

const express= require('express');
require('dotenv').config();
const PORT = process.env.PORT||3001;
require('ejs');
const superagent = require('superagent');
// const methodOverride = require('method-override');

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

const app = express();

//connecting public
app.use(express.static('./public'));
// app.use((methodOverride('_method')));

//set up the view engine
app.set('view engine', 'ejs');

//bodyParser
app.use(express.urlencoded({extended:true}));

//routes
// app.get('/', getHomePage);
app.get('/', showFavBooks);
app.get('/searches/new', displaySearch);
app.post('/searches/new', collectBookSearchData);
app.get('/books/details/:id' , findDetails);
app.post('/books', addBookToDb);
app.post('/details/:id', showDetails);
app.use('*', notFoundHandler);
app.use(errorHandler);

//functions
// function getHomePage(request,response){
//   response.status(200).render('./pages/index');
// }

function findDetails(request, response) {
  //go into db and find book with unique id
  let SQL = 'SELECT * FROM book_table WHERE id=$1;';
  let values = [request.params.id];

  //render to page details.ejs
  return client.query(SQL, values)
    .then((results) => {
      response.render('pages/books/details', {results: results.rows[0]});
    })
    .catch(() => {
      errorHandler ('can find details here!', request, response);
    });
}


function displaySearch(request, response) {
  response.status(200).render('./pages/searches/new.ejs');
}

function collectBookSearchData (request, response){
  // console.log(request.body)

  let searchWord = request.body.search[0];
  let searchType = request.body.search[1];

  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  if (searchType === 'title'){
    url += `+intitle:${searchWord}`;
    // console.log(url)
  } else {
    url += `+inauthor:${searchWord}`;
    // console.log(url)
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
  response.status(200).render('./pages/books/details.ejs');
}

function addBookToDb(request, response) {
  let authors = request.body.authors;
  let title = request.body.title;
  let image_url = request.body.image_url;
  let descript = request.body.descript;

  console.log('this is request.body', request.body);

  let SQL = 'INSERT INTO book_table (authors, title, image_url, descript) VALUES ($1, $2, $3, $4) RETURNING id;';

  let safeValues = [authors, title, image_url, descript];


  return client.query(SQL, safeValues)
    .then(result => response.redirect(`/books/details/${result.rows[0].id}`))
    .catch(() => {
      errorHandler ('So sorry outside handler here', request, response);
    });
}

//////RENDER SAVED BOOKS /////
function showFavBooks (request, response){
  let sql3 = 'SELECT * FROM book_table;';
  client.query(sql3)
    .then(results => {
      console.log('these are the results', results.rows);
      response.render('pages/index', {results: results.rows});
      // response.status(200).send('/', results.rows);
    })
    .catch(() => {
      errorHandler ('So sorry saved books handler here', request, response);
    });
}

// .then((results)=> {
//   let SQL2 = 'SELECT * FROM book_table WHERE id=$1;';
//   let safeValues2 = [request.body.id];
//   // console.log('we are inside the .then of the client query', 'results:', results.rows, 'request:', request.body.id);

//   return client.query(SQL2, safeValues2)
//   .then(console.log('we are inside the .then of the client query', 'results:', results.rows, 'request:', request.body.id))
//   // .then(result => response.redirect(`/books/${result.rows[0].id}`))
//   // .then(console.log(`${result.rows[0]}`))
//   .catch(() => {
//     errorHandler ('So sorry deeper handler here', request, response);
//   })
// })




//========== from class on Jan 22nd===
// function updateTask(req,res){
//   collecct the info from the fomr for details views
//   update the DATABAS
//   redirect to detail page with new info
//====== code===
//   let {author, title, isbn, image_url, descript} = request.body;
//   let SQL = `UPDATE book_table SET author=$1 title=$2 isbn=$3 image_url=$4 descript=$5;`
// let values = [author, title, isbn, image_url, descript, request.params.id];
// client.query(SQL,values)
// .then (response, redirect (`/tasks/${request.params.id}`))

// }

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
  response.status(500).send(error);
}

client.connect()
  .then(() => {
    app.listen(PORT, ()=> (console.log(`Ally,Vij and Cait are chatting on ${PORT}`)));
  })
  .catch(err => console.log('we have problem Houston', err));
