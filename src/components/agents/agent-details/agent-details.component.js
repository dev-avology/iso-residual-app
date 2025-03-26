import React, { useState, useEffect } from 'react';
import './agent-details.component.css';

const AgentDetails = ({ agent, onAgentChange }) => {
  const [editedAgent, setEditedAgent] = useState(agent); // Manage agent edits locally
  const [isEditing, setIsEditing] = useState(false); // Track editing state

  useEffect(() => {
    if (agent) {
      setEditedAgent(agent);
    }
  }, [agent]);

  // Handle input changes with dynamic '%' display
  const handleInputChange = (field, value) => {
    // Remove non-numeric characters except decimal and keep '%'
    if (field === 'manager' || field === 'company') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
      setEditedAgent((prev) => ({
        ...prev,
        [field]: value,
      }));
      setIsEditing(true); // Mark as editing
      onAgentChange(field, value); // Notify parent of the change
    } else {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const formattedValue = `${numericValue}%`; // Append '%' symbol

    setEditedAgent((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));
    setIsEditing(true); // Mark as editing
    onAgentChange(field, formattedValue); // Notify parent of the change
    }
  };

  // Parse numeric value from percentage string
  const getNumericValue = (value) =>
    parseFloat(value.replace('%', '') || '0');

  // Calculate dynamic company split
  const calculateCompanySplit = (agentData) => {
    const agentSplit = getNumericValue(agentData.agentSplit);
    const managerSplit = getNumericValue(agentData.managerSplit);

    const companySplit = 100 - agentSplit - managerSplit;
    return companySplit >= 0 ? companySplit : 0; // Ensure non-negative value
  };

  const companySplit = calculateCompanySplit(editedAgent); // Get dynamic company split

  return (
    <div className="agent-details-container">
      <div className="header">
        <h2>Agent Details</h2>
      </div>

      <div className="agent-details-content">
        {/* Main Agent Information */}
        <div className="main-card">
          <h3>
            {editedAgent.fName} {editedAgent.lName}
          </h3>
          <div className="split-input-wrapper">
            <input
              type="text"
              value={editedAgent.agentSplit || ''}
              onChange={(e) => handleInputChange('agentSplit', e.target.value)}
              placeholder="Split"
              className="input small-input"
            />
          </div>
        </div>

        {/* Details Cards */}
        <div className="cards-container">
          {/* Company Card */}
          <div className="details-card">
            <h4>Company</h4>
            <input
              type="text"
              value={editedAgent.company || ''}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Company Name"
              className="input"
            />
            <input
              type="text"
              value={`${companySplit}%`} // Display company split
              className="input small-input"
              disabled
            />
          </div>

          {/* Manager Card */}
          <div className="details-card">
            <h4>Manager</h4>
            <input
              type="text"
              value={editedAgent.manager || ''}
              onChange={(e) => handleInputChange('manager', e.target.value)}
              placeholder="Manager Name"
              className="input"
            />
            <input
              type="text"
              value={editedAgent.managerSplit || ''}
              onChange={(e) => handleInputChange('managerSplit', e.target.value)}
              placeholder="Split"
              className="input small-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDetails;
