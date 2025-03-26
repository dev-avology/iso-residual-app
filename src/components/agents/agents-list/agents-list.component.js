import React, { useEffect, useState } from 'react';
import { getAgents, deleteAgent } from '../../../api/agents.api';
import { Link } from 'react-router-dom';
import { FaEye, FaTrash } from 'react-icons/fa';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import './agents-list.component.css';

const AgentsList = ({ organizationID, authToken }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const agentsPerPage = 10;

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await getAgents(organizationID, authToken);
        if (response && response.agents && Array.isArray(response.agents)) {
          setAgents(response.agents);
        } else {
          setAgents([]);
        }
      } catch (err) {
        setError('Failed to fetch agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [organizationID, authToken]);

  const handleDelete = async (agentID) => {
    confirmAlert({
      title: 'Confirm to delete',
      message: 'Are you sure you want to delete this agent? This action can\'t be undone.',
      buttons: [
        {
          label: 'Yes',
          onClick: async () => {
            try {
              await deleteAgent(organizationID, agentID, authToken);
              setAgents(agents.filter(agent => agent.agentID !== agentID));
            } catch (err) {
              setError('Failed to delete agent');
            }
          }
        },
        {
          label: 'No'
        }
      ]
    });
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter by role
  const handleFilterChange = (e) => {
    setFilterRole(e.target.value);
  };

  // Apply search and filters
  const filteredAgents = agents.filter(agent => {
    const fullName = `${agent.fName} ${agent.lName}`.toLowerCase();
    const companyName = agent.company?.toLowerCase() || '';

    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || companyName.includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || agent.role === filterRole;

    return matchesSearch && matchesRole;
  });

  // Pagination logic
  const indexOfLastAgent = currentPage * agentsPerPage;
  const indexOfFirstAgent = indexOfLastAgent - agentsPerPage;
  const currentAgents = filteredAgents.slice(indexOfFirstAgent, indexOfLastAgent);

  const totalPages = Math.ceil(filteredAgents.length / agentsPerPage);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  if (loading) {
    return <p>Loading agents...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="agents-list reports">
      <div className="header">
        <h2>Agents List</h2>
      </div>

      {/* Filters Section */}
      <div className="filters">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by name or company..."
          className="search-input"
        />

        <select value={filterRole} onChange={handleFilterChange} className="filter-select">
          <option value="all">All Roles</option>
          <option value="company">Company</option>
          <option value="individual">Individual</option>
        </select>
        <div className="actions-container">
          <Link to="/agents/add-agent" className="add-agent-link">
            <button className="add-agent-button">Add New Agent</button>
          </Link>
          <Link to="/agents/upload" className="upload-agent-link">
            <button className="upload-agent-button">Upload Agents</button>
          </Link>
        </div>

        
      </div>

      {filteredAgents.length === 0 ? (
        <p>No agents found.</p>
      ) : (
        <>
          <table className="agents-table">
            <thead>
              <tr>
                <th>First Name / Company Name</th>
                <th>Last Name</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentAgents.map((agent, index) => (
                <tr key={index}>
                  <td>{agent.role === 'company' ? agent.company : agent.fName}</td>
                  <td>{agent.role === 'company' ? '' : agent.lName}</td>
                  <td className="actions-column">
                    <Link to={`/agents/${agent.agentID}`}>
                      <button className="btn-view">
                        <FaEye />
                      </button>
                    </Link>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDelete(agent.agentID)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="pagination-controls">
            <button 
              className="pagination-btn" 
              onClick={handlePreviousPage} 
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
              className="pagination-btn" 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AgentsList;
