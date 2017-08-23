define(function(require) {
  var d3 = require('d3');

  require("bootstrap");

  //for the d3 graph
  var width = window.innerWidth
    , height = 500
    , colors = d3.scaleOrdinal(d3.schemeCategory10);
  //for the node push apart
  var charge = -1000;
  var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  //setup the graph display
  var svg = d3.select("body").append("svg").attr("width", width).attr("height", height).attr("id", "levelGraph");
  //hide
  $('#levelGraph').hide();

  //creates a random graph on n nodes and m links
  // http://bl.ocks.org/erkal/9746513
  function randomGraph(App) {
    $('svg').empty();

    var linklist = App.interLinks,
    stairs = App.stairs,
    PCi = App.mainPC.map,
    visible = App.visible.level,
    vS = App.visible.stairs,
    lH = App.levelTXN[App.levelN-1],
    n = lH.length;

    var nodes = d3.range(n).map(Object)
      , links = linklist.map(function(a) {
      return {
        source: a[0],
        target: a[1]
      }
    });

    var nG = svg.append("g").attr("class", "scalable");

    var svgLinks = nG.selectAll(".link").data(links).enter().append("line").attr("class", "link");

    var svgNodes = nG.selectAll(".node").data(nodes).enter().append("circle").attr("class", "node").attr("r", 7).style("fill", "white");

    var svgStairs = nG.selectAll(".stairs").data(stairs).enter().append("circle").attr("class", "stair").attr("r", 3);

    var svgText = nG.selectAll(".text").data(lH).enter().append("text").text(function(d,i) {
      return b64[i];
    })

    var mbf = d3.forceManyBody();
    mbf.strength(charge);

    var sim = d3.forceSimulation(nodes).force("charge", mbf).force("link", d3.forceLink(links)).force("center", d3.forceCenter(width / 2, height / 2));
    //run through 5000
    for (var i = 0; i < 3000; i++) {
      sim.tick();
    }
    //stop
    sim.stop();
    //display
    var  
      xmax = 0
      , ymax = 0,
      xmin = 0,
      ymin =0
      ,p =[];

    svgNodes.attr("cx", function(d) {
      p.push([d.x])   
      xmax = d.x > xmax ? d.x : xmax;
      xmin = d.x < xmin ? d.x : xmin;
      return d.x
    }).attr("cy", function(d,i) {
      p[i].push(d.y);
      ymax = d.y > ymax ? d.y : ymax;
      ymin = d.y < ymin ? d.y : ymin;
      return d.y
    }).style("fill", function(d,i){
      if(i == PCi) return "green";
      return "white";  
    });

    //scaling
    var scaleX = (xmax-xmin)/width, 
    scaleY = (ymax-ymin)/height,
    scale = scaleX > scaleY ? scaleX : scaleY,
    //translation
    t = xmin < 0 ? -xmin/scale : 0;
    t+= ',';
    t+= ymin < 0 ? -ymin/scale : 0;

    nG.attr("transform", "translate("+t+")scale("+1/scale+")");      
    
    svgNodes.filter(function(d,i){
      return !visible.includes(i);
    }).remove();

    svgStairs.attr("cx", function(d) {
      //matches the map corresponding to its second index
      return p[d[1]][0];
    }).attr("cy", function(d,i) {
      return p[d[1]][1];
    }).style("fill", function(d,i){
      //stairs out are yellow
      if(d[0] == 0) return "yellow";
      //stairs up are blue
      else if(d[0]<App.levelN-1) return "blue";
      //stairs down are violet
      return "violet";  
    });

    svgStairs.filter(function(d,i){
      //level to , map found on
      var sid = d.join(',') 
      return !vS.includes(sid);
    }).remove();

    d3.select("svg").attr("width", xmax * 1.1).attr("height", ymax * 1.1);

    svgText.attr("x", function(d,i) {  
      return p[i][0]-20;
    }).attr("y", function(d,i) {
      return p[i][1]+5;
    });

    svgText.filter(function(d,i){
      return !visible.includes(i);
    }).remove();


    svgLinks.attr("x1", function(d) {
      return d.source.x
    }).attr("y1", function(d) {
      return d.source.y
    }).attr("x2", function(d) {
      return d.target.x
    }).attr("y2", function(d) {
      return d.target.y
    });

    svgLinks.filter(function(d){
      return !visible.includes(d.source.index) || !visible.includes(d.target.index);
    }).remove();
  }

  return randomGraph;

})
