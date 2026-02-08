export class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  preload() {
        this.load.image('player1', 'assets/player1.png');
        this.load.image('player2', 'assets/player2.png');
        this.load.image('lilypad', 'assets/lilypad.png');
        this.load.image('goal', 'assets/goal_flower.png');
        this.load.image('log', 'assets/log.png');
        }

  create() {
    // ----- HARD RESET per restart -----
    this.hasWon = false;

    if (this.specialGfx) { this.specialGfx.destroy(); this.specialGfx = null; }
    if (this.goalGfx)    { this.goalGfx.destroy();    this.goalGfx = null; }

    // also clear any lingering input handlers (optional but good)
    this.input.removeAllListeners();

    const mazeOptions = this.getMazeOptions();
    // const choice = Phaser.Utils.Array.GetRandom(mazeOptions);
    this.mazeIndex = (this.mazeIndex ?? -1) + 1;
    const choice = mazeOptions[this.mazeIndex % mazeOptions.length];
    // OR cycle if you prefer:
    // this.mazeIndex = (this.mazeIndex ?? -1) + 1;
    // const choice = mazeOptions[this.mazeIndex % mazeOptions.length];

    this.maze = choice.grid;
    this.door = choice.door;


    this.tileSize = 48;
    this.originX = 60;  // where the maze starts on screen
    this.originY = 60;

    // precompute walls set for fast collision checks
    this.walls = new Set();
    for (let r = 0; r < this.maze.length; r++) {
      for (let c = 0; c < this.maze[r].length; c++) {
        if (this.maze[r][c] === '#') this.walls.add(`${r},${c}`);
      }
    }

    // --- Special tiles: 2 pressure plates + 1 door ---
    this.plates = this.pickRandomFloorCells(2); // [{row, col}, {row, col}]

    // Door starts CLOSED, so it should behave like a wall
    this.doorOpen = false;
    this.walls.add(`${this.door.row},${this.door.col}`);

    if (this.mazeGfx) this.mazeGfx.destroy();
    this.mazeGfx = this.add.graphics();
    this.mazeGfx.setDepth(0);
    this.drawMaze();
    this.createWallLogs();

    // Draw plates + door on top of the maze
    this.drawSpecialTiles();

    // Create players
    this.p1 = this.makePlayer(choice.p1.row, choice.p1.col, 'player1');
    this.p2 = this.makePlayer(choice.p2.row, choice.p2.col, 'player2');

    // Find reachable regions from each player with door(s) closed
    const regionP1 = this.floodFillFrom({ row: this.p1.row, col: this.p1.col });
    const regionP2 = this.floodFillFrom({ row: this.p2.row, col: this.p2.col });

    // If they can already reach each other, your door isn't separating anything
    // (or you placed both players on the same side).
    if (regionP1.size && regionP1.size === regionP2.size) {
    console.warn("Players appear to be in the same reachable region; door may not be blocking a connection.");
    }

    // Pick one plate from each region (guaranteed on different sides *if* regions differ)
    this.plates = [
    this.pickRandomCellFromSet(regionP1),
    this.pickRandomCellFromSet(regionP2),
    ];

    // Avoid placing a plate directly under a player (optional)
    if (this.plates[0].row === this.p1.row && this.plates[0].col === this.p1.col) {
    this.plates[0] = this.pickRandomCellFromSet(regionP1);
    }
    if (this.plates[1].row === this.p2.row && this.plates[1].col === this.p2.col) {
    this.plates[1] = this.pickRandomCellFromSet(regionP2);
    }

    this.createPlates();

    // Now draw them (your drawSpecialTiles should use this.plates)
    this.drawSpecialTiles();

    this.hasWon = false;

    // Goal should be reachable AFTER the door opens.
    // Easiest: pick it from Player 1's region (or Player 2's), and ensure it isn't on plates/players.
    const exclude = new Set([
    `${this.p1.row},${this.p1.col}`,
    `${this.p2.row},${this.p2.col}`,
    `${this.plates[0].row},${this.plates[0].col}`,
    `${this.plates[1].row},${this.plates[1].col}`,
    `${this.door.row},${this.door.col}`,
    ]);

    // Pick goal randomly from all floor cells excluding the above
    this.goal = this.pickRandomFloorCell(exclude);
    // this.drawGoal();
    this.createGoal();


    // movement lock so they move tile-by-tile, not spam
    this.p1.moving = false;
    this.p2.moving = false;

    // --- 4) Input ---
    this.keys = this.input.keyboard.addKeys({
      // Player 1 (WASD)
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      // Player 2 (Arrows)
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    });

    this.add.text(60, 20,
      "Both players must stand on the lily pad at the same time to open the door. Once the door is open, reach the lotus flower to win.",
      { fontFamily: "Arial", fontSize: "20px", color: "#ffffff" }
    );
  }

  update() {
    // Player 1: WASD
    if (this.hasWon) return;

    if (!this.p1.moving) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.w)) this.tryMove(this.p1, -1, 0);
      else if (Phaser.Input.Keyboard.JustDown(this.keys.s)) this.tryMove(this.p1, 1, 0);
      else if (Phaser.Input.Keyboard.JustDown(this.keys.a)) this.tryMove(this.p1, 0, -1);
      else if (Phaser.Input.Keyboard.JustDown(this.keys.d)) this.tryMove(this.p1, 0, 1);
    }

    // Player 2: Arrow keys
    if (!this.p2.moving) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.up)) this.tryMove(this.p2, -1, 0);
      else if (Phaser.Input.Keyboard.JustDown(this.keys.down)) this.tryMove(this.p2, 1, 0);
      else if (Phaser.Input.Keyboard.JustDown(this.keys.left)) this.tryMove(this.p2, 0, -1);
      else if (Phaser.Input.Keyboard.JustDown(this.keys.right)) this.tryMove(this.p2, 0, 1);
    }
  }

  makePlayer(row, col, key) {
  const { x, y } = this.gridToWorld(row, col);
  const sprite = this.add.image(x, y, key);
  const scale = (this.tileSize * 0.7) / Math.max(sprite.width, sprite.height);
    sprite.setScale(scale);

  sprite.setDepth(10); // players on top
  return { row, col, sprite, moving: false };
  }

    
  gridToWorld(row, col) {
    return {
      x: this.originX + col * this.tileSize + this.tileSize / 2,
      y: this.originY + row * this.tileSize + this.tileSize / 2,
    };
  }

  isWall(row, col) {
    return this.walls.has(`${row},${col}`);
  }

  tryMove(player, dr, dc) {
    const nr = player.row + dr;
    const nc = player.col + dc;

    // bounds check
    if (nr < 0 || nc < 0 || nr >= this.maze.length || nc >= this.maze[0].length) return;

    // collision check
    if (this.isWall(nr, nc)) return;

    // commit move with a tween
    player.moving = true;
    player.row = nr;
    player.col = nc;

    const { x, y } = this.gridToWorld(nr, nc);
    this.tweens.add({
      targets: player.sprite,
      x, y,
      duration: 120,
    //   onComplete: () => { player.moving = false; }
    onComplete: () => {
        player.moving = false;
        this.checkDoorCondition();
        this.checkWinCondition();
    }

    });
  }

  pickRandomFloorCells(n) {
  const floors = [];
  for (let r = 0; r < this.maze.length; r++) {
    for (let c = 0; c < this.maze[r].length; c++) {
      if (this.maze[r][c] === '.') floors.push({ row: r, col: c });
    }
  }

  // shuffle
  for (let i = floors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [floors[i], floors[j]] = [floors[j], floors[i]];
  }

  return floors.slice(0, n);
}

