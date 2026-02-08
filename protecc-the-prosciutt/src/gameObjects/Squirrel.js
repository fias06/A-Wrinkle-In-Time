export default class Squirrel extends Phaser.Physics.Arcade.Sprite {
  health = 2;
  speed = 120;
  damage = 1;

  constructor(scene, x, y) {
    super(scene, x, y, 'squirrel');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(10);
    this.scene = scene;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    const target = this.scene.getNearestTomato(this.x, this.y);
    if (!target) {
      this.setVelocity(0, 0);
      return;
    }

    this.scene.physics.moveToObject(this, target, this.speed);
  }

  hit(dmg) {
    this.health -= dmg;
    if (this.health <= 0) this.die();
  }

  die() {
    this.scene.addExplosion(this.x, this.y);
    this.destroy();
  }
}
