define(function(require) {
  var ROT = require('rot')
    , Chance = require("chance");

    

  return function(App) {
    //handle map class
    var Map = require("mapClass")(App);

    class caveMap extends Map {
      constructor(seed, mi) {
        // Here, it calls the parent class' constructor 
        super(seed, mi);
        //seet ROT seed
        ROT.RNG.setSeed(this._nSeed);

        //passable vaules are 1
        this._pass = 1;

        /* create a connected map where the player can reach all non-wall sections */
        var map = new ROT.Map.Cellular(this._w,this._w,{
          connected: true
        })

        /* cells with 1/2 probability */
        map.randomize(0.5);

        /* make a few generations */
        for (var i = 0; i < 4; i++)
          map.create();

        /* connect the maze */
        map.connect(function() {}, 1);

        //Generation done - assign to the App.map
        Object.assign(this, map);
      }
    }

    return caveMap;

  }

})
