define(function(require) {
  var ROT = require('rot')
    , d3 = require("d3")
    , Chance = require("chance");

  return function(App) {
    //handle map class
    var Map = require("mapClass")(App);

    class dungeonMap extends Map {
      constructor(seed,mi) {
        // Here, it calls the parent class' constructor 
        super(seed, mi);
        //seet ROT seed
        ROT.RNG.setSeed(this._nSeed);

        //passable vaules are 0
        this._pass = 0;

        /* create a connected map where the player can reach all non-wall sections */
        var map = new ROT.Map.Digger(this._w,this._w,{
          dugPercentage: 0.5,
          roomWidth: [4, 15],
          roomHeight: [4, 15],
          corridorLength: [0, 7]
        });
        
        //set data to empty array
        var n = this._w;
        var md = d3.range(n).map(function(d,i){
          return d3.range(n).map(function(e,j){ return 1; })
        })
        map.create(function(x, y, value) {
          md[x][y] = value;
        });

        map._map = md;  

        //Generation done - assign to the App.map
        Object.assign(this, map);
      }
    }

    return dungeonMap;

  }
})
