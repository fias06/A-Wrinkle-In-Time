import ASSETS from '../assets.js';

export default class PlayerBullet extends Phaser.Physics.Arcade.Sprite {
  power = 1;
  moveVelocity = 1000;

  constructor(scene, x, y, power = 1) {
    super(scene, x, y, ASSETS.spritesheet.tiles.key, power - 1);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.power = power;

    // Physics flags
    this.body.setAllowGravity(false);
    this.setImmovable(false);

    this.setSize(12, 32);
    this.setDepth(10);

    // ✅ Use the Sprite helper (more reliable than body.setVelocity here)
    this.setVelocity(0, -this.moveVelocity);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // Safety: if something nuked velocity, re-apply
    if (this.body && this.body.velocity.y === 0) {
      this.setVelocity(0, -this.moveVelocity);
    }

    if (this.y < -50) {
      this.destroy(); // simplest cleanup
      // (or: this.scene.removeBullet(this); if you prefer your group removal)
    }
  }

  getPower() {
    return this.power;
  }
}
