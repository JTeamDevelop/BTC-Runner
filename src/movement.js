define(function(require) {
  var ROT = require('rot');

  return function(App) {
    window.addEventListener("keydown", function(e) {
      // space and arrow keys 
      if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
      }

      var key = e.keyCode;
      var char = e.key;

      var vk = "?";
      /* find the corresponding constant */
      for (var name in ROT) {
        if (ROT[name] == key && name.indexOf("VK_") == 0) {
          vk = name;
        }
      }

      var moveMatrix = {
        'VK_UP': [0, -1],
        'VK_DOWN': [0, 1],
        'VK_LEFT': [-1, 0],
        'VK_RIGHT': [1, 0],
      }

      if (moveMatrix.hasOwnProperty(vk)) {
        App.mainPC.incrementMove(moveMatrix[vk]);
      }

    });

    window.addEventListener("keypress", function(e) {
      var code = e.charCode;
      var ch = String.fromCharCode(code);

    });
  }
})
