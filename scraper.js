var bb = require('bluebird');
var nightmare = require('nightmare');
var fs = require("fs");

var getNumPages = function(artist){
  var link = "http://www.paroles.net/"+artist.toLowerCase();
  var ng = nightmare({show: false});
  console.log("getting numpage from: "+link);
  return ng.goto(link)
    .evaluate(function(){
      var numPages = document.querySelector('.one-column').querySelectorAll('.pager-letter').length
      if(numPages<0){numPages=1}
      return numPages
    })
    .end()
    .then(function(n){
      console.log(String(n)+' page(s).')
      var out = []
      for (var i=1; i<=n; i++){
        out.push(i)
      }
      return out
    })
    .catch(console.log)
}

var getSongsPage=function(artist, page){
  var link = "http://www.paroles.net/"+artist.toLowerCase()+'-'+String(page);
  var ng = nightmare({show: false});
  console.log("getting song page from: "+link);
  return ng.goto(link)
    .evaluate(function(){
      var out = []
      var columns = document.querySelectorAll('.box-content')
      for (var i =0; i<columns.length; i++){
        var column = columns[i]
        var items =column.firstElementChild.firstElementChild.children
        for (var j=0; j<items.length; j++){
          var item = items[j]
          out.push(item.children[1].firstElementChild.firstElementChild.href)
        }
      }
      return out
    })
    .end()
    .catch(console.log)
}

var getSongs = function(artist){
  return getNumPages(artist)
    .then(pages=>bb.mapSeries(pages, x=> getSongsPage(artist, x)))
    .then(merge)
}


//testing function
// var checkLyrics=function(lyrics){
//   console.log(lyrics)
//   return lyrics;
// }

var getLyrics = function(link){
  console.log("getting lyrics from: "+link);
  var ng = nightmare({show: false});
  return ng.goto(link)
    .evaluate(function(){
      return document.querySelector(".song-text").innerText
    })
    .end()
    .then(x=>fs.appendFile(file, x+"\n\n"))
    // .then(checkLyrics)
    .catch(console.log)
}

var merge =function(arrarr){
  out = [];
  for (var arr in arrarr) {
    for (var el in arrarr[arr]){
      out.push(arrarr[arr][el]);
    }
  }
  return out;
}

var printStatus=function(songs){
  console.log(songs.length+" songs found.");
  return songs;
}


var artist = process.argv[2];
var file = "scrapedLyrics/"+artist.toLowerCase()+".txt"

getSongs(artist)
  .then(printStatus)
  .then(x=>bb.mapSeries(x, getLyrics))
  .catch(console.log)