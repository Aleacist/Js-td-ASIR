const canvas = document.getElementById("canvas1");
const c = canvas.getContext("2d");
canvas.width = 1200;
canvas.height = 700;

//#region Variables globas
const cellSize = 100;
const cellGap = 3;
const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPosition = [];
const projectiles = [];
const obstacle = []
let numberOfResource = 300;
let enemiesInterval = 600;
let levelup = -1;
let seeCell = false;
let frame = 0;
let score = 0;
//let amounDefenders = 3;
let choosenDefender = 1;
let defenderCostArcher = 125;
let defenderCostWall = 25;
let defenderCostTar = 50;

let cardSize = 4;
let towerPositionX = 0;
let towerPositionY = 0;
let gameOver = false;


var matrix = [
  [0,0,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,1,1,1,1,1,1,1,1],
];
//#endregion

//#region Sprites

//#region Escenario
class constrolsbar {
  constructor() {
    (this.width = cellSize * 2), (this.height = canvas.height);
  }
  draw() {
    c.fillStyle = "Purple";
    c.fillRect(0, 0, this.width, this.height);
  }
}
const controlsbar = new constrolsbar();


class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
  }
  draw() {
    if (seeCell == true && player.health > 0 && collision(this, player)) {
      c.strokeStyle = "rgba(0,0,0,0.3)";
      c.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
}

function createGrib() {
  for (let x = cellSize * 2; x < canvas.width; x += cellSize) {
    for (let y = 0; y < canvas.height; y += cellSize) {
      gameGrid.push(new Cell(x, y));
    }
  }
}
createGrib();
function handleGameGrid() {
  for (let i = 0; i < gameGrid.length; i++) {
    gameGrid[i].draw();
  }
}

class Obstacle {
  constructor(horizontalPosition,verticalPosition) {
    this.x = horizontalPosition;
    this.y = verticalPosition;
    this.width = cellSize;
    this.height = cellSize;
    this.health = 200;
    this.maxHealth = this.health;
    this.spriteWidth = 32;
    this.spriteHeight = 32;
  }
  draw() {
     c.fillStyle = "Grey";
     c.fillRect(this.x, this.y, this.width, this.height);

  }
}
function createObstacle() {
 for (i=0;i< Math.floor(Math.random() * 10);i++) {
    let verticalPosition = Math.floor(Math.random() * 7) * cellSize;
    let horizontalPosition = Math.floor(Math.random() * 11) * cellSize;
    while ( horizontalPosition < 200 || horizontalPosition > 1100 || (verticalPosition == 300 && (horizontalPosition == 200 || horizontalPosition == 300) )) { 
       verticalPosition = Math.floor(Math.random() * 7) * cellSize;
       horizontalPosition = Math.floor(Math.random() * 11) * cellSize;};
    for (j=0;j < obstacle.length; j++){
      if ( obstacle[j].x == horizontalPosition && obstacle[j].y == verticalPosition){
        return
      } 
    }
    matrix[verticalPosition/100][horizontalPosition/100]=0;
    obstacle.push(new Obstacle(horizontalPosition,verticalPosition));
  }
}
createObstacle();
function handleObstacle(){
  for (let i = 0; i < obstacle.length; i++) {
    obstacle[i].draw();
  }
}
handleObstacle();

//#endregion

//#region pathfinder
// javascript-astar 0.4.1
// http://github.com/bgrins/javascript-astar
// Freely distributable under the MIT License.
// Implements the astar search algorithm in javascript using a Binary Heap.
// Includes Binary Heap (with modifications) from Marijn Haverbeke.
// http://eloquentjavascript.net/appendix2.html
(function(definition) {
  /* global module, define */
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = definition();
  } else if (typeof define === 'function' && define.amd) {
    define([], definition);
  } else {
    var exports = definition();
    window.astar = exports.astar;
    window.Graph = exports.Graph;
  }
})(function() {

function pathTo(node) {
  var curr = node;
  var path = [];
  while (curr.parent) {
    path.unshift(curr);
    curr = curr.parent;
  }
  return path;
}

function getHeap() {
  return new BinaryHeap(function(node) {
    return node.f;
  });
}

var astar = {
  /**
  * Perform an A* Search on a graph given a start and end node.
  * @param {Graph} graph
  * @param {GridNode} start
  * @param {GridNode} end
  * @param {Object} [options]
  * @param {bool} [options.closest] Specifies whether to return the
             path to the closest node if the target is unreachable.
  * @param {Function} [options.heuristic] Heuristic function (see
  *          astar.heuristics).
  */
  search: function(graph, start, end, options) {
    graph.cleanDirty();
    options = options || {};
    var heuristic = options.heuristic || astar.heuristics.manhattan;
    var closest = options.closest || false;

    var openHeap = getHeap();
    var closestNode = start; // set the start node to be the closest if required

    start.h = heuristic(start, end);
    graph.markDirty(start);

    openHeap.push(start);

    while (openHeap.size() > 0) {

      // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
      var currentNode = openHeap.pop();

      // End case -- result has been found, return the traced path.
      if (currentNode === end) {
        return pathTo(currentNode);
      }

      // Normal case -- move currentNode from open to closed, process each of its neighbors.
      currentNode.closed = true;

      // Find all neighbors for the current node.
      var neighbors = graph.neighbors(currentNode);

      for (var i = 0, il = neighbors.length; i < il; ++i) {
        var neighbor = neighbors[i];

        if (neighbor.closed || neighbor.isWall()) {
          // Not a valid node to process, skip to next neighbor.
          continue;
        }

        // The g score is the shortest distance from start to current node.
        // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
        var gScore = currentNode.g + neighbor.getCost(currentNode);
        var beenVisited = neighbor.visited;

        if (!beenVisited || gScore < neighbor.g) {

          // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
          neighbor.visited = true;
          neighbor.parent = currentNode;
          neighbor.h = neighbor.h || heuristic(neighbor, end);
          neighbor.g = gScore;
          neighbor.f = neighbor.g + neighbor.h;
          graph.markDirty(neighbor);
          if (closest) {
            // If the neighbour is closer than the current closestNode or if it's equally close but has
            // a cheaper path than the current closest node then it becomes the closest node
            if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
              closestNode = neighbor;
            }
          }

          if (!beenVisited) {
            // Pushing to heap will put it in proper place based on the 'f' value.
            openHeap.push(neighbor);
          } else {
            // Already seen the node, but since it has been rescored we need to reorder it in the heap
            openHeap.rescoreElement(neighbor);
          }
        }
      }
    }

    if (closest) {
      return pathTo(closestNode);
    }

    // No result was found - empty array signifies failure to find path.
    return [];
  },
  // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
  heuristics: {
    manhattan: function(pos0, pos1) {
      var d1 = Math.abs(pos1.x - pos0.x);
      var d2 = Math.abs(pos1.y - pos0.y);
      return d1 + d2;
    },
    diagonal: function(pos0, pos1) {
      var D = 1;
      var D2 = Math.sqrt(2);
      var d1 = Math.abs(pos1.x - pos0.x);
      var d2 = Math.abs(pos1.y - pos0.y);
      return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
    }
  },
  cleanNode: function(node) {
    node.f = 0;
    node.g = 0;
    node.h = 0;
    node.visited = false;
    node.closed = false;
    node.parent = null;
  }
};

/**
 * A graph memory structure
 * @param {Array} gridIn 2D array of input weights
 * @param {Object} [options]
 * @param {bool} [options.diagonal] Specifies whether diagonal moves are allowed
 */
function Graph(gridIn, options) {
  options = options || {};
  this.nodes = [];
  this.diagonal = !!options.diagonal;
  this.grid = [];
  for (var x = 0; x < gridIn.length; x++) {
    this.grid[x] = [];

    for (var y = 0, row = gridIn[x]; y < row.length; y++) {
      var node = new GridNode(x, y, row[y]);
      this.grid[x][y] = node;
      this.nodes.push(node);
    }
  }
  this.init();
}

Graph.prototype.init = function() {
  this.dirtyNodes = [];
  for (var i = 0; i < this.nodes.length; i++) {
    astar.cleanNode(this.nodes[i]);
  }
};

Graph.prototype.cleanDirty = function() {
  for (var i = 0; i < this.dirtyNodes.length; i++) {
    astar.cleanNode(this.dirtyNodes[i]);
  }
  this.dirtyNodes = [];
};

Graph.prototype.markDirty = function(node) {
  this.dirtyNodes.push(node);
};

Graph.prototype.neighbors = function(node) {
  var ret = [];
  var x = node.x;
  var y = node.y;
  var grid = this.grid;

  // West
  if (grid[x - 1] && grid[x - 1][y]) {
    ret.push(grid[x - 1][y]);
  }

  // East
  if (grid[x + 1] && grid[x + 1][y]) {
    ret.push(grid[x + 1][y]);
  }

  // South
  if (grid[x] && grid[x][y - 1]) {
    ret.push(grid[x][y - 1]);
  }

  // North
  if (grid[x] && grid[x][y + 1]) {
    ret.push(grid[x][y + 1]);
  }

  if (this.diagonal) {
    // Southwest
    if (grid[x - 1] && grid[x - 1][y - 1]) {
      ret.push(grid[x - 1][y - 1]);
    }

    // Southeast
    if (grid[x + 1] && grid[x + 1][y - 1]) {
      ret.push(grid[x + 1][y - 1]);
    }

    // Northwest
    if (grid[x - 1] && grid[x - 1][y + 1]) {
      ret.push(grid[x - 1][y + 1]);
    }

    // Northeast
    if (grid[x + 1] && grid[x + 1][y + 1]) {
      ret.push(grid[x + 1][y + 1]);
    }
  }

  return ret;
};

Graph.prototype.toString = function() {
  var graphString = [];
  var nodes = this.grid;
  for (var x = 0; x < nodes.length; x++) {
    var rowDebug = [];
    var row = nodes[x];
    for (var y = 0; y < row.length; y++) {
      rowDebug.push(row[y].weight);
    }
    graphString.push(rowDebug.join(" "));
  }
  return graphString.join("\n");
};

function GridNode(x, y, weight) {
  this.x = x;
  this.y = y;
  this.weight = weight;
}

GridNode.prototype.toString = function() {
  return "[" + this.x + " " + this.y + "]";
};

GridNode.prototype.getCost = function(fromNeighbor) {
  // Take diagonal weight into consideration.
  if (fromNeighbor && fromNeighbor.x != this.x && fromNeighbor.y != this.y) {
    return this.weight * 1.41421;
  }
  return this.weight;
};

GridNode.prototype.isWall = function() {
  return this.weight === 0;
};

function BinaryHeap(scoreFunction) {
  this.content = [];
  this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
  push: function(element) {
    // Add the new element to the end of the array.
    this.content.push(element);

    // Allow it to sink down.
    this.sinkDown(this.content.length - 1);
  },
  pop: function() {
    // Store the first element so we can return it later.
    var result = this.content[0];
    // Get the element at the end of the array.
    var end = this.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it bubble up.
    if (this.content.length > 0) {
      this.content[0] = end;
      this.bubbleUp(0);
    }
    return result;
  },
  remove: function(node) {
    var i = this.content.indexOf(node);

    // When it is found, the process seen in 'pop' is repeated
    // to fill up the hole.
    var end = this.content.pop();

    if (i !== this.content.length - 1) {
      this.content[i] = end;

      if (this.scoreFunction(end) < this.scoreFunction(node)) {
        this.sinkDown(i);
      } else {
        this.bubbleUp(i);
      }
    }
  },
  size: function() {
    return this.content.length;
  },
  rescoreElement: function(node) {
    this.sinkDown(this.content.indexOf(node));
  },
  sinkDown: function(n) {
    // Fetch the element that has to be sunk.
    var element = this.content[n];

    // When at 0, an element can not sink any further.
    while (n > 0) {

      // Compute the parent element's index, and fetch it.
      var parentN = ((n + 1) >> 1) - 1;
      var parent = this.content[parentN];
      // Swap the elements if the parent is greater.
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        // Update 'n' to continue at the new position.
        n = parentN;
      }
      // Found a parent that is less, no need to sink any further.
      else {
        break;
      }
    }
  },
  bubbleUp: function(n) {
    // Look up the target element and its score.
    var length = this.content.length;
    var element = this.content[n];
    var elemScore = this.scoreFunction(element);

    while (true) {
      // Compute the indices of the child elements.
      var child2N = (n + 1) << 1;
      var child1N = child2N - 1;
      // This is used to store the new position of the element, if any.
      var swap = null;
      var child1Score;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        var child1 = this.content[child1N];
        child1Score = this.scoreFunction(child1);

        // If the score is less than our element's, we need to swap.
        if (child1Score < elemScore) {
          swap = child1N;
        }
      }

      // Do the same checks for the other child.
      if (child2N < length) {
        var child2 = this.content[child2N];
        var child2Score = this.scoreFunction(child2);
        if (child2Score < (swap === null ? elemScore : child1Score)) {
          swap = child2N;
        }
      }

      // If the element needs to be moved, swap it, and continue.
      if (swap !== null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      }
      // Otherwise, we are done.
      else {
        break;
      }
    }
  }
};

