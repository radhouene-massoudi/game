import React, { useState, useEffect } from 'react';
import './ClockGame.css';

const ClockGame = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [targetTime, setTargetTime] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const startGame = () => {
    setIsRunning(true);
    // Set random target time between 1-12
    const randomHour = Math.floor(Math.random() * 12) + 1;
    const randomMinute = Math.floor(Math.random() * 60);
    setTargetTime({ hour: randomHour, minute: randomMinute });
  };

  const checkTime = () => {
    setIsRunning(false);
    const current = currentTime;
    const hourDiff = Math.abs(current.getHours() % 12 - targetTime.hour);
    const minuteDiff = Math.abs(current.getMinutes() - targetTime.minute);
    
    // Calculate score based on accuracy
    const accuracy = 100 - ((hourDiff * 5) + (minuteDiff / 2));
    setScore(Math.max(0, accuracy));
  };

  return (
    <div className="clock-game">
      <h2>Clock Game</h2>
      <div className="current-time">
        Current Time: {currentTime.toLocaleTimeString()}
      </div>
      {targetTime && (
        <div className="target-time">
          Target Time: {targetTime.hour}:{targetTime.minute.toString().padStart(2, '0')}
        </div>
      )}
      {!isRunning && !targetTime && (
        <button onClick={startGame}>Start Game</button>
      )}
      {isRunning && targetTime && (
        <button onClick={checkTime}>Stop Time</button>
      )}
      {score > 0 && (
        <div className="score">
          Score: {score.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

export default ClockGame; 