"use strict";

const Sqlite = require('better-sqlite3');
const cross_fetch = require("cross-fetch");

let db = new Sqlite('db.sqlite');

let apiKey = "1e976b5a411fe60b504a811adb4817ee";
let result ;

exports.login = function (user,password){
    let result = db.prepare('SELECT id FROM user WHERE name = ? AND password = ?').get(user,password);
    if (result === undefined) return -1;
    return result.id;
}

exports.sign_up = function (user, password){
    let result = db.prepare('INSERT INTO user (name,password) VALUES (?,?)').run(user,password);
    return result.lastInserRowId;
}

// récupérer les information du compte
exports.getDetailAccount = function (id){
    return {
        name : db.prepare('SELECT name FROM user WHERE id = ?').get(id).name,
        favorite :  db.prepare('SELECT * FROM favorite WHERE idAccount = ?').all(id),
    };
}

//check si le film est dans la table des favoris par apport a l'user id
function isFavorite(idMovie,userid){
    let result = db.prepare('SELECT * FROM favorite WHERE idAccount = ? AND idMovie = ?').get(userid,idMovie);
    if (result === undefined) return -1;
}

//set favorie si il n'est pas dans la table Favorite sinon le supprimme
exports.setFavorite = function (idMovie,userid,imgPath){
    if (isFavorite(idMovie,userid)===-1){
        db.prepare('INSERT INTO favorite (idAccount,idMovie,pathIMG) VALUES(?,?,?)').run(userid,idMovie,imgPath);
    }else {
        db.prepare('DELETE FROM favorite WHERE idAccount = ? AND idMovie = ?').run(userid,idMovie);
    }
}

//recherche de tout les film par le nom et page "Popular" permet de chercher les film populaire
async function search(query,page,CHOISE){
    let url;
    if (CHOISE==="Popular") {
         url = "https://api.themoviedb.org/3/movie/popular?api_key=" + apiKey + "&language=fr-FR&page=" + page;
    }else {
         url = "https://api.themoviedb.org/3/search/movie?api_key=" + apiKey + "&language=fr-FR&query=" + query + "&page=" + page + "&include_adult=false"
    }
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

    //Recherche les film par apport a une list d'id de provider que l'utilisateur posséde
async function searchMovieByProvider(query,provider){
    let found = await search(query,1),
    result = [];
    for (let i=0;i<found['result'].length;i++){
        let url = "https://api.themoviedb.org/3/movie/"+found['result'][i]['id']  +"/watch/providers?api_key=" + apiKey;
        let lala = await cross_fetch.fetch(url).then(function (response){
            if (response.status >= 200 && response.status <= 299) {
                return response.json();
            } else {
                throw Error(response.statusText);
            }
        }).then(function (text) {
            if (provider.includes(text['results']['US']['flatrate'][0]['provider_id'])){
                return {
                    id: found['result'][i]['id'],
                    title: found['result'][i]['original_title'],
                    poster_path:found['result'][i]['poster_path'],
                };}
        }).catch((onerror) =>{
        })
        if (lala !== undefined) {
            result.push(lala);
        }
    }
    return result;
}



//detail du film grace a son id
async function searchMovie(id){
    let url = "https://api.themoviedb.org/3/movie/"+id +"?api_key="+apiKey+"&language=fr-FR&watch_region=FR";
    let urlProvider = "https://api.themoviedb.org/3/movie/"+ id +"/watch/providers?api_key=" + apiKey;
    return cross_fetch.fetch(url).then(function (response) {
        return response.json();
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
                titre: text['title'],
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
                titre: text['title'],
                resume: text['overview'],
                rate: text['popularity'],
                genre: text['genres'],
                release: text['release_date'],
                time: h + "h" + min + "m",};
        });
        })
}

//recherche tout les Site de streaming disponnible
async function searchProviderAvailable(){
    let url ="https://api.themoviedb.org/3/watch/providers/movie?api_key=1e976b5a411fe60b504a811adb4817ee&language=fr-FR&watch_region=FR"

    return cross_fetch.fetch(url).then(function (response) {
        return response.json()
    }).then(function (text) {
        return {
            result:text['results']
    };
    })
}

//check si le site de streaming est dans la table des provider par apport a l'user id
 function isProvider(id,userid){
    let result = db.prepare('SELECT * FROM provider WHERE idAccount= ? AND idProvider = ?').get(userid,id);
    if (result === undefined) return -1;
}

//set provider si il n'est pas dans la table provider sinon le supprimme
exports.setProvider= function (id,userid){
    if (isProvider(id,userid)===-1){
        db.prepare('INSERT INTO provider (idAccount,idProvider) VALUES(?,?)').run(userid,id);
    }else {
        db.prepare('DELETE FROM provider WHERE idAccount = ? AND idProvider = ?').run(userid,id);
    }
}

//Recupere les id des Site de Streaming possédé
exports.getProvider= function (userid){
    let result = db.prepare('SELECT idProvider FROM provider WHERE  idAccount= ?').all(userid);
    if (result === undefined) return -1;
    let arrayresult = []

    for (let i=0 ; i<result.length;i++){
        arrayresult.push(result[i].idProvider);
    }
    return arrayresult;
}


exports.searchMovie = searchMovie;
exports.search = search;
exports.isFavorite = isFavorite;
exports.isProvider = isProvider;
exports.searchMovieByProvider = searchMovieByProvider;
exports.searchProviderAvailable = searchProviderAvailable;


