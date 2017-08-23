define(function(require) {
  var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  return function(App) {
    //generic map class
    class Map {
      constructor(map) {
        this.zoom = screen.width < 600 ? 30 : 48;
        Object.assign(this, map);
      }

      //function to check if map point is passable
      passable(x, y) {
        //nothing outside the map
        if (x < 0 || y < 0 || x >= App.map._width || y >= App.map._height)
          return false;
        //chacks the map for passability
        //has to use call to app because of ROT raycasting for vision
        if (App.map._map[x][y] == App.map._pass)
          return true;
        return false;
      }

      //display index - base 64 conversion of the number
      get dIndex() {
        return b64[this._i];
      }

      get bounds() {
        return this.calcBounds();
      }

      //add prototype to map so it can reference the App
      calcBounds() {
        var w = window.innerWidth
          , h = window.innerHeight
          , dW = this.zoom
          , maxFS = screen.width < 600 ? 30 : 20
          , fs = w * 0.92 / dW;
        //max value
        fs = fs > maxFS ? maxFS : fs;

        var xmin = 0
          , xmax = 0
          , ymin = 0
          , ymax = 0
          , PC = App.mainPC;
        //handle x values
        if (PC.x - dW / 2 < 0) {
          xmin = 0;
          xmax = dW;
        } else if (PC.x + dW / 2 > this._width) {
          xmin = this._width - dW;
          xmax = this._width;
        } else {
          xmin = PC.x - dW / 2;
          xmax = xmin + dW;
        }
        //handle y values
        if (PC.y - dW / 2 < 0) {
          ymin = 0;
          ymax = dW;
        } else if (PC.y + dW / 2 > this._height) {
          ymin = this._height - dW;
          ymax = this._height;
        } else {
          ymin = PC.y - dW / 2;
          ymax = ymin + dW;
        }

        return [fs, xmin, xmax, ymin, ymax];
      }

      //check bouns for display of object
      inDBounds(x, y) {
        var b = this.bounds;
        //check x & y
        if (x >= b[1] && x < b[2] && y >= b[3] && y < b[4]) {
          return true;
        }
        return false;
      }

      hide() {
        $("#rot-display").hide();
      }

      display() {
        $("#rot-display").show();
        var D = App.ROTDisplay;
        //clear and redraw
        D.clear();

        var bounds = this.calcBounds();

        //change options to that of the map
        D.setOptions({
          width: this.zoom,
          height: this.zoom,
          fontSize: bounds[0],
          forceSquareRatio: true
        });

        //for the map values display appropriately
        var id = '';
        for (var i = bounds[1]; i < bounds[2]; i++) {
          for (var j = bounds[3]; j < bounds[4]; j++) {
            //check visibility 
            id = i + ',' + j;
            if (this._map[i][j] == 1 && App.visible.map.includes(id)) {
              //basic point
              D.draw(i - bounds[1], j - bounds[3], '.');
            }
          }
        }
        //now manage display objects
        var d = null;
        for (var x in this._display) {
          d = this._display[x];
          //check visibility 
          id = d[1] + ',' + d[2];
          //check if in bounds
          if (this.inDBounds(d[1], d[2]) && App.visible.map.includes(id)) {
            //redo x and y for bounds
            var x = d[1] - this.bounds[1]
              , y = d[2] - this.bounds[3];
            //draw
            if (d[5].length > 0) {
              D.draw(x, y, d[3], d[4], d[5]);
            } else {
              D.draw(x, y, d[3], d[4]);
            }
          }
        }
        //positions for units 
        for (var x in this._positions) {
          d = this._positions[x];
          //check visibility 
          id = d[1] + ',' + d[2];
          //check if in bounds
          if (this.inDBounds(d[1], d[2]) && App.visible.map.includes(id)) {
            //redo x and y for bounds
            var x = d[1] - this.bounds[1]
              , y = d[2] - this.bounds[3];
            //draw
            if (d[5].length > 0) {
              D.draw(x, y, d[3], d[4], d[5]);
            } else {
              D.draw(x, y, d[3], d[4]);
            }
          }
        }

      }
    }

    return Map;
  }
})
