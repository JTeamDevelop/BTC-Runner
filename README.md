# BTC-Runner V 0.1
*This game is released freely and will always remain free to play because the grace of God is available freely through His son Jesus Christ.*

Bitcoin Runner (BTCR) is a [roguelike](http://www.roguebasin.com/index.php?title=Main_Page "RogueBasin").  You control a Runner who scours randomly generated Mazes in search of Relics of the past before the Mazes are devoured by the Nothing.  

The unique facet is that the game is tied to the [Bitcoin blockchain](https://en.bitcoin.it/wiki/Block_chain).  Approximately every 10 minutes Bitcoin produces another block that contains over ~1900 transactions.  These transactions are the foundations for the maps within the Mazes.  All the transactions are evenly divided into 100 levels and each transaction hash becomes the seed for the map generator.  The maps vary in size between 64 by 64 all the way up to massive 300 by 300 maps based upon the size and value of the BTC in the transaction.  Each map is also randomly linked to the other maps on the same level - creating a vast web of maps to be explored.     

The goal is to explore each map and the maze and find the relics hidden within.  These along with other treasures are randomly placed in each map, and their value is determined by the transaction.  The game automatically saves your runner’s progress and the treasure and relics they collect give your Runner a score.  

Since block 480000 the app has been randomly selecting blocks to run.  There are only a few mazes to run at any one time and everyone will run the same ones.  Be warned though - each Maze only remains open for a short period of time: exactly 36 blocks.  Blocks occur about every 10 minutes, but this can vary depending upon the network, so each maze will only remain open for roughly 6 hours.  And if your runner remains in the maze once the time is up they will be lost forever.     

Run fast!

## How to Play
### Movement
You can move up, down, left, and right by using the arrow keys or the arrow buttons at the bottom of the screen.  You can only move on the dots.  

### Icons
* White @ - Your character.
* White . - An open spot that your character can move to.
* Gold Ƀ - You can find treasure here.  We would use the bitcoin symbol but not every browser recognizes it yet.  Most is treasure - only one on every map is a relic.  
* Green \# - Stairs leading up or down a level. 
* Green . or A-Z - An exit from the current map to another map on the same level.  Dots represent unexplored exits, while letters have been explored and lead to that specific map.  

### Roadmap
#### V 0.1 - Current Capability
- Load bitcoin block & transaction data from remote server (blockexplorer.com)
- Generate 100 levels from blockchain data (Chance)
- Maintain 36 block window
- Generate maps from transaction data (rot.js)
- Display maps (rot.js)
- Display level map links (D3.js)
- Generate and randomly place basic relics and treasure
- Simple characters - movement only
- Field of View 
- Move between maps and levels
- Save state - save view, characters, and relics/treasures claimed (localForage) 
#### V 0.2  
- Room based maps (not just caverns)  
- More complex characters - XP, skills and levels
- Traps
#### V 0.3
- Character improvement - basic Pathfinder RPG rules for Fighter and Thief

### Librabries
BTCR is built using the following libraries:
- [rot.js](https://github.com/ondras/rot.js) - A roguelike toolkit for JS.  Handles map generation and display.
- [Chance](http://chancejs.com/) - Seeded random generation toolkit.
- [D3.js](https://d3js.org/) - Display data on Canvas and in SVG.
- [Vue.js](https://vuejs.org/) - Responsive frontend for handling user input and state changes.
- [jQuery](https://jquery.com/) - Used by Bootstrap for DOM manipulation as well as getting block info from the server.
- [Bootstrap](https://getbootstrap.com/) - Library for quick GUI development.
- [Noty](https://ned.im/noty/#/) - Library for popup notification. 
- [localForage](http://localforage.github.io/localForage/) - Storage backend for app.
- [socket.io](https://socket.io/) - Simple websocket communication with the server.

This app relies on [Blockexplorer.com](https://blockexplorer.com/) for blockchain data.

**You have the JTeam promise that this game will always remain free to play and open source under the GNU GPLv3 license.**

Donations are welcome.  Any donations you make will help fund development.
- **Bitcoin:** 1GFurdWWKhziVEVjw8uyGJWSfpfjMo5cUA
- **Ethereum:** 0xe7e02aa5333c6a8861C4db4135468dFbEFA031c0
- **Iota:** Z9UM9RKTBVXIRRDLBVJOTNZUNJZNH9AXFLMBFPULJSNJGRQQQDVYDHIJKLKNJAEKCLWUTVZQRHN9XQXPYXMPMCSLVX



