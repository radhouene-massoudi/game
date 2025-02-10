import React, { useState, useContext } from 'react';
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

class GameTimer {
  private timerId: number | null = null;
  private startTime: number = 0;
  private onTick: (elapsed: number) => void;

  constructor(onTick: (elapsed: number) => void) {
    this.onTick = onTick;
  }

  start() {
    this.startTime = Date.now();
    this.update();
  }

  private update = () => {
    const currentTime = Date.now();
    const elapsed = Math.floor((currentTime - this.startTime) / 1000);
    this.onTick(elapsed);
    this.timerId = requestAnimationFrame(this.update);
  };

  stop() {
    if (this.timerId !== null) {
      cancelAnimationFrame(this.timerId);
      this.timerId = null;
    }
  }
}

const ClockGame = () => {
  const { user } = useAuth();
  const [deckId, setDeckId] = useState<string>('');
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [piles, setPiles] = useState<Card[][]>(() => Array(13).fill(null).map(() => []));
  const [showCenterCard, setShowCenterCard] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState('');
  const [kingCount, setKingCount] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentPosition, setCurrentPosition] = useState<number | null>(null);
  const [timer] = useState(() => new GameTimer((elapsed) => setTimeElapsed(elapsed)));

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

  // Obtenir une position aléatoire
  const getRandomPosition = (): number => {
    return Math.floor(Math.random() * 12);
  };

  const startGame = async () => {
    const newDeckId = await initializeDeck();
    if (newDeckId) {
      const firstCard = await drawCard(newDeckId);
      if (firstCard) {
        setCurrentCard(firstCard);
        setCurrentPosition(12); // Première carte au centre
        setMessage(`Carte ${firstCard.value} - Cliquez sur la position ${getCorrectPosition(firstCard.value) + 1}`);
        setGameStarted(true);
        setShowWelcome(false);
        timer.start(); // Démarrer le timer
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
      newPiles[pileIndex] = [currentCard];
      setPiles(newPiles);

      if (cardValue === 'KING') {
        setKingCount(prev => {
          const newCount = prev + 1;
          if (newCount === 4) {
            setGameStatus('won');
            setMessage('Félicitations ! Vous avez gagné !');
            timer.stop();
          }
          return newCount;
        });
      }

      // Tirer la prochaine carte et la placer à la position du clic
      const nextCard = await drawCard(deckId);
      if (nextCard) {
        setCurrentCard(nextCard);
        setCurrentPosition(pileIndex); // La nouvelle carte apparaît où on vient de cliquer
        setMessage(`Carte ${nextCard.value} - Cliquez sur la position ${getCorrectPosition(nextCard.value) + 1}`);
      } else {
        setCurrentCard(null);
        setCurrentPosition(null);
        setGameStatus('won');
        setMessage('Félicitations ! Vous avez terminé le jeu !');
        timer.stop(); // Arrêter le timer quand le jeu est gagné
      }
    } else {
      setScore(prev => Math.max(0, prev - 10));
      setMessage(`Position incorrecte ! La carte ${cardValue} doit aller en position ${correctPosition + 1}`);
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
              
              {/* Positions des cartes */}
              {Array(13).fill(null).map((_, index) => (
                <div
                  key={index}
                  className={`pile ${index === 12 ? 'center-pile' : `position-${index + 1}`}
                             ${piles[index]?.length > 0 ? 'has-cards' : ''}`}
                  onClick={() => handlePileClick(index)}
                >
                  <div className="pile-label">
                    {index === 12 ? 'K' : index + 1}
                  </div>

                  {/* Afficher la carte placée si il n'y a pas de carte courante à cette position */}
                  {piles[index]?.length > 0 && currentPosition !== index && (
                    <img 
                      src={piles[index][piles[index].length - 1].image}
                      alt={`${piles[index][piles[index].length - 1].value} of ${piles[index][piles[index].length - 1].suit}`}
                      className="carte placed"
                    />
                  )}

                  {/* Afficher la carte courante si elle existe à cette position */}
                  {currentCard && currentPosition === index && (
                    <img 
                      src={currentCard.image}
                      alt={`${currentCard.value} of ${currentCard.suit}`}
                      className="carte current"
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