import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, generateIsoToken } from '../../../api/authApi.js';
import { jwtDecode } from 'jwt-decode';
import { createAgent } from '../../../api/agents.api.js';
import { CircularProgress } from '@mui/material';

const Login = ({ setUsername, setAuthToken, setOrganization }) => {
  const [localUsername, setLocalUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const cipher = urlParams.get('secX');
  const iv = urlParams.get('secY');
  const [showLoader, setShowLoader] = useState(!!(cipher && iv));
  const [loginError, setLoginError] = useState(null);

  // Try ISO login first
  const tryIsoLogin = async (username, pass, is_iso_user=null) => {
    try {
      const body = {
        email: username,
        password: pass
      };

      if (is_iso_user) {
        body.is_iso_user = '1'; // or just use `is_iso_user` if it's already the right value
      }

      const response = await fetch(`${process.env.REACT_APP_ISO_BACKEND_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      console.log(response);
      // return false;

      if (!response.ok) {
        throw new Error('ISO login failed');
      }

      const data = await response.json();
      console.log('helo data',data);
      return {
        success: true,
        token: data.token,
        isIsoUser: true,
        user: `${data.user?.first_name || ''} ${data.user?.last_name || ''}`.trim(),
        firstName : data.user?.first_name || '',
        lastName : data.user?.last_name || '',
        user_id: data.user?.id || '',
        role_id: data.user?.role_id || '',
        email: data.user?.email || '',
        // user_id: data.user?.id || '',
        iso_token: data.token,
      };
    } catch (error) {
      console.error('ISO login error:', error);
      return { success: false };
    }
  };

  // Try residual login
  const tryResidualLogin = async (username, pass) => {
    try {
      const { token } = await login(username, pass);
      return {
        success: true,
        token,
        isIsoUser: false
      };
    } catch (error) {
      console.error('Residual login error:', error);
      return { success: false };
    }
  };

  const handleLogin = async (username, pass, is_iso_user=null) => {
    try {
      // Try ISO login first
      const isoResult = await tryIsoLogin(username, pass, is_iso_user);
      // console.log()
      
      if (isoResult?.success) {
        try {
          // Safely get the username or fallback to empty string
          const username = isoResult?.user || '';
          const roleId = isoResult?.role_id || '';
          const email = isoResult?.email || '';
          const user_id = isoResult?.user_id || '';
          const iso_token = isoResult?.iso_token || '';
      
          // Ensure generateIsoToken is called only with valid string
          const { token } = await generateIsoToken(username, roleId, email, user_id);
      
          // Safe access for token and payload
          const authToken = token?.token || '';
          const organizationID = token?.payload?.organization || '';
      
          // Store values in localStorage (fallback to empty if any issue)
          localStorage.setItem('authToken', authToken);
          localStorage.setItem('iso_token', iso_token);
          localStorage.setItem('username', username);
          localStorage.setItem('organizationID', organizationID);
          localStorage.setItem('isIsoUser', 'true');
          
          // Update state safely
          setUsername(username);
          setAuthToken(authToken);
          setOrganization(organizationID);

          const agent = {
            fName: isoResult.firstName,
            lName: isoResult.lastName,
            user_id: isoResult.user_id.toString(),
            merchants: [] // Empty merchants array for now
          }

          const response = await createAgent(organizationID, agent, authToken);
          console.log('response', response);
          
          // Navigate to dashboard after successful agent creation
          navigate('/dashboard');
          return true; // Return true to indicate successful login
        } catch (err) {
          console.error('ISO Login error:', err);
          setError('Failed to create agent. Please try again.');
          return false; // Return false to indicate login failure
        }
      }

      // If ISO login fails, try residual login
      const residualResult = await tryResidualLogin(username, pass);
      
      if (residualResult.success) {
        const token = residualResult.token;
        const decodedToken = jwtDecode(token);
        const organizationID = decodedToken.organization;
        
        // Store token and organizationID in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('username', username);
        localStorage.setItem('organizationID', organizationID);
        localStorage.setItem('isIsoUser', 'false');
        
        // Update state
        setUsername(username);
        setAuthToken(token);
        setOrganization(organizationID);
        
        navigate('/dashboard');
        return;
      }

      // If both logins fail
      setError('Invalid username or password');
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    }
  };

  useEffect(() => {
    const handleDecryptCredentials = async () => {
      if (cipher && iv) {
        setShowLoader(true);
        try {
          const response = await fetch(`${process.env.REACT_APP_ISO_BACKEND_URL}/decrypt/cred`, {
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
          
          if (email && pass) {
            setLocalUsername(email);
            setPassword(pass);
            const is_iso_user = "1";
            // Automatically trigger login
            handleLogin(email, pass, is_iso_user);
          }
        } catch (error) {
          setLoginError('Login failed. Please try again.');
        } finally {
          setShowLoader(false);
        }
      }
    };
    handleDecryptCredentials();
    // eslint-disable-next-line
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleLogin(localUsername, password);
  };
  
  if (cipher && iv) {
    if (showLoader) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </div>
      );
    }
    if (loginError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>
          {loginError}
        </div>
      );
    }
    // Do not render the login form at all
    return null;
  }

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
