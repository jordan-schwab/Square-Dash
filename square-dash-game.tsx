import React, { useState, useEffect } from 'react';

const SquareDash = () => {
  // Game constants
  const GRID_SIZE = 9;
  const INITIAL_LIVES = 3;
  const ARENA_SHRINK_INTERVAL = 5;
  const NUM_OBSTACLES = 6;
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [grid, setGrid] = useState([]);
  const [playerPos, setPlayerPos] = useState({ row: 4, col: 4 }); // 0-indexed
  const [obstaclePositions, setObstaclePositions] = useState([]);
  const [exitPos, setExitPos] = useState({ row: 0, col: 0 });
  const [turnCounter, setTurnCounter] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [moveInput, setMoveInput] = useState('');
  const [message, setMessage] = useState('');
  const [borderSize, setBorderSize] = useState(0);

  // Initialize the game
  const initializeGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setVictory(false);
    setTurnCounter(0);
    setLives(INITIAL_LIVES);
    setBorderSize(0);
    setMessage('');
    setMoveInput('');
    
    // Place player in center
    const center = Math.floor(GRID_SIZE / 2);
    setPlayerPos({ row: center, col: center });
    
    // Initialize an empty grid
    const newGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('▢'));
    
    // Place obstacles randomly (at least 3 steps from player)
    const newObstacles = [];
    for (let i = 0; i < NUM_OBSTACLES; i++) {
      let row, col;
      do {
        row = Math.floor(Math.random() * GRID_SIZE);
        col = Math.floor(Math.random() * GRID_SIZE);
      } while (
        (Math.abs(row - center) + Math.abs(col - center) < 3) || 
        newObstacles.some(obs => obs.row === row && obs.col === col)
      );
      
      newObstacles.push({ row, col });
    }
    setObstaclePositions(newObstacles);
    
    // Place exit on perimeter
    const perimeter = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      perimeter.push({ row: 0, col: i });
      perimeter.push({ row: GRID_SIZE - 1, col: i });
      perimeter.push({ row: i, col: 0 });
      perimeter.push({ row: i, col: GRID_SIZE - 1 });
    }
    
    // Filter out any perimeter positions that have obstacles
    const validPerimeter = perimeter.filter(pos => 
      !newObstacles.some(obs => obs.row === pos.row && obs.col === pos.col)
    );
    
    // Randomly choose exit position
    const randomIndex = Math.floor(Math.random() * validPerimeter.length);
    setExitPos(validPerimeter[randomIndex]);
    
    setGrid(newGrid);
  };

  // Render the grid
  const renderGrid = () => {
    const newGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('▢'));
    
    // Check if we need to show pulses (on even turns)
    const showPulses = turnCounter > 0 && turnCounter % 2 === 0;
    
    // Place walls (border)
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (r < borderSize || r >= GRID_SIZE - borderSize || 
            c < borderSize || c >= GRID_SIZE - borderSize) {
          newGrid[r][c] = '▣';
        }
      }
    }
    
    // Place obstacles
    obstaclePositions.forEach(pos => {
      if (pos.row >= borderSize && pos.row < GRID_SIZE - borderSize &&
          pos.col >= borderSize && pos.col < GRID_SIZE - borderSize) {
        newGrid[pos.row][pos.col] = '🟥';
        
        // If it's an even turn, add pulses
        if (showPulses) {
          const directions = [
            { row: -1, col: 0 }, // N
            { row: 1, col: 0 },  // S
            { row: 0, col: -1 }, // W
            { row: 0, col: 1 }   // E
          ];
          
          directions.forEach(dir => {
            const pulseRow = pos.row + dir.row;
            const pulseCol = pos.col + dir.col;
            
            // Ensure pulse is within bounds and not on a wall
            if (pulseRow >= borderSize && pulseRow < GRID_SIZE - borderSize &&
                pulseCol >= borderSize && pulseCol < GRID_SIZE - borderSize &&
                newGrid[pulseRow][pulseCol] === '▢') {
              newGrid[pulseRow][pulseCol] = '🟥+';
            }
          });
        }
      }
    });
    
    // Place exit if it's not covered by a wall
    if (exitPos.row >= borderSize && exitPos.row < GRID_SIZE - borderSize &&
        exitPos.col >= borderSize && exitPos.col < GRID_SIZE - borderSize) {
      newGrid[exitPos.row][exitPos.col] = '🟩';
    }
    
    // Place player
    if (playerPos.row >= borderSize && playerPos.row < GRID_SIZE - borderSize &&
        playerPos.col >= borderSize && playerPos.col < GRID_SIZE - borderSize) {
      newGrid[playerPos.row][playerPos.col] = '🟦';
    }
    
    setGrid(newGrid);
  };
  
  // Check if a position is valid (within bounds and not a wall or obstacle)
  const isValidPosition = (row, col) => {
    // Check bounds and walls
    if (row < borderSize || row >= GRID_SIZE - borderSize || 
        col < borderSize || col >= GRID_SIZE - borderSize) {
      return false;
    }
    
    // Check obstacles
    if (obstaclePositions.some(pos => pos.row === row && pos.col === col)) {
      return false;
    }
    
    return true;
  };
  
  // Check if a position has a pulse
  const hasPulse = (row, col) => {
    if (turnCounter % 2 !== 0) return false; // Pulses only on even turns
    
    // Check if position is adjacent to an obstacle
    return obstaclePositions.some(pos => 
      (Math.abs(pos.row - row) === 1 && pos.col === col) ||
      (Math.abs(pos.col - col) === 1 && pos.row === row)
    );
  };
  
  // Handle player movement
  const handleMove = (direction) => {
    if (gameOver || victory) return;
    
    let newRow = playerPos.row;
    let newCol = playerPos.col;
    
    // Calculate direction vector
    const dirVector = { row: 0, col: 0 };
    switch (direction.toUpperCase()) {
      case 'N': dirVector.row = -1; break;
      case 'S': dirVector.row = 1; break;
      case 'W': dirVector.col = -1; break;
      case 'E': dirVector.col = 1; break;
      default: 
        setMessage('Invalid direction. Use N, S, E, or W.');
        return;
    }
    
    // First step
    newRow += dirVector.row;
    newCol += dirVector.col;
    
    // Check if first step collides with obstacle or pulse
    if (!isValidPosition(newRow, newCol) || hasPulse(newRow, newCol)) {
      handleCrash();
      return;
    }
    
    // Second step (if first was valid)
    let secondRow = newRow + dirVector.row;
    let secondCol = newCol + dirVector.col;
    
    // If second step is invalid or has pulse, stop at first step
    if (!isValidPosition(secondRow, secondCol) || hasPulse(secondRow, secondCol)) {
      setPlayerPos({ row: newRow, col: newCol });
    } else {
      setPlayerPos({ row: secondRow, col: secondCol });
    }
    
    // Increment turn counter
    setTurnCounter(prevTurn => prevTurn + 1);
    setMessage('');
  };
  
  // Handle crash (obstacle, pulse, or wall collision)
  const handleCrash = () => {
    setLives(prevLives => prevLives - 1);
    
    if (lives <= 1) {
      setGameOver(true);
      setMessage('Flat as a pancake! 💀');
    } else {
      setMessage(`Crashed! Lives remaining: ${lives - 1}`);
      initializeGame();
    }
  };
  
  // Handle submit for move input
  const handleSubmit = () => {
    const input = moveInput.trim().toLowerCase();
    
    if (input.startsWith('move ') && input.length === 6) {
      const direction = input.charAt(5);
      if (['n', 's', 'e', 'w'].includes(direction)) {
        handleMove(direction);
        setMoveInput('');
      } else {
        setMessage('Invalid command. Use "move N", "move S", "move E", or "move W".');
      }
    } else {
      setMessage('Invalid command. Use "move N", "move S", "move E", or "move W".');
    }
  };
  
  // Check for win condition after player moves
  useEffect(() => {
    if (!gameStarted || gameOver || victory) return;
    
    // Check if player reached exit
    if (playerPos.row === exitPos.row && playerPos.col === exitPos.col) {
      setVictory(true);
      setMessage('You escaped the crush! 🎉');
      return;
    }
    
    // Shrink arena every 5 turns
    if (turnCounter > 0 && turnCounter % ARENA_SHRINK_INTERVAL === 0) {
      setBorderSize(prevSize => prevSize + 1);
      
      // Check if player is now outside the arena
      if (playerPos.row < borderSize + 1 || playerPos.row >= GRID_SIZE - (borderSize + 1) ||
          playerPos.col < borderSize + 1 || playerPos.col >= GRID_SIZE - (borderSize + 1)) {
        handleCrash();
      }
    }
  }, [playerPos, turnCounter]);
  
  // Update grid whenever relevant state changes
  useEffect(() => {
    if (gameStarted) {
      renderGrid();
    }
  }, [playerPos, obstaclePositions, exitPos, turnCounter, borderSize, gameStarted]);
  
  return (
    <div className="flex flex-col items-center p-4 max-w-md mx-auto bg-gray-100 rounded-lg">
      <h1 className="text-2xl font-bold mb-2">Square Dash</h1>
      
      {!gameStarted ? (
        <div className="text-center mb-4">
          <p className="mb-4">Navigate through a dangerous arena to reach the exit before the walls crush you!</p>
          <button 
            onClick={initializeGame}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Start Game
          </button>
        </div>
      ) : (
        <>
          <div className="mb-2 font-mono text-sm">
            <p>Turn: {turnCounter} | Lives: {lives}</p>
            {turnCounter % 2 === 0 && turnCounter > 0 && <p className="text-red-600">WARNING: Obstacles are pulsing!</p>}
            {turnCounter > 0 && turnCounter % ARENA_SHRINK_INTERVAL === 0 && <p className="text-orange-600">The arena is shrinking!</p>}
          </div>
          
          <div className="grid grid-cols-9 gap-1 mb-4 font-mono text-2xl">
            {grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <div 
                  key={`${rowIndex}-${colIndex}`} 
                  className={`w-8 h-8 flex items-center justify-center ${
                    cell === '▣' ? 'bg-gray-800' : 
                    cell === '🟦' ? 'bg-blue-500' : 
                    cell === '🟥' ? 'bg-red-600' : 
                    cell === '🟥+' ? 'bg-red-300' : 
                    cell === '🟩' ? 'bg-green-500' : 
                    'bg-gray-200'
                  }`}
                >
                  {cell}
                </div>
              ))
            ))}
          </div>
          
          {!gameOver && !victory ? (
            <div className="w-full max-w-xs flex flex-col items-center">
              <div className="flex w-full mb-2">
                <input
                  type="text"
                  value={moveInput}
                  onChange={(e) => setMoveInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="move N, S, E, W"
                  className="flex-grow px-2 py-1 border rounded-l"
                  disabled={gameOver || victory}
                />
                <button 
                  onClick={handleSubmit} 
                  className="bg-blue-500 text-white px-3 py-1 rounded-r"
                  disabled={gameOver || victory}
                >
                  Go
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-2 w-full">
                <div></div>
                <button 
                  onClick={() => handleMove('N')} 
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  North
                </button>
                <div></div>
                <button 
                  onClick={() => handleMove('W')} 
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  West
                </button>
                <div></div>
                <button 
                  onClick={() => handleMove('E')} 
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  East
                </button>
                <div></div>
                <button 
                  onClick={() => handleMove('S')} 
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  South
                </button>
                <div></div>
              </div>
            </div>
          ) : (
            <button 
              onClick={initializeGame}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2"
            >
              Play Again
            </button>
          )}
          
          <div className="mt-4 text-center">
            <p className={`${message.includes('Crashed') ? 'text-red-600' : message.includes('escaped') ? 'text-green-600' : 'text-gray-800'} font-bold`}>
              {message}
            </p>
          </div>
          
          <div className="mt-4 text-sm bg-gray-200 p-2 rounded">
            <h3 className="font-bold">Game Rules:</h3>
            <ul className="list-disc pl-5">
              <li>🟦 = player, 🟥 = obstacle, 🟥+ = pulse, 🟩 = exit, ▢ = empty, ▣ = wall</li>
              <li>Type "move N", "move S", "move E", or "move W" to move</li>
              <li>You slide 2 tiles in that direction (momentum slide)</li>
              <li>Obstacles pulse every even-numbered turn</li>
              <li>The arena shrinks every 5 turns</li>
              <li>Crashing costs 1 life and resets the level</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default SquareDash;