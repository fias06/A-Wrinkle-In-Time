const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

let waiting = null; // socket id waiting
let rooms = {}; // roomId -> { grid, players }
let roomCounter = 1;

// shared game constants (keep in sync with client)
const COLS = 20;
const ROWS = 18;
const TARGET_ROW = Math.floor(ROWS / 2) + 1;
const GAP_START = 4;
const GAP_END = COLS - 5;

function createEmptyGrid(cols = 10, rows = 18) {
  const g = [];
  for (let y = 0; y < rows; y++) {
    g[y] = [];
    for (let x = 0; x < cols; x++) g[y][x] = 0;
  }
  return g;
}

io.on('connection', (socket) => {
  console.log('conn', socket.id);

  if (waiting === null) {
    waiting = socket.id;
    socket.emit('joined', { room: 'waiting', count: 1 });
  } else {
    // pair with waiting
    const roomId = 'room-' + (roomCounter++);
    const a = waiting;
    const b = socket.id;
    waiting = null;

    const grid = createEmptyGrid(COLS, ROWS);
    rooms[roomId] = { grid, players: [a, b] };

    io.sockets.sockets.get(a).join(roomId);
    io.sockets.sockets.get(b).join(roomId);

    io.to(roomId).emit('joined', { room: roomId, count: 2, state: { grid } });
    io.to(roomId).emit('players', 2);
    console.log('paired', a, b, '->', roomId);
  }

  socket.on('place', (data) => {
    // find room
    const rs = Array.from(socket.rooms).filter(r => r !== socket.id);
    if (!rs.length) return;
    const roomId = rs[0];
    const room = rooms[roomId];
    if (!room) return;

    // apply placed cells
    if (data && data.placed) {
      for (const p of data.placed) {
        if (p.y >= 0 && p.y < room.grid.length && p.x >= 0 && p.x < room.grid[0].length) {
          // reject blocks placed on the bottom row of the void
          if (p.y === ROWS - 1 && p.x >= GAP_START && p.x <= GAP_END) {
            continue;
          }
          room.grid[p.y][p.x] = 1;
        }
      }
    }

    // remove unsupported blocks in the gap columns below the target row
    // keep blocks if they: have support below OR are connected to blocks outside the gap
    const keep = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    
    // mark all blocks that have support from below or are outside the gap
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!room.grid[y][x]) continue;
        
        // blocks outside gap are always kept
        if (x < GAP_START || x > GAP_END) {
          keep[y][x] = true;
          continue;
        }
        
        // blocks at/above target row are always kept
        if (y <= TARGET_ROW) {
          keep[y][x] = true;
          continue;
        }
        
        // in void below target: check for support from below or connection to outside
        const hasBlockBelow = (y === ROWS - 1) || room.grid[y + 1][x];
        const hasLeftConnection = x > 0 && room.grid[y][x - 1];
        const hasRightConnection = x < COLS - 1 && room.grid[y][x + 1];
        const hasBlockAbove = y > 0 && room.grid[y - 1][x];
        
        // keep if has direct support from below
        if (hasBlockBelow) {
          keep[y][x] = true;
          continue;
        }
        
        // keep if connected to block outside gap (left or right edge)
        if ((x === GAP_START && hasLeftConnection) || (x === GAP_END && hasRightConnection)) {
          keep[y][x] = true;
          continue;
        }
      }
    }
    
    // propagate keep status through connected components
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    
    for (let y = TARGET_ROW + 1; y < ROWS; y++) {
      for (let x = GAP_START; x <= GAP_END; x++) {
        if (room.grid[y][x] && keep[y][x] && !visited[y][x]) {
          // BFS to mark all connected blocks as keep
          const stack = [[x, y]];
          visited[y][x] = true;
          while (stack.length) {
            const [cx, cy] = stack.pop();
            for (const d of dirs) {
              const nx = cx + d[0];
              const ny = cy + d[1];
              if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && room.grid[ny][nx] && !visited[ny][nx]) {
                visited[ny][nx] = true;
                keep[ny][nx] = true;
                stack.push([nx, ny]);
              }
            }
          }
        }
      }
    }
    
    // remove blocks not marked as keep in the void area
    for (let y = TARGET_ROW + 1; y < ROWS; y++) {
      for (let x = GAP_START; x <= GAP_END; x++) {
        if (room.grid[y][x] && !keep[y][x]) {
          room.grid[y][x] = 0;
        }
      }
    }

    // broadcast updated state
    io.to(roomId).emit('state', { grid: room.grid });
  });

  socket.on('win', () => {
    const rs = Array.from(socket.rooms).filter(r => r !== socket.id);
    if (!rs.length) return;
    const roomId = rs[0];
    io.to(roomId).emit('state', rooms[roomId]);
    io.to(roomId).emit('message', 'win');
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    // if waiting, clear
    if (waiting === socket.id) waiting = null;

    // find room and notify
    const rs = Array.from(socket.rooms).filter(r => r !== socket.id);
    if (rs.length) {
      const roomId = rs[0];
      const room = rooms[roomId];
      if (room) {
        // remove player
        room.players = room.players.filter(p => p !== socket.id);
        io.to(roomId).emit('players', room.players.length);
        // delete room if empty
        if (room.players.length === 0) delete rooms[roomId];
      }
    }
  });
});

http.listen(PORT, () => console.log('Server listening on', PORT));
