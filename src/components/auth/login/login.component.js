import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../../api/authApi.js';
import {jwtDecode} from 'jwt-decode'; // Correct import for jwt-decode

const Login = ({ setUsername, setAuthToken, setOrganization }) => { // Added setOrganization prop
  const [localUsername, setLocalUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('starting login');
      
      const { token } = await login(localUsername, password);
  
      // Decode the token to get the organizationID
      const decodedToken = jwtDecode(token);
      const organizationID = decodedToken.organization;
  
      // Store token and organizationID in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('username', localUsername);
      localStorage.setItem('organizationID', organizationID);
  
      // Update state
      setAuthToken(token);
      setUsername(localUsername);
      setOrganization(organizationID);  // Set organizationID in state
  
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setError(`Login failed: ${error.message}`);
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit">Login</button>
        </form>
        <p>
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
