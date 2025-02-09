import React, { useState, useEffect } from 'react';
import './ClockGame.css';

interface Card {
  code: string;
  image: string;
  value: string;
  suit: string;
  faceUp: boolean;
}

interface DeckResponse {
  deck_id: string;
  cards: Card[];
  remaining: number;
  success: boolean;
  error?: string;
}

const ClockGame = () => {
  const [deckId, setDeckId] = useState<string>('');
  const [piles, setPiles] = useState<Card[][]>(Array(13).fill([]));
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState('');
  const [kingCount, setKingCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [correctPlays, setCorrectPlays] = useState(0);
  const [incorrectClicks, setIncorrectClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds timer

  useEffect(() => {
    const initializeDeck = async () => {
      try {
        const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
        const data: DeckResponse = await response.json();
        if (data.success) {
          setDeckId(data.deck_id);
        } else {
          throw new Error(data.error || 'Failed to create deck');
        }
      } catch (error) {
        setMessage('Error initializing deck. Please try again.');
      }
    };

    initializeDeck();
  }, []);

  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsGameOver(true);
      setMessage(`Time's up! Correct Plays: ${correctPlays}, Incorrect Clicks: ${incorrectClicks}`);
    }
  }, [gameStarted, timeLeft]);

  const startGame = async () => {
    if (!deckId) return;

    try {
      const drawResponse = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=52`);
      const data: DeckResponse = await drawResponse.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to draw cards');
      }

      const newPiles: Card[][] = Array(13).fill([]).map(() => []);
      data.cards.forEach((card: Card, index: number) => {
        const pileIndex = Math.floor(index / 4);
        card.faceUp = false;
        newPiles[pileIndex].push(card);
      });

      if (newPiles[12].length > 0) {
        newPiles[12][0].faceUp = true;
      }

      setPiles(newPiles);
      setGameStarted(true);
      setMessage('Game started! Click the center pile to begin.');
      setCorrectPlays(0);
      setIncorrectClicks(0);
      setTimeLeft(60);
    } catch (error) {
      setMessage('Error dealing cards. Please try again.');
    }
  };

  const getHourFromCard = (value: string): number => {
    const valueMap: { [key: string]: number } = {
      'ACE': 1,
      'JACK': 11,
      'QUEEN': 12,
      'KING': 0
    };
    return valueMap[value] ?? parseInt(value);
  };

  const handlePileClick = (pileIndex: number) => {
    if (isGameOver || !piles[pileIndex].length) {
      setIncorrectClicks(prev => prev + 1);
      return;
    }

    const newPiles = [...piles];
    const card = newPiles[pileIndex][0];
    card.faceUp = true;

    newPiles[pileIndex] = newPiles[pileIndex].slice(1);
    const hour = getHourFromCard(card.value);
    const destinationPile = card.value === 'KING' ? 12 : hour - 1;

    if (card.value === 'KING') {
      setKingCount(prev => prev + 1);
      if (kingCount + 1 === 4) {
        setMessage('You drew the fourth King. Game over!');
        setIsGameOver(true);
        return;
      }
    }

    if (destinationPile === pileIndex) {
      setCorrectPlays(prev => prev + 1);
    } else {
      setIncorrectClicks(prev => prev + 1);
    }

    newPiles[destinationPile] = [...newPiles[destinationPile], card];
    setPiles(newPiles);

    if (newPiles.every(pile => pile.length === 0)) {
      setMessage('Congratulations! You won!');
      setIsGameOver(true);
    }
  };

  return (
    <div className="clock-game">
      <h1>♠️ Clock Patience ♥️</h1>
      <div className="game-stats">
        <div className="time">⏱️ Time Left: {timeLeft}s</div>
        <div className="score">✅ Correct Plays: {correctPlays}</div>
        <div className="score">❌ Incorrect Clicks: {incorrectClicks}</div>
      </div>
      {message && <div className="message">{message}</div>}
      {!gameStarted ? (
        <button className="start-button" onClick={startGame}>
          🎮 Start Game
        </button>
      ) : (
        <div className="clock-face">
          {piles.map((pile, index) => (
            <div
              key={index}
              className={`pile ${index === 12 ? 'center-pile' : `position-${index + 1}`}`}
              onClick={() => handlePileClick(index)}
            >
              {pile.map((card, cardIndex) => (
                <div
                  key={card.code}
                  className={`card ${card.faceUp ? 'face-up' : 'face-down'}`}
                  style={{ transform: `translateY(${cardIndex * -2}px)` }}
                >
                  {card.faceUp ? (
                    <img src={card.image} alt={card.value} />
                  ) : (
                    <div className="card-back" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClockGame; 