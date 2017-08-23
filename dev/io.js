define(function(require) {
  var IO = require("socket");

  return function(App) {
    //connect to live feed

    var BXIO = IO("https://blockexplorer.com/");
    BXIO.on('connect', function() {
      // Join the room.
      BXIO.emit('subscribe', 'inv');
    })

    //urls and api endpoints for later
    var uBXBase = 'https://blockexplorer.com/api/'
      , uBCBase = 'https://api.blockcypher.com/v1/btc/main/'

    function updateBlockCount() {
      //get the current height on startup
      $.get(uBXBase + 'status?q=getBlockCount', function(data) {
        //notify
        App.notify("Connected to blockchain. Height: " + data.blockcount);
        //update app
        App.height = data.blockcount;
        localStorage.setItem("lastHeight", data.blockcount);
        //check for open blocks
        App.Gen.openBlocks();
      }).fail(function(err) {
        //notify
        App.notify("Error: no connection to the blockvhain!",{type:'error'});
      })
    }
    updateBlockCount();

    //watch for new block - then update blockcount
    BXIO.on('block', function(data) {
      App.height++;
      localStorage.setItem("lastHeight", App.height);
      //check for open blocks
      App.Gen.openBlocks();
      //check for lost runners
      App.lostCheck();
    })

    function getBlock() {
      return new Promise(function(resolve, reject) {
        //jquery get function to pull block hash based on block #
        $.get(uBXBase + 'block-index/' + App.blockN, function(data) {
          //jquery get block data based upon hash
          $.get(uBXBase + 'block/' + data.blockHash, function(bdata) {
            //data
            var doc = {
              hash: bdata.hash,
              merkleroot: bdata.merkleroot,
              tx: bdata.tx
            };
            //store for later
            App.DB.setItem(App.blockN, doc).then(function(sdoc) {
              resolve(sdoc);
            });
          })
        })
      }
      )
    }

    function getTXN(hash) {
      return new Promise(function(resolve, reject) {
        //jquery get function to pull block hash based on block #
        $.get(uBXBase + 'tx/' + hash, function(data) {
          var IN = []
            , vals = []
            , OUT = [];
          //get the input addresses
          data.vin.forEach(function(el) {
            if (el.hasOwnProperty('addr')) {
              IN.push(el.addr);
            }
          })
          //output addresses and values
          data.vout.forEach(function(el) {
            if (el.scriptPubKey.hasOwnProperty('addresses')) {
              OUT = OUT.concat(el.scriptPubKey.addresses);
              //convert to numbers
              vals.push(Number(el.value));
            }
          })
          var doc = {
            in: IN,
            //sort vals from greatest to least
            vals: vals.sort(function(a, b) {
              return b - a
            }),
            out: OUT
          };
          //set db for txn
          App.DB.setItem(hash, doc).then(function(tdoc) {
            resolve(tdoc);
          });
        }).fail(function(err) {
          if (err.responseText.includes('429')) {
            App.hasError = '429';
          }
          reject({
            hash: hash,
            catch: App.hasError
          });
        })
      }
      )
    }

    return {
      getBlock: getBlock,
      getTXN: getTXN
    }
  }
})