return {
  astar: astar,
  Graph: Graph
};

});

var graph = new Graph(matrix);
var end = graph.grid[3][2];
//#endregion

//#region Proyectiles
class Proyectiles {
  constructor(x, y,power) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 10;
    this.power = power;
    this.speed = 5;
    this.spriteWidth = 23;
    this.spriteHeight = 3;
  }
  update() {
    this.x += this.speed;
  }
  draw() {
    c.fillStyle = "black";
    c.fillRect(this.x, this.y, this.width, this.height);
    // c.drawImage(arrow1,this.x - this.spriteWidth,this.y - this.spriteHeight,this.spriteWidth*2,this.spriteHeight*2);
  }
}
function handleProjectiles() {
  for (let i = 0; i < projectiles.length; i++) {
    projectiles[i].update();
    projectiles[i].draw();

    for (let j = 0; j < enemies.length; j++) {
      if (
        enemies[j] &&
        projectiles[i] &&
        collision(projectiles[i], enemies[j])
      ) {
        enemies[j].health -= projectiles[i].power;
        projectiles.splice(i, 1);
        i--;
      }
    }
    if (projectiles[i] && projectiles[i].x > canvas.width) {
      projectiles.splice(i, 1);
      i--;
    }
  }
}
//#endregion

//#region Defensas
class Archer {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
    this.type = "archer";
    this.shooting = false;
    this.health = 100;
    this.projectiles = [];
    this.timer = 0;
    this.maxFrame=5;
    this.minFrame=0;
    this.frameX=0;
    this.spriteWidth = 32;
    this.spriteHeight = 32;

  }

  draw() {
    c.fillStyle = "gold";
    c.font = "20px Arial";
    c.fillText(Math.floor(this.health), this.x, this.y + this.height);
    c.fillStyle = "black";
    c.fillRect(this.x, this.y, this.width, this.height);
  }
  update() {
    if (this.shooting == true) { 
      if (this.timer % 5 === 0 || this.timer == 0) {
        if (this.frameX < this.maxFrame) this.frameX++;
        else this.frameX = this.minFrame;}
        if (this.timer % 80 === 0) {
          projectiles.push(new Proyectiles(this.x + this.width, this.y + 50,15));
        }
      this.timer++;
    } else {
      this.timer = 0;
    }
    if (this.shooting == false) { this.frameX = 0 }
  };
}
class Wall {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
    this.type = "wall";
    this.health = 500;
    this.spriteWidth = 32;
    this.spriteHeight = 32;
  }
  draw() {
    c.fillStyle = "brown";
    c.fillRect(this.x, this.y, this.width, this.height);
  }
}
class Tar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
    this.type = "tar";
    this.health = 1;
  }
  draw() {
    c.fillStyle = "rgb( 19, 19 ,19 ,0.5 )";
    c.fillRect(this.x, this.y, this.width, this.height);
  }
}
function handleDefenders() {
  for (let i = 0; i < defenders.length; i++) {
    defenders[i].draw();
    if (defenders[i].type === "archer") {
      defenders[i].update();
      if (enemyPosition.indexOf(defenders[i].y) !== -1) {
        defenders[i].shooting = true;
      } else {
        defenders[i].shooting = false;
      }
      for (let j = 0; j < enemies.length; j++) {
        if (defenders[i] && collision(defenders[i], enemies[j])) {
          enemies[j].movement = 0;
          defenders[i].health -= 1;
        }
        if (defenders[i] && defenders[i].health <= 0) {
          defenders.splice(i, 1);
          i--;
          enemies[j].movement = enemies[j].speed;
        }
      }
    } else if (defenders[i].type === "tar") {
      for (let j = 0; j < enemies.length; j++) {
        if (defenders[i] && collision(defenders[i], enemies[j])) {
          if (enemies[j].movement == 0) return;
          enemies[j].movement = enemies[j].speed / 2;
        }
      }
    } else if (defenders[i].type === "wall") {
      for (let j = 0; j < enemies.length; j++) {
        if (defenders[i] && collision(defenders[i], enemies[j])) {
          enemies[j].movement = 0;
          defenders[i].health -= 1;
        }
        if (defenders[i] && defenders[i].health <= 0) {
          defenders.splice(i, 1);
          i--;
          enemies[j].movement = enemies[j].speed;
        }
      }
    }
  }
}
const card1 = {
  x: cellGap * 2,
  y: 100,
  width: cellSize - cellGap * 2 - cardSize,
  height: cellSize - cellGap * 2 - cardSize,
  color: "black",
};
const card2 = {
  x: cellGap * 2 + card1.x + card1.width,
  y:100,
  width: cellSize - cellGap * 2 - cardSize,
  height: cellSize - cellGap * 2 - cardSize,
  color: "black",
};
const card3 = {
  x: cellGap * 2,
  y: card1.y + card1.height + cellGap * 2,
  width: cellSize - cellGap * 2 - cardSize,
  height: cellSize - cellGap * 2 - cardSize,
  color: "black",
};

