"use strict";

const fs = require('fs');
const Sqlite = require('better-sqlite3');

let db = new Sqlite('db.sqlite');


db.prepare('DROP TABLE IF EXISTS user').run();
db.prepare('DROP TABLE IF EXISTS favorite').run();
db.prepare('CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT)').run();
db.prepare('CREATE TABLE favorite (idAccount INTEGER, idMovie INTEGER , pathIMG TEXT)').run();