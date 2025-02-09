import React, { useState } from 'react';
import './LoginForm.css';

interface ClientData {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginFormProps {
  clients: ClientData[];
  onLoginSuccess: (isAdmin: boolean) => void;
}

const ADMIN_CREDENTIALS = {
  email: 'admin@admin',
  password: 'admin'
};

const DEFAULT_USER = {
  id: 1,
  email: 'user@user',
  password: 'user',
  firstName: 'Default',
  lastName: 'User'
};

const LoginForm: React.FC<LoginFormProps> = ({ clients, onLoginSuccess }) => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for admin login
    if (loginData.email === ADMIN_CREDENTIALS.email && 
        loginData.password === ADMIN_CREDENTIALS.password) {
      onLoginSuccess(true);
      return;
    }

    // Check for default user
    if (loginData.email === DEFAULT_USER.email && 
        loginData.password === DEFAULT_USER.password) {
      onLoginSuccess(false);
      return;
    }

    // Check for regular client login
    const client = clients.find(
      c => c.email === loginData.email && c.password === loginData.password
    );

    if (client) {
      onLoginSuccess(false);
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <input
            type="email"
            name="email"
            value={loginData.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            name="password"
            value={loginData.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />
        </div>
        <button type="submit" className="submit-button">Login</button>
        <button 
          type="button" 
          className="view-credentials-button"
          onClick={() => setShowCredentials(!showCredentials)}
        >
          {showCredentials ? 'Hide Credentials' : 'View Test Credentials'}
        </button>
        
        {showCredentials && (
          <div className="credentials-table">
            <h3>Test Accounts</h3>
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Password</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Admin</td>
                  <td>{ADMIN_CREDENTIALS.email}</td>
                  <td>{ADMIN_CREDENTIALS.password}</td>
                </tr>
                <tr>
                  <td>User</td>
                  <td>{DEFAULT_USER.email}</td>
                  <td>{DEFAULT_USER.password}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm; 