import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../../api/authApi.js';
import {jwtDecode} from 'jwt-decode'; // Correct import for jwt-decode

const Login = ({ setUsername, setAuthToken, setOrganization }) => { // Added setOrganization prop
  const [localUsername, setLocalUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleDecryptCredentials = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const cipher = urlParams.get('secX');
        const iv = urlParams.get('secY');
        console.log('REACT_APP_PROD_URL',process.env.REACT_APP_PROD_URL);
        console.log('REACT_APP_LARAVEL',process.env);

        if (cipher && iv) {
          const response = await fetch('https://phpstack-1180784-5314741.cloudwaysapps.com/api/decrypt/cred', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ cipher, iv }),
          });

          if (!response.ok) {
            console.error('Decrypt response not ok:', response.status);
            return;
          }

          const data = await response.json();
          const [email, pass] = data.decrypted.split(':');

          // console.log('enc email', email);
          // console.log('enc pass', pass);
          
          if (email && pass) {
            setLocalUsername(email);
            setPassword(pass);
            // Automatically trigger login
            handleLogin(email, pass);
          }
        }
      } catch (error) {
        console.error('Error decrypting credentials:', error);
        // Don't set error state to maintain current functionality
      }
    };

    handleDecryptCredentials();
  }, []);

  const handleLogin = async (username, pass) => {
    try {
      console.log('starting login');
      
      const { token } = await login(username, pass);
  
      // Decode the token to get the organizationID
      const decodedToken = jwtDecode(token);
      const organizationID = decodedToken.organization;
  
      // Store token and organizationID in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('username', username);
      localStorage.setItem('organizationID', organizationID);
  
      // Update state
      setUsername(username);
      setAuthToken(token);
      setOrganization(organizationID);
  
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid username or password');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleLogin(localUsername, password);
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container bg-zinc-900 p-10 rounded-lg shadow-lg w-full max-w-md">
        <div className='pb-6 mb-6 border-b border-yellow-400/20'>
           <h2>Login</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className='block font-medium text-gray-300 mb-2'>Username:</label>
            <input
              type="text"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className='block font-medium text-gray-300 mb-2'>Password:</label>
            <input
              type="password"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className='w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded font-medium uppercase transition duration-200 dsabled:opacity-50'>Login</button>
        </form>
        <p className='mt-1 text-center text-xs text-yellow-400/60 btn-new'>
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
