
//basic app setup
requirejs.config({
  //By default load any module IDs from src
  "baseUrl": "src",
  "paths": {
      "d3": ["//d3js.org/d3.v4.min","lib/d3.min"],
      "chance": ["https://cdnjs.cloudflare.com/ajax/libs/chance/1.0.8/chance.min","lib/chance.min"],
      "jquery" : ["//code.jquery.com/jquery-3.1.1.min","lib/jquery.min"],
      "bootstrap" :  ["//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min","lib/bootstrap.min"],
      "vue" :  ["//cdnjs.cloudflare.com/ajax/libs/vue/2.2.4/vue","lib/vue.min"],
      "socket": ["//cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.3/socket.io"],
      "localforage" : ["//cdnjs.cloudflare.com/ajax/libs/localforage/1.5.0/localforage.min"],
      "Noty": ["../lib/noty.min"],
      "rot" : ["../lib/rot"],
  },
  "shim": {
    "bootstrap" : { "deps" :['jquery'] },
  },
});

// Load the main app module to start the app
requirejs(["main"]);
