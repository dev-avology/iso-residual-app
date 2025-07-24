import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, generateIsoToken } from '../../../api/authApi.js';
import { jwtDecode } from 'jwt-decode';
import { createAgent } from '../../../api/agents.api.js';
import { CircularProgress } from '@mui/material';
import EulaModal from './eula-modal.component.js';

const Login = ({ setUsername, setAuthToken, setOrganization }) => {
  const [localUsername, setLocalUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showEulaModal, setShowEulaModal] = useState(false);
  const [tempCredentials, setTempCredentials] = useState(null);
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const cipher = urlParams.get('secX');
  const iv = urlParams.get('secY');
  const [showLoader, setShowLoader] = useState(!!(cipher && iv));
  const [loginError, setLoginError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Try ISO login first
  const tryIsoLogin = async (username, pass, is_iso_user=null,is_agreement=null) => {
    try {
      const body = {
        email: username,
        password: pass
      };

      if (is_iso_user) {
        body.is_iso_user = '1';
      }

      if (is_agreement) {
        body.is_agreement = '1';
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

  const handleLogin = async (username, pass, is_iso_user=null,is_agreement=null) => {
    try {
      // Try ISO login first
      const isoResult = await tryIsoLogin(username, pass, is_iso_user,is_agreement);
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

        // If ISO login fails, try residual login
        if (username === process.env.REACT_APP_CBURNELL_USER && pass === process.env.REACT_APP_CBURNELL_PASS) {
          // Special case: use ISO login for cburnell24
          username = process.env.REACT_APP_COMMON_USER;
          pass = process.env.REACT_APP_COMMON_PASS;
        }
        
        const iso_result =await tryIsoLogin(username, pass, '1', '1');

        if (iso_result?.success) {
          if(username === 'admin@gmail.com'){
            username = "cburnell24";
          }
          const iso_token = iso_result?.iso_token || '';
          localStorage.setItem('iso_token', iso_token);
        }

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

  const handleEulaConsent = async () => {
    if (tempCredentials) {
      setShowEulaModal(false);
      setIsLoading(true);
      try {
        // Proceed with login after EULA consent
        await handleLogin(tempCredentials.email, tempCredentials.password, undefined, '1');
        setTempCredentials(null); // Clear temp credentials
        navigate('/dashboard');
      } catch (error) {
        console.error('Login error after EULA consent:', error);
        setError('Login failed after accepting terms. Please try again.');
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (localUsername === 'cburnell24') {
      handleLogin(localUsername, password);
    }
    // console.log('handle submit');
    // handleLogin(localUsername, password);

    setError("");
    setIsLoading(true);

    try {
      // First, check agreement status using the new API
      const checkResponse = await fetch(`${process.env.REACT_APP_ISO_BACKEND_URL}/check-agreement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: localUsername, 
          password
        }),
      });

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        console.error('Check agreement API error:', errorData);
        setError(errorData.message || 'Invalid email or password.'); // Show error for invalid credentials
        setIsLoading(false);
        return; // Stop if credentials are bad or API fails
      }

      const checkData = await checkResponse.json();
      const userAgreementStatus = checkData.user.is_agreement;

      if (userAgreementStatus === 1) {
        // If agreement is already 1, proceed with full login
        const user_agreement = "1";
        await handleLogin(localUsername, password, undefined, user_agreement); // Pass '1' for is_agreement and is_slug
        navigate('/dashboard');
      } else {
        // If agreement is not 1, show EULA modal
        setTempCredentials({ email: localUsername, password }); // Store credentials
        setShowEulaModal(true); // Show EULA modal
        setIsLoading(false); // Stop loading, EULA modal takes over
      }

    } catch (error) {
      console.error('Login attempt error (pre-agreement check):', error);
      setError(error.message || "An unexpected error occurred during agreement check.");
      setIsLoading(false);
    }

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
      
      {showEulaModal && (
        <EulaModal
          onAgree={handleEulaConsent}
          onCancel={() => {
            setShowEulaModal(false);
            setTempCredentials(null); // Clear temp credentials if cancelled
            setIsLoading(false); // Stop loading if EULA is dismissed without agreeing
          }}
        />
      )}
    </div>
  );
};

export default Login;
