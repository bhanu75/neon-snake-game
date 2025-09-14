import React, { useState, useEffect, useCallback, useRef } from 'react';

const BOARD_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_DIRECTION = { x: 0, y: -1 };

const SnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [gameSpeed, setGameSpeed] = useState('medium');
  const gameAreaRef = useRef(null);

  const speedSettings = {
    easy: { interval: 200, label: '🐌 EASY', color: 'text-green-400' },
    medium: { interval: 120, label: '🚀 MEDIUM', color: 'text-yellow-400' },
    hard: { interval: 80, label: '⚡ HARD', color: 'text-red-400' },
    insane: { interval: 50, label: '💀 INSANE', color: 'text-purple-400' }
  };

  const generateFood = useCallback(() => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE)
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setGameOver(false);
    setScore(0);
    setIsPlaying(false);
  };

  const startGame = () => {
    resetGame();
    setIsPlaying(true);
  };

  const changeDirection = (newDirection) => {
    if (!isPlaying) return;
    
    // Prevent reverse direction
    if (direction.x === -newDirection.x && direction.y === -newDirection.y) return;
    
    setDirection(newDirection);
  };

  // Touch/Swipe Controls
  const handleTouchStart = (e) => {
    if (!isPlaying) return;
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY
    });
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || !isPlaying) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          changeDirection({ x: 1, y: 0 }); // Right
        } else {
          changeDirection({ x: -1, y: 0 }); // Left
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          changeDirection({ x: 0, y: 1 }); // Down
        } else {
          changeDirection({ x: 0, y: -1 }); // Up
        }
      }
    }
    
    setTouchStart(null);
  };

  // Click/Touch Area Controls
  const handleAreaTouch = (e) => {
    if (!isPlaying) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal movement
      if (deltaX > 0) {
        changeDirection({ x: 1, y: 0 }); // Right
      } else {
        changeDirection({ x: -1, y: 0 }); // Left
      }
    } else {
      // Vertical movement
      if (deltaY > 0) {
        changeDirection({ x: 0, y: 1 }); // Down
      } else {
        changeDirection({ x: 0, y: -1 }); // Up
      }
    }
  };

  const moveSnake = useCallback(() => {
    if (!isPlaying || gameOver) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };
      
      head.x += direction.x;
      head.y += direction.y;

      // Check wall collision
      if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE) {
        setGameOver(true);
        setIsPlaying(false);
        if (score > highScore) {
          setHighScore(score);
        }
        return currentSnake;
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setIsPlaying(false);
        if (score > highScore) {
          setHighScore(score);
        }
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        const speedMultiplier = {
          easy: 1,
          medium: 1.5,
          hard: 2,
          insane: 3
        };
        setScore(prev => prev + Math.floor(10 * speedMultiplier[gameSpeed]));
        setFood(generateFood());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, isPlaying, gameOver, food, score, highScore, generateFood, gameSpeed]);

  const handleKeyPress = useCallback((e) => {
    if (!isPlaying) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        changeDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
        e.preventDefault();
        changeDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        changeDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
        e.preventDefault();
        changeDirection({ x: 1, y: 0 });
        break;
    }
  }, [isPlaying]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    const gameInterval = setInterval(moveSnake, speedSettings[gameSpeed].interval);
    return () => clearInterval(gameInterval);
  }, [moveSnake, gameSpeed]);

  const renderCell = (x, y) => {
    const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
    const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
    const isFood = food.x === x && food.y === y;

    let cellClass = "w-4 h-4 ";
    
    if (isSnakeHead) {
      cellClass += "bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-lg shadow-lg shadow-cyan-500/50 animate-pulse";
    } else if (isSnakeBody) {
      cellClass += "bg-gradient-to-br from-cyan-300 via-blue-400 to-purple-500 rounded-md shadow-md";
    } else if (isFood) {
      cellClass += "bg-gradient-to-br from-pink-400 via-red-500 to-orange-600 rounded-full shadow-lg shadow-red-500/50 animate-bounce";
    } else {
      cellClass += "bg-gray-800/30 border border-gray-700/20 rounded-sm";
    }

    return <div key={`${x}-${y}`} className={cellClass} />;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl shadow-2xl shadow-cyan-500/20 p-6 max-w-md w-full border border-gray-700">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
            🐍 NEON SNAKE
          </h1>
          <p className="text-gray-400 text-sm">Touch anywhere to control</p>
        </div>

        {/* Speed Control */}
        <div className="mb-4 bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
          <div className="text-center text-sm text-gray-400 mb-3 font-semibold">🎮 GAME SPEED</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(speedSettings).map(([speed, config]) => (
              <button
                key={speed}
                onClick={() => setGameSpeed(speed)}
                disabled={isPlaying}
                className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all duration-200 ${
                  gameSpeed === speed
                    ? `${config.color} border-current bg-current/20 shadow-lg scale-105`
                    : 'text-gray-400 border-gray-600 hover:border-gray-500 bg-gray-800/50 hover:bg-gray-700/50'
                } ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer active:scale-95'}`}
              >
                {config.label}
              </button>
            ))}
          </div>
          {isPlaying && (
            <div className="text-center text-xs text-gray-500 mt-2">
              ⚠️ Speed locked during game
            </div>
          )}
        </div>

        {/* Score Board */}
        <div className="flex justify-between items-center mb-6 bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
          <div className="text-center">
            <div className="text-xl font-bold text-cyan-400">{score}</div>
            <div className="text-xs text-gray-500">SCORE</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-400">{highScore}</div>
            <div className="text-xs text-gray-500">BEST</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-400">{snake.length}</div>
            <div className="text-xs text-gray-500">LENGTH</div>
          </div>
        </div>

        {/* Interactive Game Board */}
        <div className="flex justify-center mb-6">
          <div 
            ref={gameAreaRef}
            className="grid gap-0.5 bg-gray-900 p-3 rounded-2xl border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/20 cursor-pointer select-none"
            style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={handleAreaTouch}
          >
            {Array.from({ length: BOARD_SIZE }, (_, y) =>
              Array.from({ length: BOARD_SIZE }, (_, x) => renderCell(x, y))
            )}
          </div>
        </div>

        {/* Game Status */}
        <div className="text-center mb-6">
          {!isPlaying && !gameOver && (
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-cyan-500/30 transform hover:scale-105 transition-all duration-200 border border-cyan-400/30"
            >
              ▶️ START GAME
            </button>
          )}

          {gameOver && (
            <div className="space-y-4">
              <div className="text-xl font-bold text-red-400 animate-pulse">💀 GAME OVER</div>
              <div className="text-gray-300">Score: <span className="font-bold text-cyan-400">{score}</span></div>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🔄 RETRY
              </button>
            </div>
          )}

          {isPlaying && (
            <div className="space-y-3">
              <div className="text-green-400 font-bold animate-pulse">🎮 PLAYING...</div>
              <div className={`text-sm ${speedSettings[gameSpeed].color}`}>
                {speedSettings[gameSpeed].label}
              </div>
              <button
                onClick={resetGame}
                className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold py-2 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-sm"
              >
                ⏹️ STOP
              </button>
            </div>
          )}
        </div>

        {/* Control Instructions */}
        <div className="bg-gray-800/30 rounded-xl p-4 text-center border border-gray-700/50">
          <div className="text-sm text-cyan-400 font-semibold mb-2">TOUCH CONTROLS</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>📱 <strong>Tap</strong> anywhere on game board to move</div>
            <div>👆 <strong>Swipe</strong> in any direction</div>
            <div>⌨️ <strong>Arrow keys</strong> also work</div>
          </div>
          <div className="text-xs text-gray-500 mt-3">
            🎯 Eat food to grow • Avoid walls & yourself
          </div>
          <div className="text-xs text-gray-500 mt-1">
            💎 Higher speed = More points per food!
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
