/*
* Asset from: https://kenney.nl/assets/pixel-platformer
*
*/
import ASSETS from '../assets.js';
import ANIMATION from '../animation.js';
import Player from '../gameObjects/Player.js';
import PlayerBullet from '../gameObjects/PlayerBullet.js';
import EnemyFlying from '../gameObjects/EnemyFlying.js';
import EnemyBullet from '../gameObjects/EnemyBullet.js';
import Explosion from '../gameObjects/Explosion.js';

const DIFFICULTY = {
  EASY: 0,
  NORMAL: 1,
  HARD: 2,
};

const DIFF_SETTINGS = {
  [DIFFICULTY.EASY]: {
    name: 'Easy',
    contactKills: false,
    squirrelSpeedMin: 25,
    squirrelSpeedMax: 45,
    spawnDelayMin: 150,
    spawnDelayMax: 240,
    spawnCountMin: 1,
    spawnCountMax: 1,
  },
  [DIFFICULTY.NORMAL]: {
    name: 'Normal',
    contactKills: true,
    squirrelSpeedMin: 40,
    squirrelSpeedMax: 70,
    spawnDelayMin: 90,
    spawnDelayMax: 150,
    spawnCountMin: 1,
    spawnCountMax: 2,
  },
  [DIFFICULTY.HARD]: {
    name: 'Hard',
    contactKills: true,
    squirrelSpeedMin: 70,
    squirrelSpeedMax: 110,
    spawnDelayMin: 45,
    spawnDelayMax: 90,
    spawnCountMin: 2,
    spawnCountMax: 4,
  },
};