function chooseDefender() {
  switch (choosenDefender) {
    case 1:
      preciodefensa = defenderCostArcher;
      card1.color = "gold";
      card2.color = "black";
      card3.color = "black";
      break;
    case 2: 
      preciodefensa = defenderCostWall;
      card1.color = "black";
      card2.color = "gold";
      card3.color = "black";
      break;
    case 3:
      preciodefensa = defenderCostTar;
      card1.color = "black";
      card2.color = "black";
      card3.color = "gold";
      break;
    }
  c.lineWidth = 1;
  c.fillStyle = "rgba(0,0,0,0.3)";
  c.font = "20px";

  (c.strokeStyle = card1.color),
  c.strokeRect(card1.x, card1.y, card1.width, card1.height);
  c.fillRect(card1.x, card1.y, card1.width, card1.height);
  c.fillStyle = "rgba(0,0,0,0.3)";
  (c.strokeStyle = card2.color),
    c.strokeRect(card2.x, card2.y, card2.width, card2.height);
  c.fillRect(card2.x, card2.y, card2.width, card2.height);
  c.fillStyle = "rgba(0,0,0,0.3)";
  (c.strokeStyle = card3.color),
    c.strokeRect(card3.x, card3.y, card3.width, card3.height);
  c.fillRect(card3.x, card3.y, card3.width, card3.height);
  c.fillStyle = "rgba(0,0,0,0.3)";

}
//#endregion

