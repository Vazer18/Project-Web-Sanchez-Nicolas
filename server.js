"use strict";

let express = require('express');
let mustache = require('mustache-express');

let model = require('./model');
let app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', './views');
app.use('/static', express.static('public'));

const cookieSession = require('cookie-session');

app.use(cookieSession({
    secret: 'projetMovieProvider',
}));

app.use(function (req,res,next){
    if (req.session.user !==undefined){
        res.locals.authenticated = true;
        res.locals.name = req.session.name;
    }
    return next();
});

function is_authenticated(req,res,next){
    if (req.session.user !== undefined){
        return next();
    }
    res.redirect("/login");
}

app.get('/', async (req, res) => {
    let found = await model.search("",1,"Popular")
    res.render('index' ,found);
});

/************************************************
 ************ Route qui gere le compte ************
 *************************************************/

app.post('/login' , (req,res) =>{
    let user =model.login(req.body.user,req.body.password);
    if (user !==-1){
        req.session.user= user;
        req.session.name=req.body.user;
        res.redirect('/')
    }else {
        res.redirect('/login');
    }
});

app.get('/login',(req,res)=>{
   res.render('login')
});

app.post('/sign_up' , (req,res) =>{
    let user = model.sign_up(req.body.user,req.body.password);
    if (user !==-1){
        req.session.user= user;
        req.session.name=req.body.user;
        res.redirect('/')
    }else {
        res.redirect('/');
    }
});

app.get('/sign_up',(req,res)=>{
    res.render('sign_up')
});

app.get('/logout',(req,res)=>{
   req.session = null;
   res.redirect('/')
});

app.get('/account',is_authenticated,(req,res)=>{
    let found = model.getDetailAccount(req.session.user);
    res.render('account',found);
});

app.get('/selectProvider', is_authenticated,async (req,res)=>{
    let found = await model.searchProviderAvailable();

    for (let i =0 ; i<found.result.length;i++){

        if (model.isProvider(found.result[i]['provider_id'],req.session.user)!==-1 ){
            found.result[i]['isProvider'] = 'ProviderSelected'
        }else {
            found.result[i]['isProvider'] = 'ProviderNotSelected'
        }
    }

    res.render('ProviderChoise',found);
});

app.post('/selectedProvider/:id', is_authenticated,async (req,res)=>{
    model.setProvider(req.params.id,req.session.user);
    res.redirect('/selectProvider')
});

/************************************************************


/************************************************************
************ Route qui gere la recherche de film ************
************************************************************/

app.get('/:page/search',async (req, res) => {
    if (req.query.Provider === "on"){
        let found={
            found : null
        };
        let arrayProvider = model.getProvider(req.session.user);
        found.found=await model.searchMovieByProvider(req.query.query,arrayProvider);

        res.render('searchByProvider',found);
    }else {
        let found = await model.search(req.query.query, req.params.page);
        res.render('search', found);
    }

});

app.get('/:page/Popular', async (req, res) => {
    let found = await model.search("",req.params.page,"Popular");
    res.render('Popular' ,found);
});

app.get('/movie/:id',async (req, res) => {
    let found = await model.searchMovie(req.params.id);
    if (model.isFavorite(req.params.id,req.session.user) ===-1){
        found['colorFavorite']="#ddff99"
    }else {found['colorFavorite']="#ff704d"}
    res.render('movie',found);
});

app.post('/movies/favorite/:id/:imgPath',is_authenticated,async (req, res) => {
    model.setFavorite(req.params.id , req.session.user , req.params.imgPath);
    res.redirect('/movie/'+req.params.id);
});

//cas ou il y a pas de lien vers l'image
app.post('/movies/favorite/:id',is_authenticated,async (req, res) => {
    model.setFavorite(req.params.id , req.session.user , "null");
    res.redirect('/movie/'+req.params.id);
});

/*************************** *********************************/



app.post('/back',async (req, res) => {
    res.redirect('back');
});

app.listen(3000, () => console.log('listening on http://localhost:3000'));