export class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.difficulty = (data && data.difficulty != null) ? data.difficulty : 0;
  }

  initBackground() {
    this.cameras.main.setBackgroundColor('#6fbf4a');
  }

  create() {
    this.physics.resume();

    this.initVariables();     // sets this.diff
    this.initGameUi();        // safe to use this.diff.name now
    this.initAnimations();
    this.initBackground();
    this.initInput();
    this.initPlayer();
    this.initPhysics();
    this.initTomatoes();
    this.initSpawning();
  }


  update() {
    // restart handling when game over
    if (this.isGameOver) {
      if (this.rKey && Phaser.Input.Keyboard.JustDown(this.rKey)) {
        this.restartGame();
      }
      return;
    }

    if (!this.gameStarted) return;

    this.handlePlayer(this.player1, this.p1Keys);
    this.handlePlayer(this.player2, this.p2Keys);

    // spawn logic
    if (this.spawnSquirrelCounter > 0) this.spawnSquirrelCounter--;
    else this.spawnSquirrelWave();

    // squirrels move toward tomatoes
    const tomatoes = this.tomatoGroup.getChildren();

    this.squirrelGroup.getChildren().forEach(sq => {
      const target = this.getNearestTomato(sq.x, sq.y, tomatoes);
      if (!target) return;
      this.physics.moveToObject(sq, target, sq.speed);
    });

    // lose condition
    if (this.tomatoGroup.countActive(true) === 0) this.GameOver();
  }

  initVariables() {
    this.score = 0;
    this.centreX = this.scale.width * 0.5;
    this.centreY = this.scale.height * 0.5;

    this.spawnSquirrelCounter = 0;
    this.gameStarted = false;
    this.isGameOver = false;
    this.diff = DIFF_SETTINGS[this.difficulty];
    this.players = [this.player1, this.player2];

  }

  initGameUi() {
    this.tutorialText = this.add.text(this.centreX, this.centreY, 'Press SPACE to start!', {
      fontFamily: 'Arial Black', fontSize: 42, color: '#ffffff',
      stroke: '#000000', strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(100);

    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontFamily: 'Arial Black', fontSize: 28, color: '#ffffff',
      stroke: '#000000', strokeThickness: 8,
    }).setDepth(100);

    this.diffText = this.add.text(20, 55, `Difficulty: ${this.diff.name}`, {
      fontFamily: 'Arial Black',
      fontSize: 20,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setDepth(100);

    this.gameOverText = this.add.text(this.scale.width * 0.5, this.scale.height * 0.5, 'Game Over', {
      fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
      stroke: '#000000', strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setDepth(100).setVisible(false);
  }

  initAnimations() {
    this.anims.create({
      key: ANIMATION.explosion.key,
      frames: this.anims.generateFrameNumbers(ANIMATION.explosion.texture, ANIMATION.explosion.config),
      frameRate: ANIMATION.explosion.frameRate,
      repeat: ANIMATION.explosion.repeat
    });
  }

  initPhysics() {
    this.squirrelGroup = this.physics.add.group();

    this.playerBulletGroup = this.physics.add.group({
      classType: PlayerBullet,
      runChildUpdate: true
    });

    this.tomatoGroup = this.physics.add.staticGroup();

    // bullets -> squirrels
    this.physics.add.overlap(this.playerBulletGroup, this.squirrelGroup, this.hitSquirrel, null, this);

    // squirrels -> tomatoes
    this.physics.add.overlap(this.squirrelGroup, this.tomatoGroup, this.squirrelBiteTomato, null, this);

    // squirrels -> players (both)
    this.physics.add.overlap(this.player1, this.squirrelGroup, this.hitPlayer, null, this);
    this.physics.add.overlap(this.player2, this.squirrelGroup, this.hitPlayer, null, this);

    // this.players.forEach(p => {
    //   this.physics.add.overlap(p, this.squirrelGroup, this.hitPlayer, null, this);
    // });

  }

  // initPlayers() {
  //   const y = this.scale.height - 100;

  //   this.player1 = new Player(this, this.centreX - 150, y);
  //   this.player2 = new Player(this, this.centreX + 150, y);

  //   // optional: visual difference
  //   this.player1.setTint(0xffffff);
  //   this.player2.setTint(0xffe0b2);

  //   this.players = [this.player1, this.player2];
  // }

//   initPlayer() {
//   const y = this.scale.height - 100;

//   // Player 1 (Nonno)
//   this.player1 = new Player(this, this.centreX - 120, y, ASSETS.image.grandpa.key, this.p1Keys);

//   // Player 2 (Nonna)
//   this.player2 = new Player(this, this.centreX + 120, y, ASSETS.image.nonna.key, this.p2Keys);

//   this.players = [this.player1, this.player2];
// }

initPlayer() {
  const y = this.scale.height - 100;

  // Player 1 (Nonno)
  this.player1 = new Player(this, this.centreX - 120, y, ASSETS.image.grandpa.key, this.p1Keys);

  // Player 2 (Nonna)
  this.player2 = new Player(this, this.centreX + 120, y, ASSETS.image.grandma.key, this.p2Keys);

  this.players = [this.player1, this.player2];
}


  // controls: P1 shoots with UP, P2 shoots with W
  initInput() {
    // start game
    this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.startKey.once('down', () => this.startGame());

    // Player 1: arrows (left/right), UP to shoot
    this.p2Keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      fire: Phaser.Input.Keyboard.KeyCodes.UP,
    });

    // Player 2: A/D to move, W to shoot
    this.p1Keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      fire: Phaser.Input.Keyboard.KeyCodes.W,
    });
  }

  handlePlayer(player, keys) {
    if (!player || !player.active) return;

    // lock vertical
    player.body.velocity.y = 0;

    if (keys.left.isDown) {
      player.body.velocity.x -= player.velocityIncrement;
    }

    if (keys.right.isDown) {
      player.body.velocity.x += player.velocityIncrement;
    }

    if (Phaser.Input.Keyboard.JustDown(keys.fire)) {
      player.tryFire();
    }
  }

  initTomatoes() {
    const y = this.scale.height - 80;

    [250,485,720,955].forEach(x => {
      const tomato = this.tomatoGroup.create(x, y, ASSETS.image.tomato.key);

      tomato.setScale(0.08);
      tomato.refreshBody();

      tomato.health = 5;
      tomato.setDepth(5);
    });
  }

  initSpawning() {
    this.spawnSquirrelCounter = 60;
  }

  spawnSquirrelWave() {
    this.spawnSquirrelCounter = Phaser.Math.RND.between(
      this.diff.spawnDelayMin,
      this.diff.spawnDelayMax
    );

    const count = Phaser.Math.RND.between(
      this.diff.spawnCountMin,
      this.diff.spawnCountMax
    );

    for (let i = 0; i < count; i++) {
      this.spawnSquirrel();
    }
  }

  spawnSquirrel() {
    const x = Phaser.Math.Between(80, this.scale.width - 80);
    const y = -30;

    const squirrel = this.physics.add.sprite(x, y, ASSETS.image.squirrel.key);
    squirrel.setScale(0.08);

    squirrel.health = 2;
    squirrel.speed = Phaser.Math.Between(this.diff.squirrelSpeedMin, this.diff.squirrelSpeedMax);
    squirrel.damage = 1;
    squirrel.setDepth(10);

    this.squirrelGroup.add(squirrel);
  }

  startGame() {
    this.gameStarted = true;
    this.tutorialText.setVisible(false);
    this.spawnSquirrelWave();
  }

  // bullets always go upward
  fireBullet(x, y) {
    const bullet = new PlayerBullet(this, x, y, 1);
    this.playerBulletGroup.add(bullet);
  }

  removeBullet(bullet) {
    this.playerBulletGroup.remove(bullet, true, true);
  }

  addExplosion(x, y) {
    new Explosion(this, x, y);
  }

