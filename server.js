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
// app.post('/searches/new', collectBookSearchData);

//functions
function getHomePage(request,response){
  response.status(200).render('./pages/index');
}
function displaySearch(request, response) {
  response.status(200).render('./pages/searches/new.ejs');
}

app.listen(PORT, ()=> (console.log(`Ally,Vij and Cait are chatting on ${PORT}`)));