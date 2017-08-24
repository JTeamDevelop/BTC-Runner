define(function(require) {
  var Chance = require("chance");

  var b62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    creatureType = ["aberration", "animal", "construct", "dragon", "fey", "humanoid", 
    "magical beast", "monstrous humanoid", "ooze", "outsider", "plant", "undead", "vermin"];

  function type(seed){
    //used the character at the 4th place as the random value 
    i = b62.indexOf(seed[3]) % creatureType.length;
    return creatureType[i];
  }
  
  //how do the varuous types build
  function structure(seed) {
    //get type
    var t = type(seed),
    //how often do the above types build a dungeon instead of have rough caves
    dungeonPercent = [0.5,0.1,0.75,0.3,0.8,0.5,0.2,0.5,0.05,0.5,0.05,0.5,0.1];
    //use the 6th place to determine random percent
    p = b62.indexOf(seed[5])/b62.length;
    //return structure type
    return p < dungeonPercent[creatureType.indexOf(t)] ? "dungeon" : "cavern";
  }

  return {
    creatureType : type,
    structureType : structure
  }
})