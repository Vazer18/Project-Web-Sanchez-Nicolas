"use strict";

/* Module de recherche dans une base de recettes de cuisine */
const Sqlite = require('better-sqlite3');
const cross_fetch = require("cross-fetch");
const e = require("express");
const {response} = require("express");

let db = new Sqlite('db.sqlite');

let apiKey = "1e976b5a411fe60b504a811adb4817ee";


exports.login = function (user,password){
    let result = db.prepare('SELECT id FROM user WHERE name = ? AND password = ?').get(user,password);
    if (result === undefined) return -1;
    return result.id
}

exports.sign_up = function (user, password){
    let result = db.prepare('INSERT INTO user (name,password) VALUES (?,?)').run(user,password);
    return result.lastInserRowId;
}

exports.getDetailAccount = function (id){
    return db.prepare('SELECT name FROM user WHERE id = ?').get(id);
}

async function search(query,page){
    let resul = {result : [] ,nbrpage : null ,actuPage : null, nextPage : null,query : null , id : null};
    let url="https://api.themoviedb.org/3/search/movie?api_key="+apiKey+"&language=en-US&query="+query+"&page="+ page +"&include_adult=false"
    return cross_fetch.fetch(url).then(function (response) {
        return response.json()
    }).then(function (text) {
        resul.result=text['results'];
        resul.actuPage=text['page'];
        resul.nbrPage=text['total_pages'];
        resul.nextPage=resul.actuPage+1;
        resul.query = query;
        return resul;
    })

}

async function searchMovie(id){
    let url = "https://api.themoviedb.org/3/movie/"+id +"?api_key="+apiKey+"&language=en-US";
    let urlProvider = "https://api.themoviedb.org/3/movie/"+ id +"/watch/providers?api_key=" + apiKey;
    return cross_fetch.fetch(url).then(function (response) {
        return response.json()
    }).then(function (text) {
            let provider = fetchProvider(id);
            let time = text['runtime'];
            let h = Math.trunc(parseInt(time)/60);
            let min = parseInt(time) % 60;
                return {
                    img: text['poster_path'],
                    titre: text['original_title'],
                    resume: text['overview'],
                    rate: text['popularity'],
                    genre: text['genres'],
                    release: text['release_date'],
                    time: h + "h" + min + "m",
                    available: provider
                };
        })
}

async function fetchProvider(id){
    let urlProvider = "https://api.themoviedb.org/3/movie/"+ id +"/watch/providers?api_key=" + apiKey;
    return cross_fetch.fetch(urlProvider).then(function (response) {
        if (response.status >= 200 && response.status <= 299) {
            return response.json();
        } else {
            throw Error(response.statusText);
        }
    }).then(function (text2){
        return {available: text2['results']['US']['flatrate']
        };
    }).catch((error) => {
        console.log(error);
    });


}


exports.searchMovie = searchMovie;
exports.search =search;

 function fetchNexPage(query){

}
