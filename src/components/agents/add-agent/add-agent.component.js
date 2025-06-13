import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './add-agent.component.css';
import { createAgent, reauditAgents } from '../../../api/agents.api'; // Ensure this is correct
import { TextField, Typography } from '@mui/material';

const AddAgent = ({organizationID, authToken}) => {
  const navigate = useNavigate();
  const [agent, setAgent] = useState({
    fName: '',
    lName: '',
    email: '',
    password: '',
    role_id: '5',
    type: 'tracer',
    merchants: [] // Empty merchants array for now
  });

  const iso_token = localStorage.getItem('iso_token');

  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAgent({
      ...agent,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({}); // Clear previous errors
    
    try {
      // First create the user
      const userResponse = await fetch(`${process.env.REACT_APP_ISO_BACKEND_URL}/user/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${iso_token}`
        },

        body: JSON.stringify(agent)
      });

      const userData = await userResponse.json();
      console.log('userData',userData);
      // console.log('userData',userData);

      if (!userResponse.ok) {
        // Handle validation errors
        if (userData.errors) {
          setValidationErrors(userData.errors);
          return; // Stop here if there are validation errors
        }
        throw new Error(userData.message || 'Failed to create user');
      }

      const userId = userData?.data?.id;

      if (userId) {
        agent.user_id = String(userId); // or agent.userId, depending on your backend field
      }

      // If user creation successful, proceed with agent creation
      const agentResponse = await createAgent(organizationID, agent, authToken);
      
      // Handle successful creation
      console.log('Agent created successfully:', agentResponse);
      navigate(`/agents/${agentResponse.data.agentID}`);
    } catch (error) {
      console.error('Error:', error);
      // Handle other errors
      setValidationErrors({ general: [error.message] });
    }
  };

  return (
    <div className="add-agent-container bg-zinc-900 p-10 rounded-lg shadow-lg w-full max-w-md w-full">
      <h2 className='pb-6 mb-6 border-b border-yellow-400/20 text-lg font-semibold text-white mb-4'>Add Agent</h2>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4 mb-4">
          <div className="form-group flex-1">
            <label className='block font-medium text-gray-300 mb-2'>First Name</label>
            <input
              type="text"
              name="fName"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              value={agent.fName}
              onChange={handleInputChange}
              placeholder="First Name"
              required
            />
          </div>
          <div className="form-group flex-1">
            <label className='block font-medium text-gray-300 mb-2'>Last Name</label>
            <input
              type="text"
              name="lName"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              value={agent.lName}
              onChange={handleInputChange}
              placeholder="Last Name"
              required
            />
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="form-group flex-1">
            <label className='block font-medium text-gray-300 mb-2'>Phone</label>
            <input
              type="text"
              name="phone"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              onChange={handleInputChange}
              placeholder="Phone"
              required
            />
          </div>
          <div className="form-group flex-1">
            <label className='block font-medium text-gray-300 mb-2'>Email</label>
            <input
              type="email"
              name="email"
              className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
              onChange={handleInputChange}
              placeholder="Email"
              required
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.email[0]}</p>
            )}
          </div>
        </div>

        <div className="form-group mb-4">
          <label className='block font-medium text-gray-300 mb-2'>Password</label>
          <input
            type="password"
            name="password"
            className='w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500'
            onChange={handleInputChange}
            placeholder="Password"
            required
          />

          <input
            type="hidden"
            name="role_id"
            value="5"
            onChange={handleInputChange}
          />

          <input
            type="hidden"
            name="type"
            value="tracer"
            onChange={handleInputChange}
          />
        </div>

        {validationErrors.general && (
          <Typography color="error" variant="body2">
            {validationErrors.general[0]}
          </Typography>
        )}

        <button type="submit" className="submit-button w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded font-medium uppercase transition duration-200 dsabled:opacity-50">
          Add Agent
        </button>
      </form>
    </div>
  );
};

export default AddAgent;
