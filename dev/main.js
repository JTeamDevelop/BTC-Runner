//Load Web App JavaScript Dependencies/Plugins
define(function(require) {
  var Vue = require("vue")
    , LF = require("localforage")
    , Chance = require("chance")
    , Noty = require('Noty')
    , //character pool
  pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  require("bootstrap");

  //create localforage db store
  var BDB = LF.createInstance({
    name: "BTCD-Blocks"
  });

  //check for last height
  if (localStorage.getItem("lastHeight") === null) {
    localStorage.setItem("lastHeight", 480000);
  }

  //creates the VUE js instance
  var vm = new Vue({
    el: '#app',
    data: {
      show: {
        map: false,
        blocks: true,
        touch: true
      },
      player: '',
      runnerName: '',
      runnerID: '',
      runners: {},
      height: 0,
      //blocks to run
      run: [],
      // block info
      blockN: 300000,
      //number of txns
      ntx: 0,
      tClaimed: {},
      //entrances
      enter: [],
      //all levels and txns in them
      levelTXN: [],
      //links between levels
      levelLinks: [],
      //level info
      levelN: 1,
      //actual tx data for the level
      levelData: {},
      //links between txns of the level
      interLinks: [],
      mapi: -1,
      //visibility for level
      visible: {
        level: [],
        map: [],
        stairs: [],
      },
      //claimed data
      claimed: [],
      //
      txn: 0,
      TXNData: [],
      loadFails: [],
      txd: '',
      nComplete: 0,
      hasError: '',
    },
    mounted() {
      //initializes a Chance generator for random needs later
      this.chance = new Chance()
      this.height = Number(localStorage.getItem("lastHeight"));
      //check for touch enabled
      if (localStorage.getItem("optionTouch") === null) {
        localStorage.setItem("optionTouch", true);
      } else {
        //setup touch
        this.show.touch = localStorage.getItem("optionTouch") === "true" ? true : false;
      }
      //check for player
      if (localStorage.getItem("BTCDPlayer") === null) {
        //give the first runner a crazy name
        this.newName();
        //launch welcome modal
        $('#modalWelcome').modal('show');
        //new player id & runner
        var pid = this.chance.string({
          length: 24,
          pool: pool
        });
        //set the player & runner
        localStorage.setItem("BTCDPlayer", pid);
        //set the list of players
        localStorage.setItem("BTCDPlayerList", JSON.stringify([pid]));
        //set the player in the DB
        BDB.setItem(pid, {
          runners: []
        });
        //set the app player
        this.player = pid;
      } else {
        //set the app player
        this.player = localStorage.getItem("BTCDPlayer");
        //set runner list
        this.makeRunnerList();
      }
    },
    computed: {
      mapID() {
        if (this.mapi > -1)
          return App.map.dIndex;
        return '';
      },
      mainPC() {
        return this.runners[this.runnerID];
      },
      stairs() {
        var i = App.levelN - 1;
        //find stairs out of the maze
        var stairs = this.enter.filter(function(el) {
          return el[0] == i;
        });
        //check level links for current map
        var start = i - 1 < 0 ? 0 : i - 1
          , stop = i == 99 ? 98 : i
          , k = 0
          , l = 0;

        for (var j = start; j <= stop; j++) {
          stairs = stairs.concat(App.levelLinks[j]);
        }

        return stairs;
      },
      lost() {
        var R = {}
          , rA = [];
        //check for lost runners
        for (var x in this.runners) {
          R = this.runners[x];
          if (R.status.includes('lost'))
            rA.push(R.name);
        }
        return rA;
      },
    },
    methods: {
      remaining() {
        this.run.forEach(function(id) {
          if (id <= App.height) {
            //find claimed
            App.DB.getItem("claimed+" + id).then(function(doc) {
              if (doc === null) {
                Vue.set(App.tClaimed, id, 0);
              } else {
                Vue.set(App.tClaimed, id, doc.length);
              }
            })
          }
        })
      },
      newName() {
        //give the first runner a crazy name
        this.runnerName = this.chance.capitalize(this.chance.word({
          syllables: 3
        }));
      },
      lostCheck() {
        var R = {};
        //check for lost runners
        for (var x in this.runners) {
          R = this.runners[x];
          if (R.block != 0 && R.block < this.height - 36) {
            //push status
            if (!R.status.includes('lost')) {
              R.status.push('lost');
            }
            //save
            R.save();
          }
        }
      },
      makeRunnerList() {
        this.runners = {};

        BDB.getItem(this.player).then(function(doc) {
          //loop through
          doc.runners.forEach(function(rid, i) {
            //pull data
            BDB.getItem(rid).then(function(rdoc) {
              //set the app list
              Vue.set(App.runners, rid, new Unit(rdoc));
              if (i == doc.runners.length - 1) {
                //lost check
                App.lostCheck();
              }
            });
          })
        });
      },
      newRunner() {
        //generate id for runner
        var pid = this.player
          , rid = this.chance.string({
          length: 24,
          pool: pool
        });
        //update the user db
        BDB.getItem(pid).then(function(doc) {
          doc.runners.push(rid);
          //update
          BDB.setItem(pid, doc);
        })
        //now push runner to db
        var R = {
          id: rid,
          name: this.runnerName
        };
        BDB.setItem(rid, R);
        //set the runner
        Vue.set(App.runners, rid, new Unit(R));
      },
      pullBlock(i) {
        this.blockN = i;
        BDB.getItem(vm.blockN).then(function(doc) {
          //if it doesn't exist get it from site
          if (doc === null) {
            //will pull block and generate level
            IO.getBlock().then(function(bdoc) {
              App.ntx = bdoc.tx.length;
              if (bdoc.tx.length > 100) {
                Gen.generateLevels();
                App.show.map = true;
              }
            });
          } else {
            //pull from localforage & generate
            if (doc.tx.length > 100) {
              App.ntx = doc.tx.length;
              Gen.generateLevels();
              App.show.map = true;
            }
          }
        })
      },
      enterBlock(rid) {
        //close block display
        this.show.blocks = false;
        this.runnerID = rid;
        //set the level to the runner level
        App.levelN = App.runners[rid].level == 0 ? 1 : App.runners[rid].level;
        //where is the pc
        var from = App.mainPC.block == 0 ? [0, 0] : []
          , to = App.mainPC.block == 0 ? App.enter[0][1] : App.mainPC.map;
        //change level
        this.changeLevel(to, from);
      },
      changeLevel(to, from) {
        //index is one less
        var i = App.levelN - 1;
        //generate inter links
        App.interLinks = [].concat(Gen.makeInterLinks(i, App.levelTXN[i].length));
        //set level data
        App.levelData = {}
        //pull level visibilty
        App.DB.getItem("visible+" + App.blockN + "+" + App.levelN).then(function(vdata) {
          App.visible.level = [];
          App.visible.stairs = [];
          if (vdata !== null) {
            App.visible.level = vdata[0].map(function(el) {
              return el;
            })
            App.visible.stairs = vdata[1].map(function(el) {
              return el;
            })
          }

          App.changeMap(to, from);
        })
      },
      //di is the destination index
      changeMap(di, from) {
        var hash = App.levelTXN[App.levelN - 1][di];

        function pullVisible() {
          //pull visibility
          App.DB.getItem("visible+" + hash).then(function(vdata) {
            //load visibility data
            App.visible.map = vdata === null ? [] : vdata;

            App.DB.getItem("claimed+" + hash).then(function(cdata) {
              App.claimed = cdata === null ? [] : cdata;
              //call ROT change map
              RD.changeMap(di, from);
              App.mapi = di;
            })
          })
        }

        //check if data is pulled
        if (App.levelData.hasOwnProperty(hash)) {
          pullVisible();
        } else {
          //check if in db 
          App.DB.getItem(hash).then(function(TX) {
            //get data from server
            if (TX === null) {
              //pull data
              IO.getTXN(hash).then(function(nTX) {
                //set data
                App.levelData[hash] = nTX;
                pullVisible();
              })
            } else {
              //set data
              App.levelData[hash] = TX;
              pullVisible();
            }
          })

        }
      },
      //move unit
      movePC(x, y) {
        this.mainPC.incrementMove([x, y]);
      },
      //zoom map
      zoom(n) {
        //z values are number of blocks in display
        var z = [30, 48, 60, 80, 100, 128]
          , i = z.indexOf(App.map.zoom);
        //check for less than zero or greater than z
        i += n;
        if (i >= z.length) {
          i = z.length - 1;
        }
        if (i < 0) {
          i = 0;
        }
        //final zoom - not greater than the map
        var zv = z[i] > App.map._w ? App.map._w : z[i];
        //update zoom
        App.map.zoom = zv;
        //redraw
        App.map.display();
      },
      showLevelMap() {
        $("#rot-display").hide();
        $("#levelGraph").show(function() {
          LG(App);
        });
      },
      showActiveMap() {
        $("#levelGraph").hide();
        $("#rot-display").show();
        App.map.display();
      }
    }
  })

  var App = vm;
  App.DB = BDB;
  var Gen = require('generate')(App);
  App.Gen = Gen;
  var IO = require('io')(App);
  var RD = require('rotDisplay')(App);
  var Unit = require("unit")(App);
  var LG = require("levelGraph");

  App.notify = function(text, opts) {
    opts = typeof opts === "undefined" ? {} : opts;
    var type = typeof opts.type === "undefined" ? 'success' : opts.type
      , layout = typeof opts.layout === "undefined" ? 'center' : opts.layout
      , time = typeof opts.time === "undefined" ? 1000 : opts.time;

    new Noty({
      theme: 'relax',
      type: type,
      layout: layout,
      timeout: time,
      text: text,
    }).show();
  }
})