//#region Mensajes
const floatingMessages = [];
class FloatingMessages {
  constructor(value, x, y, color) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.lifespan = 0;
    this.color = color;
    this.opacity = 1;
  }
  update() {
    this.y -= 0.3;
    this.lifespan += 1;
    if (this.opacity > 0.1) this.opacity -= 0.01;
  }
  draw() {
    c.globalAlpha = this.opacity;
    c.fillStyle = this.color;
    c.font = "30px Arial";
    c.fillText(this.value, this.x, this.y);
    c.globalAlpha = 1;
  }
}
function handleFloatingMessages() {
  for (let i = 0; i < floatingMessages.length; i++) {
    floatingMessages[i].update();
    floatingMessages[i].draw();
    if (floatingMessages[i].lifespan >= 50) {
      floatingMessages.splice(i, 1);
      i--;
    }
  }
}
//#endregion

//#region Enemy
class Enemy {
  constructor(verticalPosition,path) {
    this.x = canvas.width;
    this.y = verticalPosition;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.speed = (Math.random() * 0.4 + 0.8)+levelup/100;
    this.movement = this.speed;
    this.path = path;
    this.health = 81 + Math.round(levelup);
    this.maxHealth = this.health;
    this.frameX = 1;
    this.minFrame = 16;
    this.maxFrame = 0;
    this.spriteWidth = 32;
    this.spriteHeight = 32;

  }
   update() {
    // x e y estan intercambiado
    // de normal y es altura pero el astar lo tiene cambiado e y es largo
    // x es altura e y es largo
    if (typeof this.path[0] != "undefined"){
    if (this.path[0].y*100<=this.x && this.path[0].x*100==Math.round(this.y-3)){
    this.x -= this.movement;
    }else if (this.path[0].x*100>Math.round(this.y-3)){
      this.y += this.movement;
    }else if (this.path[0].x*100<Math.round(this.y-3)){
      this.y -= this.movement;
    }else if (this.path.length!=0){
      this.path.splice(0,1);
      enemyPosition.splice(0,1);
      enemyPosition.push(this.path[0].x*100)
    }
    }}
  draw() {
     c.fillStyle = "red";
     c.fillRect(this.x, this.y, this.width, this.height);
    // Ver vida
     c.fillStyle = "black";
     c.font = "20px Arial";
     c.fillText(Math.floor(this.health), this.x + 33, this.y + 20);
  }
}
function handleEnemies() {
  if (frame % enemiesInterval === 0) {
    levelup ++ ;
    let verticalPosition = Math.floor(Math.random() * 7) * cellSize ;
    var start=graph.grid[verticalPosition/100][11];
    var path=astar.search(graph,start,end);
    enemies.push(new Enemy(verticalPosition + cellGap,path));
    enemyPosition.push(path[0].x * 100);
    if (enemiesInterval > 100) enemiesInterval -= 5;
  }
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].update();
    enemies[i].draw();
    if (enemies[i].health <= 0) {
      let gainResource = Math.round(enemies[i].maxHealth / 5);
      floatingMessages.push(new FloatingMessages("+" + gainResource,enemies[i].x,enemies[i].y,"black"));
      numberOfResource += gainResource;
      score +=  Math.round(gainResource / 10);
      enemyPosition.splice(i, 1);
      enemies.splice(i, 1);
      i--;
      return
    }
    if ( player.health > 0 && enemies[i] && collision(player, enemies[i])) {
      enemies[i].movement = 0;
      if (frame % 10 == 0){player.health -= 1};
    } else enemies[i].movement = enemies[i].speed;
    if (castillo.health > 0 && collision(castillo, enemies[i])) {
      enemies[i].movement = 0;
      if (frame % 10 == 0){castillo.health -= 1};
    }
  }
 
}
const enemy = new Enemy();
//#endregion

