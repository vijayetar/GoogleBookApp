'use strict';

const express= require('express');
require('dotenv').config();
const PORT = process.env.PORT||3001;
require('ejs');
const superagent = require('superagent');

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

const app = express();

//connecting public
app.use(express.static('./public'));

//set up the view engine
app.set('view engine', 'ejs'); 

//bodyParser
app.use(express.urlencoded({extended:true}));

//routes
app.get('/', getHomePage);
app.get('/searches/new', displaySearch);
app.post('/searches/new', collectBookSearchData);
app.get('/books/:id' , showDetails);
app.post('/books' ,addBookToDb);
app.use('*', notFoundHandler);
app.use(errorHandler);

//functions
function getHomePage(request,response){
  response.status(200).render('./pages/index');
}

function displaySearch(request, response) {
  response.status(200).render('./pages/searches/new.ejs');
}

function collectBookSearchData (request, response){
  console.log(request.body)

  let searchWord = request.body.search[0];
  let searchType = request.body.search[1];

  let url = `https://www.googleapis.com/books/v1/volumes?q=`;

  if (searchType === 'title'){
    url += `+intitle:${searchWord}`;
    console.log(url)
  } else {
    url += `+inauthor:${searchWord}`;
    console.log(url)
  }

  superagent.get(url)
  .then(agentResults => {
    let bookArray = agentResults.body.items;
    const booksToRender = bookArray.map(book => new CreateBook(book.volumeInfo))
    response.status(200).render('pages/searches/show.ejs', {books: booksToRender})
  }) .catch(error => {
    console.log('this is the catch', error);
  })
}

function showDetails(request, response) {
  response.status(200).render('./pages/books/details.ejs');
}

function addBookToDb(booksToRender) {
  let {author, title, isbn, image_url, description} = request.body;
  let SQL = 'INSERT INTO book_table (author, title, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5);';
  let safeValues = [author, title, isbn, image_url, description];

  return client.query(SQL, safeValues)
    .then((selectedBook)=> {
      let SQL = 'SELECT * FROM book_table WHERE id=$1;';
      let safeValues = [id];

      return client.query(SQL, safeValues)
      .then(result => response.redirect('/books/${result.rows[0].id}'));
    })
}



// CONSTRUCTORS //

function CreateBook(bookData) {
  bookData.imageLinks !== undefined ? this.image_url = bookData.imageLinks.thumbnail.replace('http:', 'https:') : this.image_url = 'https://i.imgur.com/J5LVHEL.jpg';
  bookData.title !== undefined ? this.title = bookData.title : this.title = 'No title available';
  bookData.authors !== undefined ? this.authors = bookData.authors.join(', ') : this.authors = 'no authors available';
  bookData.description !== undefined ? this.description = bookData.description : this.description = 'no description';
  this.isbn = bookData.industryIdentifiers[1].identifier;
}



/////// ERROR FUNCTIONS /////////

function notFoundHandler(request, response){
  response.status(404).send('This route does not exist');
}

function errorHandler(error, request, response){
  console.log('Error', error);
  response.status(500).send(error);
}

// function constructArray(arr, constructor){
//   arr.map(obj => {
//     new constructor(obj);
//   })
// }


// title: 'UNKNOWN FACTS about HARRYPOTTER and HIS SPELLS',
// authors: [ 'peter potter' ],
// publishedDate: '2018-12-30',
// description: 'Collection of harry potter facts. This will surely satisfy the harry potter fans. This will gives a brief explanations of UNKNOWN FACTS ABOUT HARRYPOTTER & HIS SPELLS',
// industryIdentifiers: [
//   { type: 'ISBN_10', identifier: '1792905912' },
//   { type: 'ISBN_13', identifier: '9781792905919' }
// ],
// readingModes: { text: false, image: false },
// pageCount: 38,
// printType: 'BOOK',
// maturityRating: 'NOT_MATURE',
// allowAnonLogging: false,
// contentVersion: 'preview-1.0.0',
// panelizationSummary: { containsEpubBubbles: false, containsImageBubbles: false },
// language: 'en',
// previewLink: 'http://books.google.com/books?id=PfzkwgEACAAJ&dq=intitle:harrypotter&hl=&cd=1&source=gbs_api',
// infoLink: 'http://books.google.com/books?id=PfzkwgEACAAJ&dq=intitle:harrypotter&hl=&source=gbs_api',
// canonicalVolumeLink: 'https://books.google.com/books/about/UNKNOWN_FACTS_about_HARRYPOTTER_and_HIS.html?hl=&id=PfzkwgEACAAJ'



app.listen(PORT, ()=> (console.log(`Ally,Vij and Cait are chatting on ${PORT}`)));