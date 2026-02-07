export class Bridge extends Phaser.Scene {

    constructor() {
        super('Bridge');
        this.socket = null;
    }

    preload() {
    }

    create() {
        this.add.text(20, 20, 'Bridge — Cooperative Tetris', { fontSize: '20px', fill: '#ffffff' });

        // grid
        this.COLS = 20;
        this.ROWS = 18;
        this.CELL = 36;
        this.grid = [];
        for (let y = 0; y < this.ROWS; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.COLS; x++) this.grid[y][x] = 0;
        }

        // target row (bridge location)
        this.targetRow = Math.floor(this.ROWS / 2) + 1;
        // gap columns (bridge must span between these banks)
        this.gapStart = 4;
        this.gapEnd = this.COLS - 5;

        // graphics
        this.g = this.add.graphics();
        this.offsetX = 200;
        this.offsetY = 60;

        // pieces (simple small set)
        this.PIECES = [
            [[1]],
            [[1,1]],
            [[1],[1]],
            [[1,1],[1,1]],
            [[1,1,1,1]]
        ];

        this.spawnPiece();

        // controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

        // network
        this.roomText = this.add.text(20, 50, 'Room: —', { fill: '#fff' });
        this.playersText = this.add.text(20, 80, 'Players: 0/2', { fill: '#fff' });

        this.connectSocket();

        // drop timer
        this.dropInterval = 700;
        this.dropTimer = 0;

        // simple win flag
        this.won = false;
    }

    connectSocket() {
        if (typeof io === 'undefined') {
            console.warn('socket.io client not found');
            return;
        }
        this.socket = io();

        this.socket.on('connect', () => {
            this.roomText.setText('Room: connecting...');
        });

        this.socket.on('joined', (info) => {
            this.roomText.setText('Room: ' + info.room);
            this.playersText.setText('Players: ' + info.count + '/2');
            if (info.state) {
                this.grid = info.state.grid;
            }
        });

        this.socket.on('players', (count) => {
            this.playersText.setText('Players: ' + count + '/2');
        });

        this.socket.on('state', (state) => {
            if (state && state.grid) {
                this.grid = state.grid;
                this.checkWin();
            }
        });

        this.socket.on('start', () => {
            // optionally used
        });
    }

    spawnPiece() {
        const idx = Phaser.Math.Between(0, this.PIECES.length - 1);
        this.piece = JSON.parse(JSON.stringify(this.PIECES[idx]));
        this.px = Math.floor(this.COLS / 2) - Math.ceil(this.piece[0].length / 2);
        this.py = 0;
    }

    rotatePiece() {
        const h = this.piece.length;
        const w = this.piece[0].length;
        let out = [];
        for (let x = 0; x < w; x++) {
            out[x] = [];
            for (let y = h - 1; y >= 0; y--) out[x][h - 1 - y] = this.piece[y][x] || 0;
        }
        this.piece = out;
    }

    canPlace(px, py, piece) {
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[0].length; x++) {
                if (!piece[y][x]) continue;
                const gx = px + x;
                const gy = py + y;
                if (gx < 0 || gx >= this.COLS || gy < 0 || gy >= this.ROWS) return false;
                if (this.grid[gy][gx]) return false;
            }
        }
        return true;
    }

    lockPiece() {
        let placed = [];
        for (let y = 0; y < this.piece.length; y++) {
            for (let x = 0; x < this.piece[0].length; x++) {
                if (!this.piece[y][x]) continue;
                const gx = this.px + x;
                const gy = this.py + y;
                if (gy >= 0 && gy < this.ROWS && gx >= 0 && gx < this.COLS) {
                    this.grid[gy][gx] = 1;
                    placed.push({ x: gx, y: gy });
                }
            }
        }

        // notify server
        if (this.socket && this.socket.connected) {
            this.socket.emit('place', { placed });
        }

        this.spawnPiece();
        this.checkWin();
    }

    checkWin() {
        // bridge condition: target row filled across the gap columns
        let ok = true;
        for (let x = this.gapStart; x <= this.gapEnd; x++) {
            if (!this.grid[this.targetRow][x]) { ok = false; break; }
        }
        if (ok && !this.won) {
            this.won = true;
            this.add.text(400, 20, 'Bridge complete! You win!', { fontSize: '28px', fill: '#00ff00' });
            if (this.socket) this.socket.emit('win');
        }
    }

    update(time, delta) {
        if (!this.piece) return;

        // input handling (simple, immediate)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            if (this.canPlace(this.px - 1, this.py, this.piece)) this.px--;
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            if (this.canPlace(this.px + 1, this.py, this.piece)) this.px++;
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            if (this.canPlace(this.px, this.py + 1, this.piece)) this.py++;
            else this.lockPiece();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.rotatePiece();
            if (!this.canPlace(this.px, this.py, this.piece)) {
                // revert rotate
                this.rotatePiece(); this.rotatePiece(); this.rotatePiece();
            }
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keyX)) {
            // hard drop
            while (this.canPlace(this.px, this.py + 1, this.piece)) this.py++;
            this.lockPiece();
        }

        // auto drop
        this.dropTimer += delta;
        if (this.dropTimer >= this.dropInterval) {
            this.dropTimer = 0;
            if (this.canPlace(this.px, this.py + 1, this.piece)) this.py++;
            else this.lockPiece();
        }

        this.draw();
    }

    draw() {
        this.g.clear();
        // draw gap void below the target row
        this.g.fillStyle(0x041028, 1);
        for (let y = this.targetRow + 1; y < this.ROWS; y++) {
            for (let x = this.gapStart; x <= this.gapEnd; x++) {
                this.g.fillRect(this.offsetX + x * this.CELL + 1, this.offsetY + y * this.CELL + 1, this.CELL - 2, this.CELL - 2);
            }
        }
        // background grid
        this.g.lineStyle(1, 0x333333);
        for (let y = 0; y <= this.ROWS; y++) {
            this.g.moveTo(this.offsetX, this.offsetY + y * this.CELL);
            this.g.lineTo(this.offsetX + this.COLS * this.CELL, this.offsetY + y * this.CELL);
        }
        for (let x = 0; x <= this.COLS; x++) {
            this.g.moveTo(this.offsetX + x * this.CELL, this.offsetY);
            this.g.lineTo(this.offsetX + x * this.CELL, this.offsetY + this.ROWS * this.CELL);
        }
        this.g.strokePath();

        // draw placed blocks
        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                if (this.grid[y][x]) {
                    this.g.fillStyle(0x8888ff, 1);
                    this.g.fillRect(this.offsetX + x * this.CELL + 1, this.offsetY + y * this.CELL + 1, this.CELL - 2, this.CELL - 2);
                }
            }
        }

        // draw target row highlight
        this.g.lineStyle(2, 0xffff00);
        this.g.strokeRect(this.offsetX + this.gapStart * this.CELL, this.offsetY + this.targetRow * this.CELL, (this.gapEnd - this.gapStart + 1) * this.CELL, this.CELL);

        // draw active piece
        for (let y = 0; y < this.piece.length; y++) {
            for (let x = 0; x < this.piece[0].length; x++) {
                if (!this.piece[y][x]) continue;
                const gx = this.px + x;
                const gy = this.py + y;
                this.g.fillStyle(0xff8844, 1);
                this.g.fillRect(this.offsetX + gx * this.CELL + 1, this.offsetY + gy * this.CELL + 1, this.CELL - 2, this.CELL - 2);
            }
        }
    }

}
