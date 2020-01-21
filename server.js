'use strict';

const express= require('express');
require('dotenv').config();
const PORT = process.env.PORT||3001;
require('ejs');
const superagent = require('superagent');

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
    console.log(booksToRender);
    response.status(200).send(booksToRender);
  }) .catch(error => {
    console.log('this is the catch', error);
  })

}
// CONSTRUCTORS //

function CreateBook(bookData) {
  this.title = bookData.title;
  this.authors = bookData.authors;
  this.description = bookData.description;
  this.publishedDate = bookData.publishedDate;
  this.infoLink = bookData.infoLink;
  // this.image = bookData.
}



/////// ERROR FUNCTIONS /////////

function notFoundHandler(){
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