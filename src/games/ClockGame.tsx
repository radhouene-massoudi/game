import React, { useState } from 'react';
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
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentPile, setCurrentPile] = useState<number>(12);
  const [kingCount, setKingCount] = useState(0);

  const initializeDeck = async () => {
    try {
      // First, get a new shuffled deck
      const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
      const data: DeckResponse = await response.json();
      
      if (data.success) {
        setDeckId(data.deck_id);
        return data.deck_id;
      } else {
        throw new Error(data.error || 'Failed to create deck');
      }
    } catch (error) {
      setMessage('Error initializing deck. Please try again.');
      return null;
    }
  };

  const startGame = async () => {
    try {
      // Get a new deck ID if we don't have one
      const currentDeckId = deckId || await initializeDeck();
      
      if (!currentDeckId) {
        setMessage('Failed to initialize deck. Please try again.');
        return;
      }

      // Draw all 52 cards at once
      const drawResponse = await fetch(
        `https://deckofcardsapi.com/api/deck/${currentDeckId}/draw/?count=52`
      );
      const data: DeckResponse = await drawResponse.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to draw cards');
      }

      // Deal cards in clock pattern
      const newPiles = dealCardsInClockPattern(data.cards);
      setPiles(newPiles);
      setGameStarted(true);
      setKingCount(0);
      setCurrentPile(12);
      setMessage('Game started! Click the center pile to begin.');
    } catch (error) {
      setMessage('Error dealing cards. Please try again.');
    }
  };

  const dealCardsInClockPattern = (cards: Card[]) => {
    const newPiles: Card[][] = Array(13).fill(null).map(() => []);
    let cardIndex = 0;

    // Deal all cards face down first
    for (let position = 0; position < 13; position++) {
      for (let layer = 0; layer < 4; layer++) {
        if (cardIndex < cards.length) {
          const card = cards[cardIndex];
          card.faceUp = false;
          newPiles[position].push(card);
          cardIndex++;
        }
      }
    }

    // Flip the top card of the center pile
    if (newPiles[12].length > 0) {
      newPiles[12][0].faceUp = true;
    }

    return newPiles;
  };

  const getHourFromCard = (value: string): number => {
    const valueMap: { [key: string]: number } = {
      'ACE': 1,
      'JACK': 11,
      'QUEEN': 12,
      'KING': 13
    };
    return valueMap[value] ?? parseInt(value);
  };

  const handlePileClick = (pileIndex: number) => {
    if (isGameOver || pileIndex !== currentPile || !piles[pileIndex].length) {
      return;
    }

    const newPiles = [...piles];
    const currentCard = newPiles[pileIndex][0];
    currentCard.faceUp = true;

    // Remove top card from current pile
    newPiles[pileIndex] = newPiles[pileIndex].slice(1);

    // If it's a King
    if (currentCard.value === 'KING') {
      setKingCount(prev => {
        const newCount = prev + 1;
        // Check if this is the fourth king
        if (newCount === 4) {
          setIsGameOver(true);
          // Count remaining face-down cards
          const remainingCards = newPiles.reduce((total, pile) => 
            total + pile.filter(card => !card.faceUp).length, 0
          );
          if (remainingCards === 0) {
            setMessage('Congratulations! You won - last card was the fourth King!');
          } else {
            setMessage('Game Over - Fourth King revealed too early!');
          }
        }
        return newCount;
      });

      // Place King in center pile
      newPiles[12].push(currentCard);
      // Next move from center pile
      setCurrentPile(12);
      setMessage(`King found! (${kingCount + 1}/4) Continue from center pile.`);
    } else {
      // For non-King cards
      const hour = getHourFromCard(currentCard.value);
      const destinationPile = hour - 1;

      // Add card to destination pile
      newPiles[destinationPile].push(currentCard);
      // Next move from destination pile
      setCurrentPile(destinationPile);
      setMessage(`${currentCard.value} placed at ${hour} o'clock. Continue from that pile.`);
    }

    setPiles(newPiles);
  };

  return (
    <div className="clock-game">
      <h1>♠️ Clock Patience ♥️</h1>
      
      <div className="game-info">
        <div className="kings-count">Kings revealed: {kingCount}/4</div>
        {message && <div className="message">{message}</div>}
      </div>

      {!gameStarted ? (
        <div className="start-container">
          <div className="game-rules">
            <h2>How to Play:</h2>
            <ul>
              <li>Start with the center pile</li>
              <li>Place each card face-up under its corresponding position (Ace=1, 2=2, etc.)</li>
              <li>Kings go to the center pile</li>
              <li>Continue from the pile where you just placed a card</li>
              <li>Game ends when the fourth King is revealed</li>
            </ul>
          </div>
          <button className="start-button" onClick={startGame}>
            🎮 Start New Game
          </button>
        </div>
      ) : (
        <div className="game-container">
          <div className="clock-face">
            <div className="clock-numbers">
              {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                <span key={num} className={`clock-number number-${num}`}>{num}</span>
              ))}
            </div>
            
            {piles.map((pile, index) => (
              <div
                key={index}
                className={`pile ${index === 12 ? 'center-pile' : `position-${index + 1}`} 
                           ${index === currentPile ? 'active-pile' : ''}`}
                onClick={() => handlePileClick(index)}
              >
                <div className="pile-label">
                  {index === 12 ? 'K' : index + 1}
                </div>
                {pile.map((card, cardIndex) => (
                  <div
                    key={card.code}
                    className={`card ${card.faceUp ? 'face-up' : 'face-down'}`}
                    style={{
                      transform: `translateY(${cardIndex * -2}px)`,
                      zIndex: cardIndex
                    }}
                  >
                    <div className="carte">
                      <img
                        alt={card.code}
                        src={card.faceUp 
                          ? `https://deckofcardsapi.com/static/img/${card.code}.png`
                          : 'https://deckofcardsapi.com/static/img/back.png'
                        }
                      />
                    </div>
                  </div>
                ))}
                {pile.length > 0 && (
                  <div className="cards-count">{pile.length}</div>
                )}
              </div>
            ))}
          </div>

          {isGameOver && (
            <div className="game-over-overlay">
              <div className="game-over-content">
                <h2>{kingCount === 4 ? 'Game Over!' : 'Congratulations!'}</h2>
                <p>{message}</p>
                <button className="start-button" onClick={startGame}>
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClockGame; 