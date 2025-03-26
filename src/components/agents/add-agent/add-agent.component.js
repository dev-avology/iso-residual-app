import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './add-agent.component.css';
import { createAgent } from '../../../api/agents.api'; // Ensure this is correct

const AddAgent = ({organizationID, authToken}) => {
  const navigate = useNavigate();
  const [agent, setAgent] = useState({
    fName: '',
    lName: '',
    merchants: [] // Empty merchants array for now
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAgent({
      ...agent,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting Agent:', agent);
      const response = await createAgent(organizationID, agent, authToken);

      navigate(`/agents/${response.data.agentID}`);
    } catch (error) {
      alert('Error creating agent');
    }
  };

  return (
    <div className="add-agent-container">
      <h2>Add Agent</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            name="fName"
            value={agent.fName}
            onChange={handleInputChange}
            placeholder="First Name"
            required
          />
        </div>
        <div className="form-group">
          <label>Last Name</label>
          <input
            type="text"
            name="lName"
            value={agent.lName}
            onChange={handleInputChange}
            placeholder="Last Name"
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Add Agent
        </button>
      </form>
    </div>
  );
};

export default AddAgent;
