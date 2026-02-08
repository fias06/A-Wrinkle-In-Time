import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PLAYER_SIZE = 40;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 5;

const CoopGame = forwardRef(function CoopGame({ 
  isPlayer1, 
  onGameAction,
  remoteAction,
  className 
}, ref) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState({
    player1: { x: 100, y: 400, vy: 0, onGround: true },
    player2: { x: 650, y: 400, vy: 0, onGround: true },
    door1Open: false,
    door2Open: false,
    levelComplete: false
  });

  // Game level definition
  const level = {
    platforms: [
      { x: 0, y: 460, width: 800, height: 40 }, // Ground
      { x: 200, y: 350, width: 150, height: 20 },
      { x: 450, y: 350, width: 150, height: 20 },
      { x: 100, y: 250, width: 100, height: 20 },
      { x: 600, y: 250, width: 100, height: 20 },
      { x: 300, y: 150, width: 200, height: 20 },
    ],
    buttons: [
      { x: 130, y: 230, width: 40, height: 20, color: '#F59E0B', opens: 'door2' },
      { x: 630, y: 230, width: 40, height: 20, color: '#8B5CF6', opens: 'door1' },
    ],
    doors: [
      { x: 320, y: 110, width: 30, height: 40, id: 'door1', color: '#F59E0B' },
      { x: 450, y: 110, width: 30, height: 40, id: 'door2', color: '#8B5CF6' },
    ],
    goal: { x: 380, y: 110, width: 40, height: 40 }
  };

  // Handle remote actions from other player
  useEffect(() => {
    if (remoteAction) {
      handleAction(remoteAction, false);
    }
  }, [remoteAction]);

  const handleAction = useCallback((action, isLocal = true) => {
    if (isLocal && onGameAction) {
      onGameAction(action);
    }

    setGameState(prev => {
      const playerKey = (isLocal ? isPlayer1 : !isPlayer1) ? 'player1' : 'player2';
      const player = { ...prev[playerKey] };

      switch (action) {
        case 'jump':
          if (player.onGround) {
            player.vy = JUMP_FORCE;
            player.onGround = false;
          }
          break;
        case 'left':
          player.x = Math.max(0, player.x - MOVE_SPEED * 3);
          break;
        case 'right':
          player.x = Math.min(CANVAS_WIDTH - PLAYER_SIZE, player.x + MOVE_SPEED * 3);
          break;
      }

      return { ...prev, [playerKey]: player };
    });
  }, [isPlayer1, onGameAction]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const gameLoop = () => {
      if (isPaused) return;

      setGameState(prev => {
        const newState = { ...prev };

        // Update both players
        ['player1', 'player2'].forEach(key => {
          const player = { ...newState[key] };
          
          // Apply gravity
          player.vy += GRAVITY;
          player.y += player.vy;

          // Check platform collisions
          player.onGround = false;
          level.platforms.forEach(platform => {
            if (
              player.x + PLAYER_SIZE > platform.x &&
              player.x < platform.x + platform.width &&
              player.y + PLAYER_SIZE > platform.y &&
              player.y + PLAYER_SIZE < platform.y + platform.height + player.vy + 1
            ) {
              player.y = platform.y - PLAYER_SIZE;
              player.vy = 0;
              player.onGround = true;
            }
          });

          newState[key] = player;
        });

        // Check button presses
        level.buttons.forEach(button => {
          ['player1', 'player2'].forEach(key => {
            const player = newState[key];
            if (
              player.x + PLAYER_SIZE > button.x &&
              player.x < button.x + button.width &&
              player.y + PLAYER_SIZE >= button.y &&
              player.y + PLAYER_SIZE <= button.y + button.height + 10
            ) {
              if (button.opens === 'door1') newState.door1Open = true;
              if (button.opens === 'door2') newState.door2Open = true;
            }
          });
        });

        // Check win condition
        if (newState.door1Open && newState.door2Open) {
          const goal = level.goal;
          ['player1', 'player2'].forEach(key => {
            const player = newState[key];
            if (
              player.x + PLAYER_SIZE > goal.x &&
              player.x < goal.x + goal.width &&
              player.y + PLAYER_SIZE > goal.y &&
              player.y < goal.y + goal.height
            ) {
              newState.levelComplete = true;
            }
          });
        }

        return newState;
      });

      // Render
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Platforms
      level.platforms.forEach(p => {
        ctx.fillStyle = '#475569';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = '#64748B';
        ctx.fillRect(p.x, p.y, p.width, 4);
      });

      // Buttons
      level.buttons.forEach(button => {
        ctx.fillStyle = button.color;
        ctx.fillRect(button.x, button.y, button.width, button.height);
      });

      // Doors
      level.doors.forEach(door => {
        const isOpen = (door.id === 'door1' && gameState.door1Open) ||
                       (door.id === 'door2' && gameState.door2Open);
        ctx.fillStyle = isOpen ? '#22C55E' : door.color;
        ctx.globalAlpha = isOpen ? 0.3 : 1;
        ctx.fillRect(door.x, door.y, door.width, door.height);
        ctx.globalAlpha = 1;
      });

      // Goal
      if (gameState.door1Open && gameState.door2Open) {
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.moveTo(level.goal.x + 20, level.goal.y);
        ctx.lineTo(level.goal.x + 40, level.goal.y + 40);
        ctx.lineTo(level.goal.x, level.goal.y + 40);
        ctx.closePath();
        ctx.fill();
      }

      // Player 1 (Gold)
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(
        gameState.player1.x + PLAYER_SIZE / 2,
        gameState.player1.y + PLAYER_SIZE / 2,
        PLAYER_SIZE / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.fillStyle = '#FEF3C7';
      ctx.beginPath();
      ctx.arc(
        gameState.player1.x + PLAYER_SIZE / 2 - 5,
        gameState.player1.y + PLAYER_SIZE / 2 - 5,
        5,
        0,
        Math.PI * 2
      );
      ctx.arc(
        gameState.player1.x + PLAYER_SIZE / 2 + 5,
        gameState.player1.y + PLAYER_SIZE / 2 - 5,
        5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Player 2 (Purple)
      ctx.fillStyle = '#8B5CF6';
      ctx.beginPath();
      ctx.arc(
        gameState.player2.x + PLAYER_SIZE / 2,
        gameState.player2.y + PLAYER_SIZE / 2,
        PLAYER_SIZE / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.fillStyle = '#EDE9FE';
      ctx.beginPath();
      ctx.arc(
        gameState.player2.x + PLAYER_SIZE / 2 - 5,
        gameState.player2.y + PLAYER_SIZE / 2 - 5,
        5,
        0,
        Math.PI * 2
      );
      ctx.arc(
        gameState.player2.x + PLAYER_SIZE / 2 + 5,
        gameState.player2.y + PLAYER_SIZE / 2 - 5,
        5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Player labels
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#F59E0B';
      ctx.fillText('Gold', gameState.player1.x + PLAYER_SIZE / 2, gameState.player1.y - 10);
      ctx.fillStyle = '#8B5CF6';
      ctx.fillText('Silver', gameState.player2.x + PLAYER_SIZE / 2, gameState.player2.y - 10);

      // Level complete overlay
      if (gameState.levelComplete) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#22C55E';
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 Level Complete! 🎉', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, gameState.door1Open, gameState.door2Open, gameState.levelComplete]);

  const resetGame = () => {
    setGameState({
      player1: { x: 100, y: 400, vy: 0, onGround: true },
      player2: { x: 650, y: 400, vy: 0, onGround: true },
      door1Open: false,
      door2Open: false,
      levelComplete: false
    });
  };

  // Expose voice action handler via ref
  useImperativeHandle(ref, () => ({
    handleVoiceAction: (action) => {
      if (action === 'jump' || action === 'left' || action === 'right') {
        handleAction(action);
      } else if (action === 'pause') {
        setIsPaused(p => !p);
      } else if (action === 'reset') {
        resetGame();
      }
    }
  }));

  const myColor = isPlayer1 ? 'amber' : 'violet';

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Game info */}
      <div className="flex items-center justify-between w-full max-w-[800px] px-4">
        <div className={cn(
          "px-4 py-2 rounded-xl font-semibold text-lg",
          isPlayer1 ? "bg-amber-100 text-amber-800" : "bg-violet-100 text-violet-800"
        )}>
          You control: {isPlayer1 ? '🟡 Gold' : '🟣 Silver'}
        </div>
        
        <div className="flex gap-2">
          <motion.button
            onClick={() => setIsPaused(!isPaused)}
            className="p-3 bg-slate-200 rounded-xl hover:bg-slate-300"
            whileTap={{ scale: 0.95 }}
          >
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </motion.button>
          <motion.button
            onClick={resetGame}
            className="p-3 bg-slate-200 rounded-xl hover:bg-slate-300"
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="w-6 h-6" />
          </motion.button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="rounded-2xl border-4 border-slate-700 shadow-2xl"
      />

      {/* Touch controls */}
      <div className="flex items-center gap-8 mt-4">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <motion.button
            onTouchStart={() => handleAction('jump')}
            onMouseDown={() => handleAction('jump')}
            className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center",
              `bg-${myColor}-500 text-white shadow-lg`
            )}
            style={{ backgroundColor: isPlayer1 ? '#F59E0B' : '#8B5CF6' }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronUp className="w-8 h-8" />
          </motion.button>
          <div />
          <motion.button
            onTouchStart={() => handleAction('left')}
            onMouseDown={() => handleAction('left')}
            className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center",
              `bg-${myColor}-500 text-white shadow-lg`
            )}
            style={{ backgroundColor: isPlayer1 ? '#F59E0B' : '#8B5CF6' }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="w-8 h-8" />
          </motion.button>
          <div className="w-16 h-16" />
          <motion.button
            onTouchStart={() => handleAction('right')}
            onMouseDown={() => handleAction('right')}
            className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center",
              `bg-${myColor}-500 text-white shadow-lg`
            )}
            style={{ backgroundColor: isPlayer1 ? '#F59E0B' : '#8B5CF6' }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-8 h-8" />
          </motion.button>
        </div>

        <div className="text-center">
          <p className="text-lg text-slate-600 font-medium">Or say:</p>
          <p className="text-xl font-semibold text-slate-800">"Jump", "Left", "Right"</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-slate-100 rounded-xl p-4 max-w-[800px] w-full">
        <p className="text-center text-lg text-slate-700">
          <strong>Goal:</strong> Work together! Gold stands on the purple button, Silver stands on the gold button, then both reach the green goal!
        </p>
      </div>
    </div>
  );
});

export default CoopGame;