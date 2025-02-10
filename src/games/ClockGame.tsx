import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../auth/AuthContext';
import './ClockGame.css';

interface Card {
  code: string;
  value: string;
  suit: string;
  image: string;
}

interface DeckResponse {
  deck_id: string;
  remaining: number;
  cards: Card[];
  success: boolean;
}

const ClockGame = () => {
  const { user } = useAuth();
  const [deckId, setDeckId] = useState<string>('');
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [piles, setPiles] = useState<Card[][]>(() => Array(13).fill(null).map(() => []));
  const [showCenterCard, setShowCenterCard] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState('');
  const [kingCount, setKingCount] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && gameStatus === 'playing') {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialiser un nouveau deck
  const initializeDeck = async () => {
    try {
      const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/');
      const data: DeckResponse = await response.json();
      if (data.success) {
        setDeckId(data.deck_id);
        return data.deck_id;
      }
    } catch (error) {
      console.error('Error initializing deck:', error);
    }
    return null;
  };

  // Tirer une carte
  const drawCard = async (deckId: string) => {
    try {
      const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
      const data: DeckResponse = await response.json();
      if (data.success && data.cards.length > 0) {
        return data.cards[0];
      }
    } catch (error) {
      console.error('Error drawing card:', error);
    }
    return null;
  };

  const startGame = async () => {
    const newDeckId = await initializeDeck();
    if (newDeckId) {
      const firstCard = await drawCard(newDeckId);
      if (firstCard) {
        setCurrentCard(firstCard);
        setShowCenterCard(true);
        setMessage('Cliquez sur la position correspondant à la valeur de la carte');
        setGameStarted(true);
        setShowWelcome(false);
      }
    }
  };

  const handlePileClick = async (pileIndex: number) => {
    if (!currentCard || gameStatus !== 'playing') return;

    setMoves(prev => prev + 1);
    const cardValue = currentCard.value;
    const correctPosition = getCorrectPosition(cardValue);

    if (pileIndex === correctPosition) {
      const moveScore = Math.max(100 - (moves * 5), 10);
      setScore(prev => prev + moveScore);
      
      const newPiles = [...piles];
      setShowCenterCard(false);
      newPiles[pileIndex].push(currentCard);

      if (cardValue === 'KING') {
        setKingCount(prev => {
          const newCount = prev + 1;
          if (newCount === 4) {
            setGameStatus('won');
            setMessage('Félicitations ! Vous avez gagné !');
          }
          return newCount;
        });
      }

      // Tirer la prochaine carte
      const nextCard = await drawCard(deckId);
      if (nextCard) {
        setCurrentCard(nextCard);
        setShowCenterCard(true);
        setMessage('Cliquez sur la position correspondant à la valeur de la carte');
      } else {
        setCurrentCard(null);
        setShowCenterCard(false);
        setGameStatus('won');
        setMessage('Félicitations ! Vous avez terminé le jeu !');
      }

      setPiles(newPiles);

      // Ajouter la classe pour l'animation
      const element = document.querySelector(`.pile-${pileIndex}`);
      element?.classList.add('correct-position');
      setTimeout(() => element?.classList.remove('correct-position'), 1000);
    } else {
      setScore(prev => Math.max(0, prev - 10));
      setMessage('Position incorrecte ! Essayez une autre position.');
      
      // Animation pour mauvaise position
      const element = document.querySelector(`.pile-${pileIndex}`);
      element?.classList.add('wrong-position');
      setTimeout(() => element?.classList.remove('wrong-position'), 500);
    }
  };

  // Convertir la valeur de la carte en position
  const getCorrectPosition = (value: string): number => {
    const valueMap: { [key: string]: number } = {
      'ACE': 0,
      '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '10': 9,
      'JACK': 10,
      'QUEEN': 11,
      'KING': 12
    };
    return valueMap[value] ?? -1;
  };

  return (
    <div className="clock-game">
      {showWelcome ? (
        <div className="welcome-screen">
          <h1>♠️ Clock Patience ♥️</h1>
          <div className="player-welcome">
            <h2>Bienvenue {user?.name || 'Joueur'} !</h2>
          </div>
          <div className="game-rules">
            <h2>Règles du jeu</h2>
            <ul>
              <li>Une carte apparaît au centre de l'horloge</li>
              <li>Cliquez sur la position correspondant à la valeur de la carte</li>
              <li>As = position 1, 2-10 = positions 2-10, Valet = 11, Dame = 12, Roi = K</li>
              <li>Trouvez les 4 Rois pour gagner la partie</li>
            </ul>
          </div>
          <button className="start-button" onClick={startGame}>
            🎮 Jouer maintenant
          </button>
        </div>
      ) : (
        <>
          <div className="game-header">
            <h1>♠️ Clock Patience ♥️</h1>
            <div className="player-info">
              Joueur : <span className="player-name">{user?.name || 'Anonyme'}</span>
            </div>
          </div>
          
          <div className="game-stats">
            <div className="stat-item">
              <span className="stat-label">Score</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Coups</span>
              <span className="stat-value">{moves}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Temps</span>
              <span className="stat-value">{formatTime(timeElapsed)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Rois</span>
              <span className="stat-value">{kingCount}/4</span>
            </div>
          </div>

          <div className="game-info">
            {message && <div className="message">{message}</div>}
          </div>

          <div className="game-container">
            <div className="clock-face">
              <div className="clock-numbers">
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                  <span key={num} className={`clock-number number-${num}`}>{num}</span>
                ))}
              </div>
              
              {/* Afficher la carte au centre seulement si showCenterCard est true */}
              {currentCard && showCenterCard && (
                <div className="current-card">
                  <img 
                    src={currentCard.image}
                    alt={`${currentCard.value} of ${currentCard.suit}`}
                    className="carte"
                  />
                </div>
              )}
              
              {/* Positions des cartes */}
              {Array(13).fill(null).map((_, index) => (
                <div
                  key={index}
                  className={`pile ${index === 12 ? 'center-pile' : `position-${index + 1}`}
                             ${piles[index]?.length > 0 ? 'has-cards' : ''}`}
                  onClick={() => handlePileClick(index)}
                >
                  <div 
                    className="pile-label"
                    data-position={index === 12 ? 'K' : index + 1}
                  >
                    {index === 12 ? 'K' : index + 1}
                  </div>
                  {/* Afficher la dernière carte placée */}
                  {piles[index]?.length > 0 && (
                    <img 
                      src={piles[index][piles[index].length - 1].image}
                      alt={`${piles[index][piles[index].length - 1].value} of ${piles[index][piles[index].length - 1].suit}`}
                      className="carte"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClockGame; 