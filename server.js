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
    secret: 'projetMovie',
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

app.get('/', (req, res) => {
    res.render('header');
});

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
    console.log(found)
    res.render('account',found);
});


app.get('/:page/search',async (req, res) => {
    let found = await model.search(req.query.query,req.params.page);
    res.render('search',found);
});

app.get('/movie/:id',async (req, res) => {
    let found = await model.searchMovie(req.params.id);
    if (model.isFavorite(req.params.id,req.session.user) ===-1){
        found['colorFavorite']="grey"
    }else {found['colorFavorite']="red"}
    res.render('movie',found);
});


app.post('/movies/favorite/:id/:imgPath',async (req, res) => {
    model.setFavorite(req.params.id , req.session.user , req.params.imgPath);
    res.redirect('/movie/'+req.params.id);
});

//cas ou il y a pas de lien vers l'image
app.post('/movies/favorite/:id',async (req, res) => {
    model.setFavorite(req.params.id , req.session.user , "null");
    res.redirect('/movie/'+req.params.id);
});

app.post('/back',async (req, res) => {
    res.redirect('back');
});


app.listen(3000, () => console.log('listening on http://localhost:3000'));