drawSpecialTiles() {
  // Use a separate graphics layer so we can redraw plates/door easily
  if (!this.specialGfx) {
    this.specialGfx = this.add.graphics();
    this.specialGfx.setDepth(5); // special tiles layer
  }
  this.specialGfx.clear();

  this.createLilyPads();

  // Door (closed = red-ish block, open = green-ish outline)
  const dx = this.originX + this.door.col * this.tileSize;
  const dy = this.originY + this.door.row * this.tileSize;

  if (!this.doorOpen) { // if door closed: dark red (0xb22222) fill
    this.specialGfx.fillStyle(0xb22222, 1); // closed door (dark red > 0xb22222)
    // this.specialGfx.lineStyle(3, 0x2e8b57, 1); // green outline
    // this.specialGfx.fillRect(dx, dy, this.tileSize, this.tileSize);
  } else {
    this.specialGfx.lineStyle(3, 0x2e8b57, 1); // open door outline (sea green)
    this.specialGfx.strokeRect(dx + 4, dy + 4, this.tileSize - 8, this.tileSize - 8);
  }
}

isOnPlate(player, plate) {
  return player.row === plate.row && player.col === plate.col;
}

checkDoorCondition() {
  const bothOn =
    this.isOnPlate(this.p1, this.plates[0]) && this.isOnPlate(this.p2, this.plates[1]) ||
    this.isOnPlate(this.p1, this.plates[1]) && this.isOnPlate(this.p2, this.plates[0]);

if (bothOn && !this.doorOpen) {
  this.doorOpen = true;
  this.walls.delete(`${this.door.row},${this.door.col}`);

  // remove the log at the door
  const doorKey = `${this.door.row},${this.door.col}`;
  const doorLog = this.wallSpriteMap?.get(doorKey);
  if (doorLog) {
    doorLog.destroy();
    this.wallSpriteMap.delete(doorKey);
  }


  this.drawMaze();        // ← THIS updates the door tile look
  this.drawSpecialTiles();
}

}

