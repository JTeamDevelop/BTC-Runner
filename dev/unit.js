define(function(require) {
  var ROT = require('rot')
  

  return function(App) {

    class Unit {
      constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.status = typeof data.status === "undefined" ? [] : data.status;
        this.block = typeof data.block === "undefined" ? 0 : data.block;
        this.x = typeof data.x === "undefined" ? -1 : data.x;
        this.y = typeof data.y === "undefined" ? -1 : data.y;
        this.level = typeof data.level === "undefined" ? 0 : data.level;
        this.map = typeof data.map === "undefined" ? 0 : data.map;
        this.claimed = typeof data.claimed === "undefined" ? [] : data.claimed;
      }

      save() {
        var U = this
          , data = {}
          , dA = ["id", "name", "status", "claimed", "block", "level", "map", "x", "y"];

        dA.forEach(function(el) {
          data[el] = U[el];
        })

        App.DB.setItem(this.id, data);
      }

      vision(x, y) {
        var fov = new ROT.FOV.RecursiveShadowcasting(App.map.passable);
        /* output callback 360 vision vision */
        fov.compute(x, y, 10, function(x, y, r, visibility) {
          var id = x + ',' + y;
          //push it if it doesn't exist
          if (visibility == 1 && !App.visible.map.includes(id)) {
            App.visible.map.push(id);
          }
        });
      }

      incrementMove(inc) {
        var map = App.map
          , x = this.x + inc[0]
          , y = this.y + inc[1];
        //don't go out of bounds
        if (x < 0 || x == map._width || y < 0 || y == map._height)
          return;
        //otherwise move
        this.move(x, y);
      }

      get relics() {
        return this.claimed.reduce(function(total, el) {
          if (el[2] == 0)
            return total + 1;
          else
            return total;
        }, 0)
      }

      get claimedValues() {
        return this.claimed.map(function(el) {
          var v = el[3] < 0.001 ? 0.001 : el[3]
            , m = Math.pow(2, el[0] / 10);

          v *= el[2] == 0 ? 10000 : 1000;
          v *= m;

          //use powers of 10 to smooth it out
          return Math.log10(v);
        })
      }

      get score() {
        return this.claimedValues.reduce(function(total, el) {
          return total + el;
        }, 0)
      }

      move(x, y) {
        var map = App.map;
        //if passable move unit
        if (map.passable(x, y)) {
          //visibility
          this.vision(x, y);
          //update visibility DB
          App.DB.setItem("visible+" + map._tx, App.visible.map);
          //remove from old array
          var cp = this.x + ',' + this.y;
          if (map._positions.hasOwnProperty(cp)) {
            delete map._positions[cp];
          }
          //set this position
          this.x = x;
          this.y = y;
          this.block = map._block;
          this.level = map._level;
          this.map = map._i;
          //update visibility
          if (!App.visible.level.includes(map._i)) {
            App.visible.level.push(map._i);
            //write to DB - both level and stair data is written to the level
            App.DB.setItem("visible+" + map._block + "+" + map._level, [App.visible.level, App.visible.stairs]);
          }
          //make new
          var nid = x + ',' + y;
          map._positions[nid] = ['unit', x, y, '@', '#fff', '', this.name];
          //check for item at location
          if (map._display.hasOwnProperty(nid)) {
            var item = map._display[nid];
            //change maps on stairs
            if (item[0] == 'stair') {
              //level to , map found on
              var sid = item[6][0] + "," + map._i;
              //update visibility
              if (!App.visible.stairs.includes(sid)) {
                App.visible.stairs.push(sid);
                //write to DB
                App.DB.setItem("visible+" + map._block + "+" + map._level, [App.visible.level, App.visible.stairs]);
              }
              //travel to new map
              if (item[6][0] == 0) {
                //leave map 
                this.block = 0;
                this.level = 0;
                this.map = -1;
                this.x = -1;
                this.y = -1;
                //change display
                App.show.blocks = true;
                App.show.map = false;
                //remove map
                App.map.hide();
                App.map = null;
              } else {
                //update level
                App.levelN = item[6][0] + 1;
                //change level
                App.changeLevel(item[6][1], [this.level, this.map])
              }
            }//change maps on exit
            else if (item[0] == 'exit') {
              //item 6 = exit info, 6[1] link info, 
              this.map = item[6][1];
              //change maps
              App.changeMap(item[6][1], [App.levelN, map._i]);
            }//found a relic!
            else if (['relic', 'treasure'].includes(item[0])) {
              var what = item[0]
                , hash = item[6][0]
                , index = item[6][1]
                , //get tx data
              TX = App.levelData[hash]
                , val = index >= TX.vals.length ? -1 : TX.vals[index];
              //add to unit
              this.claimed.push([this.level, hash, index, val]);
              //update claimed
              App.claimed.push(index);
              //update DB
              App.DB.setItem("claimed+" + hash, App.claimed);
              //notify
              App.notify(what[0].toUpperCase()+what.substr(1)+"!");
              //delete from map display
              delete map._display[nid];
              //update display
              map.display();
            }
          } else {
            //update display
            map.display();
          }
          //save
          this.save();

        }
      }
    }

    return Unit;

  }

})
