import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Correct import for jwt-decode
import '@fortawesome/fontawesome-free/css/all.min.css';
// layout components

import Sidebar from './layouts/sidebar/sidebar.layout.js';
import Footer from './layouts/footer/footer.layout.js';
// components
import Login from './components/auth/login/login.component.js';
import Signup from './components/auth/signup/signup.component.js';
import ReportUpload from './components/reports/general/report-upload/report-upload.component.js';
import UserSettings from './components/user-settings/user-settings.component.js';
import ManageTeam from './components/manage-team/manage-team.component.js';
// pages
// Merchants
import MerchantsListPage from './pages/merchants/merchantsList.page.js';

// Agents
import Agents from './pages/agents/agents/agents.page.js';
import AddAgentPage from './pages/agents/add-agent/add-agent.page.js';
import AgentViewer from './pages/agents/agent-viewer/agent-viewer.page.js';
import AgentUploader from './components/agents/agent-uploader/agent-uploader.component.js';
import NeedsAuditPage from './pages/agents/needs-audit/needs-audit.page.js';
// Dashboard
import Dash from './pages/dash/dash.page.js';
// Reports
import Reports from './pages/reports/general/reports-list/reports-list.page.js';
import AgentReportViewerPage from './pages/reports/agent/agent-report-viewer/agent-report-viewer.page.js';
import ProcessorSummaryReportViewerPage from './pages/reports/processor/processor-summary-report-viewer/processor-summary-report-viewer.page.js';
import AgentSummaryReportViewerPage from './pages/reports/agent/agent-summary-report-viewer/agent-summary-report-viewer.page.js';
import BankSummaryReportViewerPage from './pages/reports/bank/bank-summary-report-viewer/bank-summary-report-viewer.page.js';

import ReportViewerPage from './pages/reports/general/report-viewer/report-viewer.page.js';
// Settings

// styles
import './App.css';

function App() {
  const [username, setUsername] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [organizationID, setOrganization] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
  
    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
  
        setUsername(decodedToken.username);
        setOrganization(decodedToken.organization);  // Directly set organizationID from token
        setIsAdmin(decodedToken.isAdmin);
        setAuthToken(storedToken);
  
        // Ensure organizationID is also in localStorage
        if (!localStorage.getItem('organizationID')) {
          localStorage.setItem('organizationID', decodedToken.organization);
        }
  
        // Check if the token is expired
        if (isAuthTokenExpired(storedToken)) {
          handleLogout();
        }
      } catch (error) {
        console.error('Invalid token:', error);
        handleLogout();
      }
    }
  }, []);  // Only runs on initial render
  

  const handleLogout = () => {
    // Clear authentication-related data
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');

    // Clear organization-specific stats and organization ID
    if (organizationID) {
      localStorage.removeItem(`recentTransactions_${organizationID}`);
      localStorage.removeItem(`recentBilled_${organizationID}`);
      localStorage.removeItem(`reportMonth_${organizationID}`);
      localStorage.removeItem('organizationID');
    }

    // Reset state variables
    setUsername(null);
    setIsAdmin(false);
    setAuthToken(null);
    setOrganization(null);
  };

  const isAuthTokenExpired = (authToken) => {
    if (!authToken) return true; // If no token, treat it as expired

    try {
      const decodedToken = jwtDecode(authToken); // Decode the token
      const currentTime = Date.now() / 1000; // Current time in seconds

      // Check if the token is expired
      return decodedToken.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true; // Treat any error during decoding as expired token
    }
  };

  if (authToken && isAuthTokenExpired(authToken)) {
    // If the token is expired, log out
    handleLogout();
  }

  return (
    <Router>
      <div className="app-container bg-black">
        {username && <Sidebar username={username} isAdmin={isAdmin} onLogout={handleLogout} />}
        <div className="page-content">
          <Routes>
            <Route
              path="/"
              element={username ? <Navigate to="/dashboard" /> : <Login setUsername={setUsername} setOrganization={setOrganization} setAuthToken={setAuthToken} />}
            />
            <Route path="/signup" element={<Signup />} />
            {username && !isAuthTokenExpired(authToken) ? (
              <>
                {/* Protected routes */}
                {/* Dashboard */}
                <Route path="/dashboard" element={<Dash organizationID={organizationID} username={username} authToken={authToken} />} />
                <Route path="/admin-dashboard" element={<Dash username={username} authToken={authToken} />} />
                { /* Merchant */}
                <Route path="/merchants" element={<MerchantsListPage organizationID={organizationID} authToken={authToken} />} />
                {/* Agents */}
                <Route path='/agents' element={<Agents organizationID={organizationID} authToken={authToken} />} />
                <Route path='/agents/upload' element={<AgentUploader organizationID={organizationID} authToken={authToken} />} />
                <Route path='/agents/add-agent' element={<AddAgentPage organizationID={organizationID} authToken={authToken} />} />
                <Route path='/agents/:agentID' element={<AgentViewer organizationID={organizationID} authToken={authToken} />} />
                <Route path='/needs-audit' element={<NeedsAuditPage organizationID={organizationID} authToken={authToken} />} />
                {/* Reports */}
                <Route path="/upload-report" element={<ReportUpload authToken={authToken} organizationID={organizationID} />} />
                <Route path="/reports/:type" element={<Reports authToken={authToken} organizationID={organizationID} />} />
                <Route path="/report/:reportID" element={<ReportViewerPage authToken={authToken} organizationID={organizationID} reportType="billing" />} />
                <Route path="/agent-report/:agentID" element={<AgentReportViewerPage authToken={authToken} organizationID={organizationID} />} />
                <Route path="/processor-summary-report" element={<ProcessorSummaryReportViewerPage authToken={authToken} organizationID={organizationID} />} />
                <Route path="/Agent-summary-report" element={<AgentSummaryReportViewerPage authToken={authToken} organizationID={organizationID} />} />
                <Route path="/bank-summary-report" element={<BankSummaryReportViewerPage authToken={authToken} organizationID={organizationID} />} />
                { /* User Settings and Manage Team */}
                <Route path='/user-settings/:username' element={<UserSettings authToken={authToken} organizationID={organizationID} username={username} setUsername={setUsername} isAdmin={isAdmin} />} />
                <Route path="/manage-team" element={<ManageTeam authToken={authToken} organizationID={organizationID} />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/" />} />
            )}
          </Routes>
        </div>
      </div>
      {username && <Footer />}
    </Router>
  );
}

export default App;