isWalkable(row, col) {
  const ch = this.maze[row][col];
  // treat '.' and 'G' as floor. (Add other floor chars if you have them.)
  return ch === '.' || ch === 'G';
}

floodFillFrom(start) {
  const key = (r, c) => `${r},${c}`;
  const q = [start];
  const visited = new Set([key(start.row, start.col)]);

  while (q.length) {
    const { row, col } = q.shift();

    const nbrs = [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 },
    ];

    for (const n of nbrs) {
      if (
        n.row < 0 || n.col < 0 ||
        n.row >= this.maze.length || n.col >= this.maze[0].length
      ) continue;

      const k = key(n.row, n.col);
      if (visited.has(k)) continue;

      // blocked by walls set (includes closed doors)
      if (this.walls.has(k)) continue;

      // must be a walkable tile in the ASCII map
      if (!this.isWalkable(n.row, n.col)) continue;

      visited.add(k);
      q.push(n);
    }
  }

  return visited; // Set of "r,c"
}

pickRandomCellFromSet(cellSet) {
  const arr = Array.from(cellSet);
  const choice = arr[Math.floor(Math.random() * arr.length)];
  const [r, c] = choice.split(',').map(Number);
  return { row: r, col: c };
}

drawGoal() {
  if (!this.goalGfx) this.goalGfx = this.add.graphics();
  this.goalGfx.clear();

  const x = this.originX + this.goal.col * this.tileSize;
  const y = this.originY + this.goal.row * this.tileSize;

  this.goalGfx.fillStyle(0x00aa00, 0.95);
  this.goalGfx.fillRect(x + 6, y + 6, this.tileSize - 12, this.tileSize - 12);

  this.goalGfx.lineStyle(3, 0xffffff, 1);
  this.goalGfx.strokeRect(x + 6, y + 6, this.tileSize - 12, this.tileSize - 12);
}

