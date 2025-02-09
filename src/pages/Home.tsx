import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth0();

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin + '/login'
      }
    });
  };

  const goToGames = () => {
    navigate('/games');
  };

  return (
    <div className="home-container">
      <nav className="home-nav">
        <h1>Game Platform</h1>
        <div className="nav-buttons">
          <button onClick={goToGames} className="games-button">
            Play Games
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </nav>
      <div className="home-content">
        <h2>Welcome {user?.name || 'Player'}!</h2>
        <p>Choose an option to get started:</p>
        <div className="action-buttons">
          <button onClick={goToGames} className="action-button">
            <span className="button-icon">🎮</span>
            Play Games
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home; 