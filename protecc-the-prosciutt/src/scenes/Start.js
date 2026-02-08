export class Start extends Phaser.Scene {
  constructor() {
    super('Start');
  }

  create() {
    const cx = this.scale.width * 0.5;
    const cy = this.scale.height * 0.5;

    this.cameras.main.setBackgroundColor('#6fbf4a');

    this.add.text(cx, 140, "Rodent Rampage", {
      fontFamily: 'Arial Black',
      fontSize: 54,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 10,
    }).setOrigin(0.5);

    this.add.text(cx, 220, "Choose difficulty", {
      fontFamily: 'Arial Black',
      fontSize: 28,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const makeButton = (y, label, difficulty) => {
      const btn = this.add.text(cx, y, label, {
        fontFamily: 'Arial Black',
        fontSize: 36,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 10,
        backgroundColor: '#2f6e2f',
        padding: { left: 22, right: 22, top: 14, bottom: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setScale(1.05));
      btn.on('pointerout', () => btn.setScale(1.00));

      btn.on('pointerdown', () => {
        this.scene.start('Game', { difficulty }); // ✅ pass to Game
      });

      return btn;
    };

    makeButton(320, "Easy", 0);
    makeButton(410, "Normal", 1);
    makeButton(500, "Hard", 2);

    this.add.text(cx, 620, "Arrow keys to move • Space to throw tomatoes", {
      fontFamily: 'Arial',
      fontSize: 22,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);
  }
}
