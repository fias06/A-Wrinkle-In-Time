
// src/gameObjects/Player.js
import ASSETS from '../assets.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  velocityIncrement = 50;
  velocityMax = 500;
  drag = 1000;

  fireRate = 10;
  fireCounter = 0;

  health = 1;

  constructor(scene, x, y, textureKey = ASSETS.image.grandpa.key, keys = null) {
    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene = scene;
    this.keys = keys; // may be null until Game.initInput runs

    this.setScale(0.10);
    this.setCollideWorldBounds(true);
    this.setDepth(100);

    this.body.setAllowGravity(false); // no gravity
    this.setMaxVelocity(this.velocityMax);
    this.setDrag(this.drag);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.fireCounter > 0) this.fireCounter--;

    // lock vertical movement always
    if (this.body) this.body.velocity.y = 0;

    // only read input if keys exist (prevents: this.keys.left undefined)
    if (this.keys && this.keys.left && this.keys.right && this.keys.fire) {
      this.checkInput();
    }
  }

  checkInput() {
    // Left / right only
    if (this.keys.left.isDown) this.body.velocity.x -= this.velocityIncrement;
    if (this.keys.right.isDown) this.body.velocity.x += this.velocityIncrement;

    // Fire (UP for p1, W for p2)
    if (Phaser.Input.Keyboard.JustDown(this.keys.fire)) {
      this.fire();
    }
  }

  fire() {
    if (this.fireCounter > 0) return;
    this.fireCounter = this.fireRate;

    // spawn bullet a bit above the sprite so it doesn't "stick" in the player
    const spawnY = this.y - (this.displayHeight * 0.35);
    this.scene.fireBullet(this.x, spawnY);
  }

  hit(damage = 1) {
    this.health -= damage;
    if (this.health <= 0) this.die();
  }

  die() {
    if (!this.active) return;
    this.scene.addExplosion(this.x, this.y);
    this.destroy();
  }

  // Optional helper if you want to set keys after construction:
  setKeys(keys) {
    this.keys = keys;
  }
}