//#region Castillo/derrota

class Castillo {
  constructor() {
    this.x = 201;
    this.y =301;
    this.width = cellSize-2;
    this.height = cellSize-2;
    this.health = 100;
  }
  draw() {
   c.fillStyle = "brown";
   c.fillRect(this.x, this.y, this.width, this.height);
   c.fillStyle = "black";
   c.font = "20px Arial";
   c.fillText(Math.floor(this.health), this.x , this.y + 99);
  }
}

const castillo = new Castillo();
function handleGameStatus() {
  c.fillStyle = "Black";
  c.font = "bold 20px Arial";
  c.fillText("Score " + score, 5, 20);
  c.fillText("Vida " + player.health, 5, 45);
  c.fillText("Recursos " + numberOfResource, 5, 70);
  c.fillText("Precio " + preciodefensa, 5, 95);

  if (castillo.health == 0.0 ) {
    gameOver = true;
    document.cookie="score="+score+";"
  }
  if ( player.x + player.width / 2 + towerPositionX > 200 && player.health > 0 && seeCell == true) {
    c.fillStyle = "red";
    c.beginPath();
    c.arc(
      player.x + player.width / 2 + towerPositionX,
      player.y + player.height / 2 + towerPositionY,
      5,
      0,
      Math.PI * 2
    );
    c.fill();
  }
  if ( keys.enter.pressed == true && (towerPositionX != 0 || towerPositionY != 0) ) {
    const gridPositionX = player.x + towerPositionX;
    const gridPositionY = player.y + towerPositionY;
    if (gridPositionX < cellSize * 2) return;
    if (gridPositionX == castillo.x && gridPositionY == castillo.y) return;
    if (gridPositionX == 1200 || gridPositionX < 0 || gridPositionY == 700 || gridPositionY < 0 ) return;
    for (let i = 0; i < obstacle.length; i++) {
      if (obstacle[i].x === gridPositionX && obstacle[i].y === gridPositionY) return;}
    for (let i = 0; i < defenders.length; i++) {
      if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) return;}
    if (numberOfResource >= defenderCostArcher && choosenDefender === 1) {
      defenders.push(new Archer(gridPositionX, gridPositionY));
      numberOfResource -= defenderCostArcher;
    } else if (numberOfResource >= defenderCostWall && choosenDefender === 2) {
      defenders.push(new Wall(gridPositionX, gridPositionY));
      numberOfResource -= defenderCostWall;
    } else if (numberOfResource >= defenderCostTar && choosenDefender === 3) {
      defenders.push(new Tar(gridPositionX, gridPositionY));
      numberOfResource -= defenderCostTar;
    } else
      floatingMessages.push(
        new FloatingMessages(
          "faltan recursos",
          player.x + player.width / 2 + towerPositionX,
          player.y + player.height / 2 + towerPositionY,
          "black",
          20
        )
      );
  }
}
//#endregion

