export default class Tomato extends Phaser.Physics.Arcade.Sprite {
  health = 5;

  constructor(scene, x, y) {
    super(scene, x, y, 'tomato'); // or tiles sprite frame
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.body.setAllowGravity(false);
    this.setDepth(5);
  }

  hit(dmg = 1) {
    this.health -= dmg;
    if (this.health <= 0) this.die();
  }

  die() {
    this.scene.addExplosion(this.x, this.y);
    this.destroy();
    this.scene.onTomatoDestroyed?.(); // optional callback
  }
}
