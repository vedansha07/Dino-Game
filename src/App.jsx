import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const App = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dinoPosition, setDinoPosition] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState([]);

  const gameAreaRef = useRef(null);
  const dinoRef = useRef(null);
  const animationRef = useRef();
  const lastObstacleTimeRef = useRef(0);
  const obstacleSpeed = 6;
  const spawnRate = 1500;

  // Jump function
  const jump = useCallback(() => {
    if (!isJumping && gameStarted && !gameOver) {
      setIsJumping(true);
      let jumpHeight = 0;
      const jumpUp = setInterval(() => {
        jumpHeight += 4;
        setDinoPosition(jumpHeight);
        if (jumpHeight >= 100) {
          clearInterval(jumpUp);
          const jumpDown = setInterval(() => {
            jumpHeight -= 4;
            setDinoPosition(jumpHeight);
            if (jumpHeight <= 0) {
              clearInterval(jumpDown);
              setDinoPosition(0);
              setIsJumping(false);
            }
          }, 20);
        }
      }, 20);
    }
  }, [isJumping, gameStarted, gameOver]);

  // Start game
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setObstacles([]);
    setDinoPosition(0);
    setIsJumping(false);
    lastObstacleTimeRef.current = 0;
  };

  // Handle key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!gameStarted) {
          startGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, jump]);

  // Collision Detection
  const checkCollision = useCallback(() => {
    if (!dinoRef.current || !gameAreaRef.current) return false;

    const dinoRect = dinoRef.current.getBoundingClientRect();
    const gameRect = gameAreaRef.current.getBoundingClientRect();

    // Convert dino position to game area coordinates
    const dino = {
      left: dinoRect.left - gameRect.left,
      right: dinoRect.right - gameRect.left,
      bottom: dinoRect.bottom - gameRect.top,
      top: dinoRect.top - gameRect.top,
    };

    for (const obstacle of obstacles) {
      const obstacleLeft = obstacle.left;
      const obstacleRight = obstacle.left + obstacle.width;
      const obstacleTop = gameRect.height - obstacle.height;

      // Collision logic
      if (
        dino.right > obstacleLeft &&
        dino.left < obstacleRight &&
        dino.bottom > obstacleTop
      ) {
        return true;
      }
    }
    return false;
  }, [obstacles]);

  // Game loop
  const gameLoop = useCallback(
    (timestamp) => {
      if (!gameStarted || gameOver) {
        return;
      }

      // Spawn obstacles
      if (timestamp - lastObstacleTimeRef.current > spawnRate) {
        const height = Math.random() > 0.5 ? 30 : 50;
        setObstacles((prev) => [
          ...prev,
          {
            id: Date.now(),
            left: gameAreaRef.current.offsetWidth,
            height: height,
            width: 20,
          },
        ]);
        lastObstacleTimeRef.current = timestamp;
      }

      // Move obstacles
      setObstacles((prev) =>
        prev
          .map((obstacle) => ({
            ...obstacle,
            left: obstacle.left - obstacleSpeed,
          }))
          .filter((obstacle) => obstacle.left > -obstacle.width)
      );

      // Update score
      setScore((prev) => prev + 1);

      // Check for collisions
      if (checkCollision()) {
        setGameOver(true);
        setHighScore((prev) => Math.max(prev, score));
        return;
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    },
    [gameStarted, gameOver, score, checkCollision]
  );

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  return (
    <div className="game-container">
      <div ref={gameAreaRef} className="game-area" onClick={() => !gameStarted && startGame()}>
        {!gameStarted && <div className="start-screen"><p>Press Space to start</p></div>}
        {gameOver && (
          <div className="game-over">
            <div className="game-over-score">Score: {score}</div>
            <div className="game-over-high-score">High Score: {highScore}</div>
            <div className="game-over-restart" onClick={startGame}>Click here to restart</div>
          </div>
        )}
        <div ref={dinoRef} className={`dino ${isJumping ? 'jumping' : ''}`} style={{ bottom: `${dinoPosition}px` }} />
        {obstacles.map((obstacle) => (
          <div key={obstacle.id} className="obstacle" style={{ left: `${obstacle.left}px`, height: `${obstacle.height}px`, width: `${obstacle.width}px`, bottom: '0' }} />
        ))}
        <div className="ground" />
      </div>
      <div className="score-display">
        <div className="current-score">Score: {score}</div>
        <div className="best-score">High Score: {highScore}</div>
      </div>
    </div>
  );
};

export default App;