//#region 
class Player {
  constructor() {
    this.x = 200 + cellSize;
    this.y = 300;
    this.width = cellSize;
    this.height = cellSize;
    this.health = 100;
    this.timer = 50;
    this.frameX = 0;
    this.minFrame = 0;
    this.maxFrame = 4;
    this.spriteWidth = 32;;
    this.spriteHeight = 32;
  }
  draw() {
    c.fillStyle = "red";
    c.font = "20px Arial";
    c.fillText(Math.floor(this.health), this.x + 30, this.y + 15);
    c.fillStyle = "blue";
    c.fillRect(this.x, this.y, this.width, this.height);
  }
  update() {
    if (player.health > 0) this.draw();
    if (keys.shoot.pressed == true) {
      if (player.timer % 25 === 0) {
        projectiles.push(
          new Proyectiles(player.x + player.width, player.y + 50,10)
        );
        player.timer = 0;
      }
      player.timer++;
    } else player.timer = 40;

  } 
}
const player = new Player();

//#endregion
const keys = {
  right: {
    pressed: false,
  },
  left: {
    pressed: false,
  },
  up: {
    pressed: false,
  },
  down: {
    pressed: false,
  },
  shoot: {
    pressed: false,
  },
  enter: {
    pressed: false,
  },
};

function animate() {
  if (!gameOver) {requestAnimationFrame(animate)}
  c.clearRect(0, 0, canvas.width, canvas.height);
  handleObstacle();
  handleDefenders();
  handleGameGrid();
  handleEnemies();
  handleFloatingMessages();
  handleProjectiles();
  chooseDefender();
  castillo.draw();
  player.update();
  handleGameStatus();
  frame++;
}
animate();
function collision(first, second) {
  if (
    !(
       first.x > second.x + second.width ||
       first.x + first.width < second.x ||
      first.y > second.y + second.height ||
      first.y + first.height < second.y
    )
  ) {
    return true;
  }
}

