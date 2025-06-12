import React, { useState, useEffect } from 'react';
import './agent-details.component.css';

const SPLIT_TYPES = {
  AGENT: 'Agent',
  PARTNER: 'Partner',
  MANAGER: 'Manager',
  COMPANY: 'Company',
  OTHER: 'Other/Custom'
};

const AgentDetails = ({ agent, allAgents, onAgentChange, userID }) => {
  const [editedAgent, setEditedAgent] = useState(agent);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSplitType, setSelectedSplitType] = useState('');

  useEffect(() => {
    if (agent) {
      setEditedAgent({
        ...agent,
        additional_splits: agent.additional_splits || []
      });
    }
  }, [agent]);

  console.log('allAgentsssss',allAgents);

  // Handle input changes with dynamic '%' display
  const handleInputChange = (field, value) => {
    if (field === 'manager' || field === 'company') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
      setEditedAgent((prev) => ({
        ...prev,
        [field]: value,
      }));
      setIsEditing(true);
      onAgentChange(field, value);
    } else {
      const numericValue = value.replace(/[^0-9.]/g, '');
      const formattedValue = `${numericValue}%`;

      setEditedAgent((prev) => ({
        ...prev,
        [field]: formattedValue,
      }));
      setIsEditing(true);
      onAgentChange(field, formattedValue);
    }
  };

  // Handle additional split changes
  const handleAdditionalSplitChange = (index, field, value) => {
    const newSplits = [...(editedAgent.additional_splits || [])];
    if (field === 'name') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
      newSplits[index] = { ...newSplits[index], name: value };
    } else {
      const numericValue = value.replace(/[^0-9.]/g, '');
      newSplits[index] = { ...newSplits[index], split: `${numericValue}%` };
    }
    
    const updatedAgent = {
      ...editedAgent,
      additional_splits: newSplits
    };
    
    setEditedAgent(updatedAgent);
    setIsEditing(true);
    onAgentChange('additional_splits', newSplits);
  };

  // Add new split
  const handleAddSplit = () => {
    if (selectedSplitType) {
      const newSplits = [
        ...(editedAgent.additional_splits || []),
        { type: selectedSplitType, name: '', split: '0%' }
      ];
      
      const updatedAgent = {
        ...editedAgent,
        additional_splits: newSplits
      };
      
      setEditedAgent(updatedAgent);
      setSelectedSplitType('');
      setIsEditing(true);
      onAgentChange('additional_splits', newSplits);
    }
  };

  // Remove split
  const handleRemoveSplit = (index) => {
    const newSplits = (editedAgent.additional_splits || []).filter((_, i) => i !== index);
    
    const updatedAgent = {
      ...editedAgent,
      additional_splits: newSplits
    };
    
    setEditedAgent(updatedAgent);
    setIsEditing(true);
    onAgentChange('additional_splits', newSplits);
  };

  // Parse numeric value from percentage string
  const getNumericValue = (value) => parseFloat(value.replace('%', '') || '0');

  // Calculate total split
  const calculateTotalSplit = () => {
    const agentSplit = getNumericValue(editedAgent.agentSplit);
    const managerSplit = getNumericValue(editedAgent.managerSplit);
    const additionalSplitsTotal = (editedAgent.additional_splits || []).reduce((sum, split) => 
      sum + getNumericValue(split.split), 0);
    
    return agentSplit + managerSplit + additionalSplitsTotal;
  };

  // Calculate company split
  const calculateCompanySplit = () => {
    const totalSplit = calculateTotalSplit();
    const companySplit = 100 - totalSplit;
    return companySplit >= 0 ? companySplit : 0;
  };

  const companySplit = calculateCompanySplit();

  return (
    <div className="agent-details-container">
      <div className="header">
        <h2 className='text-lg font-semibold text-white mb-0'>Agent Details</h2>
      </div>

      <div className="agent-details-content">
        {/* Main Agent Information */}
        <div className="main-card">
          <h3 className='text-xs font-medium text-gray-300 uppercase tracking-wider'>
            {editedAgent.fName} {editedAgent.lName}
          </h3>
          <div className="split-input-wrapper">
            <input
              type="text"
              value={editedAgent.agentSplit || ''}
              onChange={(e) => handleInputChange('agentSplit', e.target.value)}
              placeholder="Split"
              readOnly={userID !== ''}
              className="input small-input block w-full pr-10 truncate text-center bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400"
            />
          </div>
        </div>

        {/* Details Cards */}
        <div className="cards-container">
          {/* Company Card */}
          <div className="details-card">
            <h4 className='text-xs font-medium text-gray-300 uppercase tracking-wider'>Company</h4>
            <input
              type="text"
              value={editedAgent.company || ''}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Company Name"
              readOnly={userID !== ''}
              className="input truncate text-center bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400"
            />
            <input
              type="text"
              value={`${companySplit}%`}
              readOnly={userID !== ''}
              className="input small-input truncate text-center bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400"
              disabled
            />
          </div>

          {/* Manager Card */}
          <div className="details-card">
            <h4 className='text-xs font-medium text-gray-300 uppercase tracking-wider'>Manager</h4>
            <input
              type="text"
              value={editedAgent.manager || ''}
              readOnly={userID !== ''}
              onChange={(e) => handleInputChange('manager', e.target.value)}
              placeholder="Manager Name"
              className="input truncate text-center bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400"
            />
            <input
              type="text"
              value={editedAgent.managerSplit || ''}
              readOnly={userID !== ''}
              onChange={(e) => handleInputChange('managerSplit', e.target.value)}
              placeholder="Split"
              className="input small-input truncate text-center bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400"
            />
          </div>

          {/* Additional Splits Card */}
          <div className="details-card">
            <h4 className='text-xs font-medium text-gray-300 uppercase tracking-wider'>Additional Splits</h4>
            <div className="mb-4">



              {
                userID === '' && (
                <>
                <select
                  value={selectedSplitType}
                  onChange={(e) => setSelectedSplitType(e.target.value)}
                  className="input block w-full bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400" style={{ color: 'black' }}
                >
                  <option value="">Select Split Type</option>
                  {Object.values(SPLIT_TYPES).map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddSplit}
                  disabled={!selectedSplitType}
                  className="mt-2 px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 disabled:opacity-50"
                >
                  Add Split
                </button>
                </>
                )
              }

            </div>

            {(editedAgent.additional_splits || []).map((split, index) => (
              <div key={index} className="mb-4 p-2 border border-zinc-700 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">{split.type}</span>
                  {
                    userID === '' && (      
                      <button
                        onClick={() => handleRemoveSplit(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )
                  }
                </div>
                <select
                  value={split.name || ""}
                  onChange={(e) => handleAdditionalSplitChange(index, 'name', e.target.value)}
                  className="input block w-full mb-2 bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400" 
                  style={{ color: "black"}}
                  disabled={userID !== ''}
                >
                  <option value="" style={{ color: "black"}}>Select {split.type}</option>
                  {allAgents.map((agent) => {
                    const fullName = `${agent.fName} ${agent.lName}`;
                    return (
                      <option 
                        key={agent.agentID} 
                        value={fullName}
                        style={{ color: "black"}}
                      >
                        {fullName}
                      </option>
                    );
                  })}
                </select>
                <input
                  type="text"
                  value={split.split}
                  onChange={(e) => handleAdditionalSplitChange(index, 'split', e.target.value)}
                  placeholder="Split"
                  readOnly={userID !== ''}
                  className="input block w-full bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDetails;
