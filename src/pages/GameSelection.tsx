import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GameSelection.css';

interface Game {
  id: string;
  name: string;
  description: string;
  path: string;
  imageUrl: string;
}

const games: Game[] = [
  {
    id: 'clock',
    name: 'Clock Game',
    description: 'Test your time-telling skills!',
    path: '/clock',
    imageUrl: '/images/clock-game.png'
  },
  {
    id: 'yahtzee',
    name: 'Yahtzee',
    description: 'Classic dice game of luck and strategy',
    path: '/yahtzee',
    imageUrl: '/images/yahtzee.png'
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    description: 'Clear the minefield without exploding!',
    path: '/minesweeper',
    imageUrl: '/images/minesweeper.png'
  },
  {
    id: 'chess',
    name: 'Chess',
    description: 'The ultimate game of strategy',
    path: '/chess',
    imageUrl: '/images/chess.png'
  }
];

const GameSelection = () => {
  const navigate = useNavigate();

  const handleGameSelect = (path: string) => {
    navigate(path);
  };

  return (
    <div className="game-selection">
      <h1>Choose Your Game</h1>
      <div className="games-grid">
        {games.map(game => (
          <div 
            key={game.id} 
            className="game-card"
            onClick={() => handleGameSelect(game.path)}
          >
            <div className="game-image">
              <img 
                src={game.imageUrl} 
                alt={game.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/placeholder.png';
                }}
              />
            </div>
            <div className="game-info">
              <h2>{game.name}</h2>
              <p>{game.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameSelection; 