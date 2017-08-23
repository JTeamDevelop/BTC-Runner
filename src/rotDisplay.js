define(function(require) {
  var ROT = require('rot')
    , Chance = require('chance')
    , d3 = require("d3");

  var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  function makeSeed(input) {
    var seedling = 0;
    if (Object.prototype.toString.call(input) === '[object String]') {
      for (var j = 0; j < input.length; j++) {
        // create a numeric hash for each argument, add to seedling
        var hash = 0;
        for (var k = 0; k < input.length; k++) {
          hash = input.charCodeAt(k) + (hash << 6) + (hash << 16) - hash;
        }
        seedling += hash;
      }
    } else {
      seedling = input;
    }
    return seedling;
  }

  return function(App) {
    //store for later use - changed for each map
    var chance = new Chance();
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
    //handle map class
    var Map = require("mapClass")(App);
    //setup movement 
    require('movement')(App);
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

      //pass seed and links
      makeCellular(mi, seed, links, stairs);
      //handle entry
      findEntry(App.map, from);
      //display map
      App.map.display();
    }

    function makeCellular(mi, seed, links, stairs, from) {
      chance = new Chance(seed);
      ROT.RNG.setSeed(makeSeed(seed));

      //size depends upon n of internal transactions and max value
      var TX = App.levelData[seed]
        , //area multiplier
      ax = TX.vals.length > 20 ? 20 : TX.vals.length;
      ax = TX.vals[0] > ax ? TX.vals[0] : ax,
      //treasure
      nT = 4 > Math.round(TX.vals.length + ax * 1.5) ? 4 : Math.round(TX.vals.length + ax * 1.5);
      //don't get too big
      ax = ax > 20 ? 20 : ax;
      //determine width - base area is 64*64
      var w = Math.round(Math.sqrt(64 * 64 * ax));

      /* create a connected map where the player can reach all non-wall sections */
      var map = new ROT.Map.Cellular(w,w,{
        connected: true
      })
      map._w = w;
      map._tx = seed;
      map._block = App.blockN;
      map._level = App.levelN;
      map._i = mi;
      map._pass = 1;
      map._nT = nT;

      /* cells with 1/2 probability */
      map.randomize(0.5);

      /* make a few generations */
      for (var i = 0; i < 4; i++)
        map.create();

      /* connect the maze */
      map.connect(function() {}, 1);

      //create position - for everything over the map 
      map._positions = {};
      //for the map display itself
      map._display = {};

      //handle exits
      exits(map, links);
      //handle stairs
      makeStairs(map, stairs);
      //place relic
      placeRelic(map, seed);

      //set map using class
      App.map = {};
      App.map = new Map(map);
    }

    //find a random open point
    function randomOpenPoint(map) {
      //random x location
      var x = chance.integer({
        min: 4,
        max: map._width - 5
      })
        , ya = [];
      //random y location possibilities
      map._map[x].forEach(function(el, i) {
        if (el == 1)
          ya.push(i);
      });
      //random y location
      var y = chance.pickone(ya);
      //return points
      return [x, y];
    }

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

    //find entry position and place unit there
    function findEntry(map, from) {
      //check if from is empty - use runner's data
      if (from.length == 0) {
        App.mainPC.move(App.mainPC.x, App.mainPC.y);
        return;
      }
      var d = null
        , a = []
        , //same level look for exits
      what = from[0] == map._level ? 'exit' : 'stair';
      //loop
      for (var x in map._display) {
        d = map._display[x];
        //check the from points against each other
        if (d[0] == what && from.join() == d[6].join()) {
          a.push(d);
        }
      }
      //randomly pick a point to enter
      var np = [].concat(chance.pickone(a));
      //check if exit - makesure to move out of exit to stop creation loop
      if (what == 'exit') {
        if (np[1] == 0) {
          np[1]++;
        }
        if (np[2] == 0) {
          np[2]++;
        }
        if (np[1] == map._width - 1) {
          np[1]--;
        }
        if (np[2] == map._height - 1) {
          np[2]--;
        }
      } else if (what == "stair") {
        if (map.passable(np[1] + 1, np[2])) {
          np[1]++;
        } else if (map.passable(np[1], np[2] + 1)) {
          np[2]++;
        } else if (map.passable(np[1] - 1, np[2])) {
          np[1]--;
        } else {
          np[2]--;
        }
      }
      //put the unit there
      App.mainPC.move(np[1], np[2]);
    }

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

    function exits(map, links) {
      var mapd = map._map
        , md = map._display;
      //collect map exit points- where map is open along the edges
      var r = {
        north: [[], []],
        south: [[], []],
        east: [[], []],
        west: [[], []]
      };

      /*
                d = direction
                j = 0 or 1 - first direction index or second
                i = current map index
                k = 0 or 1 - x or y coord
                p = point array
                */
      function exitBlock(d, j, i, k, p) {
        var MArr = r[d][j]
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
        if (mapd[i][0] == 1) {
          //track exit block - an array of points
          exitBlock('north', 0, i, 0, [i, 0]);
        }
        if (mapd[i][1] == 1) {
          //track exit block - an array of points
          exitBlock('north', 1, i, 0, [i, 1]);
        }
        //check south
        if (mapd[i][map._height - 1] == 1) {
          //track exit block - an array of points
          exitBlock('south', 0, i, 0, [i, map._height - 1]);
        }
        if (mapd[i][map._height - 2] == 1) {
          //track exit block - an array of points
          exitBlock('south', 1, i, 0, [i, map._height - 2]);
        }
      }

      for (i = 0; i < map._height; i++) {
        //check along west edge
        if (mapd[0][i] == 1) {
          //track exit block - an array of points
          exitBlock('west', 0, i, 1, [0, i]);
        }
        if (mapd[1][i] == 1) {
          //track exit block - an array of points
          exitBlock('west', 1, i, 1, [1, i]);
        }
        //check east
        if (mapd[map._width - 1][i] == 1) {
          //track exit block - an array of points
          exitBlock('east', 0, i, 1, [map._width - 1, i]);
        }
        if (mapd[map._width - 2][i] == 1) {
          //track exit block - an array of points
          exitBlock('east', 1, i, 1, [map._width - 2, i]);
        }
      }

      var e = chance.shuffle([].concat(r.north[0], r.south[0], r.east[0], r.west[0]))
        , ni = 0
        , nc = -1;

      //if there are not enough exits make another
      while (e.length < links.length) {
        //pick a direction
        var d = chance.pickone(['north', 'south', 'east', 'west']);
        ep = {
          north: [chance.integer({
            min: 4,
            max: map._w - 5
          }), 0],
          south: [chance.integer({
            min: 4,
            max: map._w - 5
          }), map._w - 1],
          east: [map._w - 1, chance.integer({
            min: 4,
            max: map._w - 5
          })],
          west: [0, chance.integer({
            min: 4,
            max: map._w - 5
          })],
        },
        np = {
          north: [0, -1],
          south: [0, 1],
          east: [1, 0],
          west: [-1, 0]
        }

        //push the exit
        e.push([ep[d]]);

        var next = 0
          , cp = ep[d];
        //link exit to open map
        while (next == 0) {
          //set the point to 1
          map._map[cp[0]][cp[1]] = 1;
          //get next
          cp = [cp[0] + np[d][0], cp[1] + np[d][1]];
          next = map._map[cp[0]][cp[1]];
        }
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

    return {
      changeMap: changeMap
    }

  }
})
