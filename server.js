"use strict";

let express = require('express');
let mustache = require('mustache-express');

let model = require('./model');
let app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

const cookieSession = require('cookie-session');
app.use(cookieSession({
    secret: 'mot-de-passe-du-cookie',
}));

app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', './views');


app.get('/', (req, res) => {
    res.render('search');
});

app.listen(3000, () => console.log('listening on http://localhost:3000'));