checkWinCondition() {
  if (this.hasWon) return;

  const p1On = this.p1.row === this.goal.row && this.p1.col === this.goal.col;
  const p2On = this.p2.row === this.goal.row && this.p2.col === this.goal.col;

    if (p1On && p2On) {
    this.hasWon = true;

    // freeze movement/input
    this.p1.moving = true;
    this.p2.moving = true;

    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    // dark overlay
    this.winOverlay = this.add.rectangle(cx, cy, 800, 300, 0x000000, 0.8)
        .setDepth(1000);

    // YOU WIN text
    this.winText = this.add.text(cx, cy - 40, "YOU WIN!", {
        fontFamily: "Arial",
        fontSize: "72px",
        color: "#ffffff",
    }).setOrigin(0.5).setDepth(1001);

    // restart prompt
    this.restartText = this.add.text(cx, cy + 60, "Press anywhere to play again", {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#cccccc",
    }).setOrigin(0.5).setDepth(1001);

    // subtle pulse so it looks alive
    this.tweens.add({
        targets: this.restartText,
        alpha: 0.4,
        duration: 800,
        yoyo: true,
        repeat: -1,
    });

    // wait for click / tap
    this.input.once('pointerdown', () => {
        this.scene.restart();
    });
    }

}

pickRandomFloorCell(excludeSet) {
  const candidates = [];
  for (let r = 0; r < this.maze.length; r++) {
    for (let c = 0; c < this.maze[r].length; c++) {
      if (!this.isWalkable(r, c)) continue;
      const k = `${r},${c}`;
      if (excludeSet.has(k)) continue;
      candidates.push({ row: r, col: c });
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

drawMaze () {
    this.mazeGfx.clear();

    for (let r = 0; r < this.maze.length; r++) {
        for (let c = 0; c < this.maze[r].length; c++) {

            const x = this.originX + c * this.tileSize;
            const y = this.originY + r * this.tileSize;

            const isDoorTile = (r === this.door.row && c === this.door.col);

            // OPEN DOOR: floor fill + green outline
            if (isDoorTile && this.doorOpen) {
            this.mazeGfx.fillStyle(0xaadfff, 1); // same as floor
            this.mazeGfx.fillRect(x, y, this.tileSize, this.tileSize);

            this.mazeGfx.lineStyle(3, 0x2e8b57, 1); // green outline
            this.mazeGfx.strokeRect(x + 3, y + 3, this.tileSize - 6, this.tileSize - 6);
            }

            // CLOSED DOOR (acts like wall)
            else if (isDoorTile && !this.doorOpen) {
            this.mazeGfx.fillStyle(0x2b2b2b, 1);
            this.mazeGfx.fillRect(x, y, this.tileSize, this.tileSize);
            this.mazeGfx.lineStyle(3, 0xff3333, 1); // red outline
            this.mazeGfx.strokeRect(x + 3, y + 3, this.tileSize - 6, this.tileSize - 6);
            }

            else if (this.maze[r][c] === '#') {
            // do nothing: logs are drawn as sprites in createWallLogs()
            }

            // FLOOR
            else {
            this.mazeGfx.fillStyle(0xaadfff, 1);
            this.mazeGfx.fillRect(x, y, this.tileSize, this.tileSize);

            this.mazeGfx.lineStyle(1, 0x88ccee, 1);
            this.mazeGfx.strokeRect(x, y, this.tileSize, this.tileSize);
            }
        }
    }

}

createLilyPads() {
  // clean up old pads on restart
  if (this.lilyPads) {
    this.lilyPads.forEach(p => p.destroy());
  }

  this.lilyPads = this.plates.map(p => {
    const { x, y } = this.gridToWorld(p.row, p.col);

    const pad = this.add.image(x, y, 'lilypad');
    pad.setDepth(4); // above maze, below players

    // scale nicely into tile
    const scale = (this.tileSize * 0.8) / Math.max(pad.width, pad.height);
    pad.setScale(scale);

    return pad;
  });
}

createPlates() {
  // cleanup on restart
  if (this.plateSprites) {
    this.plateSprites.forEach(p => p.destroy());
  }
  this.plateSprites = [];

  for (const p of this.plates) {
    const { x, y } = this.gridToWorld(p.row, p.col);

    const sprite = this.add.image(x, y, 'lilypad');
    sprite.setScale((this.tileSize * 0.75) / sprite.width);
    sprite.setDepth(3); // above floor, below players

    this.plateSprites.push(sprite);
  }
}

createGoal() {
  if (this.goalSprite) {
    this.goalSprite.destroy();
  }

  const { x, y } = this.gridToWorld(this.goal.row, this.goal.col);

  this.goalSprite = this.add.image(x, y, 'goal');
  this.goalSprite.setScale((this.tileSize * 0.8) / this.goalSprite.width);
  this.goalSprite.setDepth(4); // above plates, below players

  // subtle animation so it feels special ✨
  this.tweens.add({
    targets: this.goalSprite,
    y: y - 6,
    duration: 800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

createWallLogs() {
  // cleanup on restart
  if (this.wallSprites) this.wallSprites.forEach(s => s.destroy());
  this.wallSprites = [];
  this.wallSpriteMap = new Map(); // key: "r,c" -> sprite

  for (let r = 0; r < this.maze.length; r++) {
    for (let c = 0; c < this.maze[r].length; c++) {
      if (this.maze[r][c] !== '#') continue;

      const { x, y } = this.gridToWorld(r, c);
      const log = this.add.image(x, y, 'log');
      log.setDepth(2);
      log.setDisplaySize(this.tileSize, this.tileSize);

      const k = `${r},${c}`;
      this.wallSprites.push(log);
      this.wallSpriteMap.set(k, log);
    }
  }

  // Ensure the door has a log when closed (even if door isn't '#')
  const doorKey = `${this.door.row},${this.door.col}`;
  if (!this.wallSpriteMap.has(doorKey) && !this.doorOpen) {
    const { x, y } = this.gridToWorld(this.door.row, this.door.col);
    const doorLog = this.add.image(x, y, 'log');
    doorLog.setDepth(2);
    doorLog.setDisplaySize(this.tileSize, this.tileSize);

    this.wallSprites.push(doorLog);
    this.wallSpriteMap.set(doorKey, doorLog);
  }
}

getMazeOptions() {
  return [
    {
      grid: [
        "#######################",
        "#.......#.........#...#",
        "#.###.#####.###.#.#...#",
        "#.#.....#...#...#...#.#",
        "#.#.#######.###.#####.#",
        "#.#.......#...#.....#.#",
        "#.#######.###.#####.#.#",
        "#.....#...#.....#...#.#",
        "###.#.#.#######.#.###.#",
        "#...#.#.....#...#.....#",
        "#.###.#####.#.###.###.#",
        "#...#.......#.....#...#",
        "#######################",
      ],
      door: { row: 4, col: 9 },
      p1:   { row: 1, col: 1 },
      p2:   { row: 7, col: 17 },
    },

    {
      grid: [
        "#######################",
        "#.....#.......#.......#",
        "#.###.#.#####.#.#####.#",
        "#...#.#.....#.#.....#.#",
        "###.#.#####.#.#####.#.#",
        "#...#.....#.#.....#...#",
        "#.#####.#.#.#####.###.#",
        "#.....#.#.#.....#.....#",
        "#.###.#.#.#####.#####.#",
        "#.#...#.#.....#.....#.#",
        "#.#.###.#####.#.###.#.#",
        "#.......#.....#.....#.#",
        "#######################",
      ],
      door: { row: 10, col: 14 },
      p1:   { row: 5, col: 3 },
      p2:   { row: 11, col: 15 },
    },

    {
      grid: [
        "#######################",
        "#.......#.......#.....#",
        "#.#####.#.#####.#.###.#",
        "#.....#.#.....#.#...#.#",
        "#####.#.#####.#.###.#.#",
        "#.....#.....#.#.....#.#",
        "#.#########.#.#####.#.#",
        "#.........#.#.....#...#",
        "#.#######.#.###.#.###.#",
        "#.#.....#.#...#.#.....#",
        "#.#.###.#.###.#.#####.#",
        "#.....#.......#.......#",
        "#######################",
      ],
      door: { row: 6, col: 12 },
      p1:   { row: 11, col: 5 },
      p2:   { row: 3, col: 17 },
    },
  ];
}


}
