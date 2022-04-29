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
    return {
        name : db.prepare('SELECT name FROM user WHERE id = ?').get(id).name,
        favorite :  db.prepare('SELECT * FROM favorite WHERE idAccount = ?').all(id),
    };
}

function isFavorite(idMovie,userid){
    let result = db.prepare('SELECT * FROM favorite WHERE idAccount = ? AND idMovie = ?').get(userid,idMovie);
    if (result === undefined) return -1;
}



exports.setFavorite = function (idMovie,userid,imgPath){
    if (isFavorite(idMovie,userid)===-1){
        db.prepare('INSERT INTO favorite (idAccount,idMovie,pathIMG) VALUES(?,?,?)').run(userid,idMovie,imgPath);
    }else {
        db.prepare('DELETE FROM favorite WHERE idAccount = ? AND idMovie = ?').run(userid,idMovie);
    }
}



async function search(query,page){
    let url="https://api.themoviedb.org/3/search/movie?api_key="+apiKey+"&language=en-US&query="+query+"&page="+ page +"&include_adult=false"
    return cross_fetch.fetch(url).then(function (response) {
        return response.json()
    }).then(function (text) {
        let nextPage = parseInt(page)+1;
        let pagePrec = page-1;
        let nbrPage = text['total_pages'];
        if (nextPage > nbrPage){
            nextPage = nbrPage;
        }
        if (pagePrec < 1){
            pagePrec = 1
        }

        return {
            result:text['results'],
            actuPage:text['page'],
            nbrPage:text['total_pages'],
            nextPage:nextPage,
            pagePrec:pagePrec,
            query:query,}
    })

}

async function searchMovie(id){
    let url = "https://api.themoviedb.org/3/movie/"+id +"?api_key="+apiKey+"&language=en-US";
    let urlProvider = "https://api.themoviedb.org/3/movie/"+ id +"/watch/providers?api_key=" + apiKey;
    return cross_fetch.fetch(url).then(function (response) {
        return response.json()
    }).then(function (text) {
        return cross_fetch.fetch(urlProvider).then(function (response) {
            if (response.status >= 200 && response.status <= 299) {
                return response.json();
            } else {
                throw Error(response.statusText);
            }
        }).then(function (text2){
            let time = text['runtime'];
            let h = Math.trunc(parseInt(time)/60);
            let min = parseInt(time) % 60;
            return {
                id : id,
                img: text['poster_path'],
                titre: text['original_title'],
                resume: text['overview'],
                rate: text['popularity'],
                genre: text['genres'],
                release: text['release_date'],
                time: h + "h" + min + "m",
                available: text2['results']['US']['flatrate'][0]
            };
        }).catch((error) => {
            let time = text['runtime'];
            let h = Math.trunc(parseInt(time)/60);
            let min = parseInt(time) % 60;
            return {
                id : id,
                img: text['poster_path'],
                titre: text['original_title'],
                resume: text['overview'],
                rate: text['popularity'],
                genre: text['genres'],
                release: text['release_date'],
                time: h + "h" + min + "m",};
        });
        })
}




exports.searchMovie = searchMovie;
exports.search =search;
exports.isFavorite=isFavorite;

 function fetchNexPage(query){

}
