// import { Start } from './scenes/Start.js';

// const config = {
//     type: Phaser.AUTO,
//     title: 'Overlord Rising',
//     description: '',
//     parent: 'game-container',
//     width: 1280,
//     height: 720,
//     backgroundColor: '#000000',
//     pixelArt: true,
//     scene: [
//         Start
//     ],
//     scale: {
//         mode: Phaser.Scale.FIT,
//         autoCenter: Phaser.Scale.CENTER_BOTH
//     },
// }

// new Phaser.Game(config);

import { Start } from './scenes/Start.js';
import { Game } from './scenes/Game.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#000000',
  scene: [Start, Game],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  
};

new Phaser.Game(config);
