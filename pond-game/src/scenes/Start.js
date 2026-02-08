export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        this.load.image('background', 'assets/pond.png');
        this.load.image('logo', 'assets/logo.png');

        //  The ship sprite is CC0 from https://ansimuz.itch.io - check out his other work!
        this.load.spritesheet('ship', 'assets/spaceship.png', { frameWidth: 176, frameHeight: 96 });
    }

    create() {
    this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');

    // this.add.text(640, 200, 'Pond Madness', {
    //     fontFamily: 'Times New Roman',
    //     fontSize: '60px',
    //     color: '#0d091f'
    // }).setOrigin(0.5);

    const logo = this.add.image(650, 260, 'logo');
    logo.setScale(0.15); // 30% of original size


    this.add.text(640, 500, 'Player 1: WASD\nPlayer 2: Arrow Keys', {
        fontFamily: 'Times New Roman',
        fontSize: '28px',
        color: '#1a1438',
        align: 'center'
    }).setOrigin(0.5);

    const startText = this.add.text(640, 650, 'Click anywhere to start', {
        fontFamily: 'Times New Roman',
        fontSize: '32px',
        color: '#1a1438'
    }).setOrigin(0.5);

    // subtle pulse animation (accessible, not flashy)
    this.tweens.add({
        targets: startText,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1
    });

    // START GAME
    this.input.once('pointerdown', () => {
        this.scene.start('Game');
    });
}


    // create() {
    //     this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');

    //     const logo = this.add.image(640, 200, 'logo');

    //     const ship = this.add.sprite(640, 360, 'ship');

    //     ship.anims.create({
    //         key: 'fly',
    //         frames: this.anims.generateFrameNumbers('ship', { start: 0, end: 2 }),
    //         frameRate: 15,
    //         repeat: -1
    //     });

    //     ship.play('fly');

    //     this.tweens.add({
    //         targets: logo,
    //         y: 400,
    //         duration: 1500,
    //         ease: 'Sine.inOut',
    //         yoyo: true,
    //         loop: -1
    //     });
    // }

    update() {
        this.background.tilePositionX += 2;
    }
    
}
