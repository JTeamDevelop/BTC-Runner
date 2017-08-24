define(function(require) {
  var ROT = require('rot')
    , d3 = require("d3");

  var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  return function(App) {
    //display
    App.ROTDisplay = new ROT.Display({
      width: 0,
      height: 0,
      fontSize: 5
    });
    //get the container
    var ROTD = App.ROTDisplay.getContainer();
    //set id
    ROTD.id = 'rot-display';
    //append the new
    document.body.appendChild(ROTD);
    //update the click handler
    d3.select("#rot-display").on("click", function() {
      var point = d3.mouse(this);
    })
    //resize handler
    window.addEventListener("resize", function() {
      //check if display is active
      if (App.hasOwnProperty('map')) {
        //redraw
        App.map.display();
      }
    });

    //handle people geneation for map types
    var People = require("people");

    //handle map classes
    var caveMap = require("caveMap")(App)
      , dungeonMap = require("dungeonMap")(App);

    //setup movement 
    require('movement')(App);

    //////////////////////////////////////////////////////////////////////////////
    //change the map 
    function changeMap(mi, from) {
      var i = App.levelN - 1;
      //map seed
      var seed = App.levelTXN[i][mi];
      //find links
      var links = App.interLinks.filter(function(el) {
        return el[0] == mi || el[1] == mi;
      });
      //find stairs out of the maze
      var stairs = App.enter.filter(function(el) {
        return el[0] == i && el[1] == mi;
      });
      //if the enter has the index there is an entrance
      stairs = stairs.map(function(el) {
        return [0, 0];
      })
      //check level links for current map
      var start = i - 1 < 0 ? 0 : i - 1
        , stop = i == 99 ? 98 : i
        , k = 0
        , l = 0;

      for (var j = start; j <= stop; j++) {
        //index of array to filter 
        k = j == start ? 1 : 0;
        //index of array to pull
        l = j == start ? 0 : 1;
        App.levelLinks[j].filter(function(el) {
          return el[k] == mi;
        }).forEach(function(el) {
          stairs.push([j, el[l]])
        });
      }

      //set map to empty array to clear
      App.map = {};
      var TX = App.levelData[seed];

      if (TX.in.length > 0) {
        //input bitcoin address defines people and map type
        var mapType = People.structureType(TX.in[0]);
        if (mapType == "dungeon") {
          App.map = new dungeonMap(seed,mi);
        } else {
          App.map = new caveMap(seed,mi);
        }
      } else {
        App.map = new caveMap(seed,mi);
      }

      //handle exits
      exits(App.map, links);
      //handle stairs
      makeStairs(App.map, stairs);
      //place relic
      placeRelic(App.map, seed);
      //handle entry
      App.map.findEntry(from);

      //display map
      App.map.display();
    }
    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    //find a random open point
    function randomOpenPoint(map) {
      var chance = map.chance;
      //random x location
      var x = chance.integer({
        min: 4,
        max: map._width - 5
      })
        , ya = [];
      //random y location possibilities
      map._map[x].forEach(function(el, i) {
        if (el == map._pass)
          ya.push(i);
      });
      //random y location
      var y = chance.pickone(ya);
      //return points
      return [x, y];
    }

    //////////////////////////////////////////////////////////////////////////////

    //place the relic on the map
    function placeRelic(map) {
      //generate all points to keep chance RNG consistent
      var rp = d3.range(map._nT).map(function(d) {
        return randomOpenPoint(map);
      });

      function setItem(i) {
        var d = map._display
          , //get a point
        p = rp[i]
          , //id for display object
        id = p[0] + ',' + p[1]
          , what = i == 0 ? 'relic' : 'treasure';
        //set the location
        d[id] = [what, p[0], p[1], 'Ƀ', "gold", '', [map._tx, i]];
      }
      //find if the tx is claimed 
      //if not claimed 
      for (var i = 0; i < map._nT; i++) {
        //skip if claimed
        if (App.claimed.includes(i))
          continue;
        setItem(i);
      }
    }

    //////////////////////////////////////////////////////////////////////////////

    //make the staris to upper and lower levels
    function makeStairs(map, stairs) {
      var d = map._display;
      //points for each stair
      stairs.forEach(function(el) {
        var p = randomOpenPoint(map)
          , //id for display object
        id = p[0] + ',' + p[1];
        //set the star location
        d[id] = ['stair', p[0], p[1], '#', "#0f0", '', el]
      })

    }

    //////////////////////////////////////////////////////////////////////////////

    function createExits(map) {
      var chance = map.chance;
      //pick a direction
      var d = chance.pickone(['north', 'south', 'east', 'west']);
      ep = {
        north: [chance.integer({
          min: 10,
          max: map._w - 11
        }), 0],
        south: [chance.integer({
          min: 10,
          max: map._w - 11
        }), map._w - 1],
        east: [map._w - 1, chance.integer({
          min: 10,
          max: map._w - 11
        })],
        west: [0, chance.integer({
          min: 10,
          max: map._w - 11
        })],
      },
      np = {
        //go south - down - positive is down
        north: [0, 1],
        //go north - up - negative is up
        south: [0, -1],
        //go west - to left
        east: [-1, 0],
        west: [1, 0]
      }

      var next = map._pass == 0 ? 1 : 0
        , cp = ep[d];
      //link exit to open map
      while (next != map._pass) {
        //set the point to 1
        map._map[cp[0]][cp[1]] = map._pass;
        //get next
        cp = [cp[0] + np[d][0], cp[1] + np[d][1]];
        next = map._map[cp[0]][cp[1]];
      }

      return [ep[d]];
    }

    //////////////////////////////////////////////////////////////////////////////

    function exits(map, links) {
      var chance = map.chance
        , mapd = map._map
        , md = map._display;
      //collect map exit points- where map is open along the edges
      var r = {
        north: [],
        south: [],
        east: [],
        west: []
      };

      /*
                d = direction
                j = 0 or 1 - first direction index or second
                i = current map index
                k = 0 or 1 - x or y coord
                p = point array
                */
      function exitBlock(d, i, k, p) {
        var MArr = r[d]
          , arr = MArr.length == 0 ? [] : MArr[MArr.length - 1]
          , last = arr.length == 0 ? [-1, -1] : arr[arr.length - 1];

        if (i == last[k] + 1) {
          arr.push(p)
        } else {
          MArr.push([p]);
        }
      }

      for (var i = 0; i < map._width; i++) {
        //check along north edge
        if (mapd[i][0] == map._pass) {
          //track exit block - an array of points
          exitBlock('north', i, 0, [i, 0]);
        }
        //check south
        if (mapd[i][map._height - 1] == map._pass) {
          //track exit block - an array of points
          exitBlock('south', i, 0, [i, map._height - 1]);
        }
      }

      for (i = 0; i < map._height; i++) {
        //check along west edge
        if (mapd[0][i] == map._pass) {
          //track exit block - an array of points
          exitBlock('west', i, 1, [0, i]);
        }
        //check east
        if (mapd[map._width - 1][i] == map._pass) {
          //track exit block - an array of points
          exitBlock('east', i, 1, [map._width - 1, i]);
        }
      }

      var e = chance.shuffle([].concat(r.north, r.south, r.east, r.west))
        , ni = 0
        , nc = -1;

      //if there are not enough exits make another
      while (e.length < links.length) {
        e.push(createExits(map));
      }

      var to = -1;
      for (var i = 0; i < e.length; i++) {
        if (ni < links.length) {
          //determine the link to  
          to = links[ni][0] == map._i ? links[ni][1] : links[ni][0];
          //check visibility
          var char = App.visible.level.includes(to) ? b64[to] : ".";
          //push to position array
          e[i].forEach(function(el) {
            md[el[0] + ',' + el[1]] = ['exit', el[0], el[1], char, "#0f0", '', [map._level, to]];
          })
          ni++;
        } else {
          nc = chance.integer({
            min: 0,
            max: links.length - 1
          })
          //determine the link to  
          to = links[nc][0] == map._i ? links[nc][1] : links[nc][0];
          //check visibility
          var char = App.visible.level.includes(to) ? b64[to] : ".";
          //push to position array
          e[i].forEach(function(el) {
            md[el[0] + ',' + el[1]] = ['exit', el[0], el[1], char, "#0f0", '', [map._level, to]];
          })
        }

      }

      return r;
    }

    //////////////////////////////////////////////////////////////////////////////

    return {
      changeMap: changeMap
    }

  }
})
