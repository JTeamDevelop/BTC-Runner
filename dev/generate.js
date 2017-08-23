define(function(require) {
  var Chance = require("chance");

  return function(App) {
    //initializes a Chance generator for random needs later
    var chance = new Chance();
    //calculate the open blocks to run
    function openBlocks() {
      //check if needed 
      if (App.run[App.run.length - 1] > App.height + 500)
        return;
      //if needed create the RNG
      chance = new Chance("BTCDungeon");
      //clear App run
      App.run = [];
      //start the generation at 480000
      var last = 480000;

      while (last < App.height + 500) {
        //increment last
        last += chance.integer({
          min: 6,
          max: 35
        });
        //check if within 36 blocks and push to run
        if (last >= App.height - 36) {
          App.run.push(last);
        }
      }
      //compute relics remaining
      App.remaining();
    }

    function generateLevels() {
      return new Promise(function(resolve, reject) {
        //create chance based upon block # 
        chance = new Chance(App.blockN);
        //setup the 100 levels
        var levels = []
          , lc = [];
        for (var i = 0; i < 100; i++) {
          //push empty array for every level to store data
          levels.push([]);
          lc.push(i);
        }
        //pull from DB
        App.DB.getItem(App.blockN).then(function(B) {
          var li = 0
            , ac = B.tx.length / 100;
          //push transactions to dungeon levels
          //loop through the transactions
          for (i = 0; i < B.tx.length; i++) {
            li = Math.floor(i / ac);
            //equally distribute levels
            levels[li].push(B.tx[i]);
          }
          //display
          App.levelTXN = [];
          App.levelLinks = [];
          var links = []
            , cl = []
            , enter = [];
          levels.forEach(function(l, li) {
            //now generate links between levels 
            if (li != levels.length - 1) {
              cl = makeLevelLinks(li, l.length, levels[li + 1].length);
              //push to app
              App.levelLinks.push(cl);
              //check if first
            }
            App.levelTXN.push(l);
          })
          //make entrances
          makeEntrances();
          //resolve 
          resolve();
        })
      }
      )

    }

    //make the entrances for the mazes
    function makeEntrances() {
      //levels where entrances are
      var el = [0, chance.integer({
        min: 10,
        max: 20
      }), chance.integer({
        min: 30,
        max: 40
      }), chance.integer({
        min: 60,
        max: 75
      }) ]
      
      //for each level determine the tx/map
      el.forEach(function(li) {
        App.enter.push([li, chance.integer({
          min: 0,
          max: App.levelTXN[li].length - 1
        })]);
      })
    }

    //make level links between indexes in array a and array b
    // a and b are lengths of arrays
    function makeLevelLinks(li, a, b) {
      //nl = number of link choice array 
      //p = probability array for n link
      //L = array for final links
      var nl = []
        , p = []
        , L = [];
      //if levels have less than 7 each only one link beteen
      if (a < 7 || b < 7) {
        nl = [1];
        p = [1];
      }//if levels have less than 13 one or two links beteen
      else if (a < 13 || b < 13) {
        nl = [1, 2];
        p = [8, 2];
      }//perhaps 3 links
      else {
        nl = [1, 2, 3];
        p = [5.5, 3, 1.5];
      }
      //pick numbe rof links
      var n = chance.weighted(nl, p);
      //for n links
      for (var i = 0; i < n; i++) {
        //randomly choose array index
        L.push([chance.integer({
          min: 0,
          max: a - 1
        }), chance.integer({
          min: 0,
          max: b - 1
        })])
      }
      //return links
      return L;

    }

    //inter link level - create links between level indexes
    // i is level
    // a is array length
    function makeInterLinks(li, a) {
      chance = new Chance(App.blockN + '+' + li);
      //nl = number of link choice array 
      //p = probability array for n link
      //L = array for final links
      //n = number of links to create
      //c = current links
      //r = current index pick
      var nl = [0]
        , p = []
        , L = []
        , n = 0
        , c = []
        , b = -1;
      //if level has a few only one link beteen
      if (a < 3) {
        nl = [1];
        p = [1];
      }//two links beteen
      else if (a < 8) {
        nl = [1, 2];
        p = [7, 3];
      }//perhaps 3 links
      else {
        nl = [1, 2, 3];
        p = [5, 3, 2];
      }
      //now for each index create links
      for (var i = 0; i < a; i++) {
        //pick the number of links for this index
        n = chance.weighted(nl, p);
        //empty the current links
        c.length = 0;
        //array of indexes
        for (var j = 0; j < a; j++) {
          //don not create links to self
          if (j == i)
            continue;
          c.push(j);
        }
        //loop until links created
        for (j = 0; j < n; j++) {
          b = chance.pickone(c);
          //create link
          L.push([i, b]);
          //remove pick from choice array
          c.splice(c.indexOf(b), 1);
        }
      }
      return L;
    }

    return {
      generateLevels: generateLevels,
      makeInterLinks: makeInterLinks,
      openBlocks: openBlocks
    }

  }
})