//   // squirrels touching a player
//   hitPlayer(player, obstacle) {
//     // Easy: contact doesn’t kill
//     if (!this.diff.contactKills) {
//       if (typeof obstacle.die === 'function') obstacle.die();
//       else obstacle.destroy();
//       return;
//     }

    

//     // Normal/Hard: contact kills (or damages)
//     this.addExplosion(player.x, player.y);

//     const damage = (typeof obstacle.getPower === 'function')
//       ? obstacle.getPower()
//       : (obstacle.damage ?? 1);

//     player.hit(damage);

//     if (typeof obstacle.die === 'function') obstacle.die();
//     else obstacle.destroy();

//     this.GameOver();
//   }

    hitPlayer(player, obstacle) {
        // Easy mode: contact doesn't kill
        if (!this.diff.contactKills) {
            if (typeof obstacle.die === 'function') obstacle.die();
            else obstacle.destroy();
            return;
        }

        // Damage
        const damage = (typeof obstacle.getPower === 'function')
            ? obstacle.getPower()
            : (obstacle.damage ?? 1);

        player.hit(damage);

        // Remove squirrel
        if (typeof obstacle.die === 'function') obstacle.die();
        else obstacle.destroy();

        // check who is alive
        const anyoneAlive = this.players.some(p => p && p.active);

        if (anyoneAlive) {
            this.add.text(
            this.centreX,
            this.centreY - 120,
            'Player down!',
            {
                fontFamily: 'Arial Black',
                fontSize: 36,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8,
            }
            )
            .setOrigin(0.5)
            .setDepth(200)
            .setAlpha(0.9);

            // (optional delay for dramatic pause)
            this.time.delayedCall(800, () => {}, [], this);

            return; 
        }

    this.GameOver(); // if both die
    }


  hitSquirrel(bullet, squirrel) {
    this.updateScore(5);

    if (typeof bullet.remove === 'function') bullet.remove();
    else bullet.destroy();

    squirrel.health -= 1;
    if (squirrel.health <= 0) {
      this.addExplosion(squirrel.x, squirrel.y);
      squirrel.destroy();
    }
  }

  updateScore(points) {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  GameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.gameStarted = false;
    this.gameOverText.setVisible(true);

    this.physics.pause();

    const cx = this.scale.width * 0.5;
    const cy = this.scale.height * 0.5;

    this.restartText = this.add.text(cx, cy + 90, 'Press R or click to restart', {
      fontFamily: 'Arial Black',
      fontSize: 28,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(200);

    this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.input.once('pointerdown', () => this.restartGame());
  }

  restartGame() {
    this.scene.restart({ difficulty: this.difficulty });
  }

  getNearestTomato(x, y, tomatoes) {
    let best = null;
    let bestD = Infinity;
    for (const t of tomatoes) {
      const d = Phaser.Math.Distance.Between(x, y, t.x, t.y);
      if (d < bestD) { bestD = d; best = t; }
    }
    return best;
  }

  squirrelBiteTomato(squirrel, tomato) {
    if (squirrel.lastBiteTime && this.time.now - squirrel.lastBiteTime < 500) return;
    squirrel.lastBiteTime = this.time.now;

    tomato.health -= 1;

    if (tomato.health <= 0) {
      this.addTomatoSplat(tomato.x, tomato.y);
      tomato.destroy();
    }

    this.addExplosion(squirrel.x, squirrel.y);
    squirrel.destroy();
  }

  addTomatoSplat(x, y) {
    const splat = this.add.image(x, y, 'tomatoBullet');
    splat.setDepth(6);
    splat.setScale(0.15);

    this.tweens.add({
      targets: splat,
      alpha: 0,
      duration: 800,
      delay: 300,
      onComplete: () => splat.destroy()
    });
  }
}