addEventListener("keydown", function(event) {
  if (player.health > 0) {
    switch (event.code) {
      //   movimiento wasd
      case 'KeyA':
        if (player.x != 200 && !(player.x == 300 && player.y < 400 && player.y > 200)) {
           for (i=0;i<obstacle.length;i++){
              if (player.x-100==obstacle[i].x && player.y == obstacle[i].y){
                return;
              }  
            }
            player.x -= 100;
        }
        break;
      case 'KeyD':
        if (player.x != canvas.width - cellSize) {
          for (i=0;i<obstacle.length;i++){
            if (player.x+100==obstacle[i].x && player.y == obstacle[i].y){
              return;
            }  
          }
          player.x += 100;
        }
        break;
      case 'KeyS':
        if ( player.y != canvas.height - cellSize && !(player.x == 200 && player.y < 300 && player.y > 100)) {
          for (i=0;i<obstacle.length;i++){
            if (player.y+100==obstacle[i].y && player.x == obstacle[i].x){
              return;
            }  
          }
          player.y += 100;
        }
        break;
      case 'KeyW':
        if (player.y != 0 && !(player.x == 200 && player.y < 500 && player.y > 300) ) {
        for (i=0;i<obstacle.length;i++){
            if (player.y-100==obstacle[i].y && player.x == obstacle[i].x){
              return;
            }  
          }
          player.y -= 100;
        }
        break;
      //   Seleccion pa poner torres flechas
      case 'ArrowRight':
        towerPositionX = 100;
        seeCell = true;
        break;
      case 'ArrowLeft':
        towerPositionX = -100;
        seeCell = true;
        break;
      case 'ArrowUp':
        towerPositionY = -100;
        seeCell = true;
        break;
      case 'ArrowDown':
        towerPositionY = +100;
        seeCell = true;
        break;
      // seleccionar torreta x y z
      case 'Digit1':
        choosenDefender = 1;
        break;
      case 'Digit2':
        choosenDefender = 2;
        break;
      case 'Digit3':
        choosenDefender = 3;
        break;
      case 'KeyZ':
        if (choosenDefender < 3) {
          choosenDefender += 1;
        } else choosenDefender = 1;
        break;
      case 'KeyX':
        if (choosenDefender > 1) {
          choosenDefender -= 1;
        } else choosenDefender = 3;
        break;
      // Poner torre
      case 'ControlLeft':
        keys.enter.pressed = true;
        break;
      // Disparar
      case 'Space':
        keys.shoot.pressed = true;
        break;
    }
  }
});

addEventListener("keyup", function(event) {
  switch (event.code) {
    case 'ArrowRight':
      towerPositionX = 0;
      seeCell = false;
      break;
    case 'ArrowLeft':
      towerPositionX = 0;
      seeCell = false;
      break;
    case 'ArrowUp':
      towerPositionY = 0;
      seeCell = false;
      break;
    case 'ArrowDown':
      towerPositionY = 0;
      seeCell = false;
      break;
    // Poner torre
    case 'ControlLeft':
      keys.enter.pressed = false;
      break;
    //Disparar espacio
    case 'Space':
      keys.shoot.pressed = false;
      break;
  }
});
