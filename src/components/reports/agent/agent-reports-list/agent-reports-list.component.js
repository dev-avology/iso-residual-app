import React, { useState, useEffect } from 'react';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getAgents } from '../../../../api/agents.api';
import { getReports } from '../../../../api/reports.api'; // Import processor reports fetching
// styles
import './agent-reports-list.component.css'; // Custom styling for agents list

const AgentReportsList = ({ authToken, organizationID, filterMonth, filterYear }) => {
  const [agents, setAgents] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Initialize the useNavigate hook

  useEffect(() => {
    if (authToken && organizationID) {
      fetchAgentsAndProcessorReports();
    }
  }, [authToken, organizationID, filterMonth, filterYear]);

  const fetchAgentsAndProcessorReports = async () => {
    try {
      setLoading(true);
      const agentResponse = await getAgents(organizationID, authToken); // Fetch agents
      const processorReports = await getReports(organizationID, 'processor', authToken); // Fetch processor reports

      // Check if the agents were fetched successfully
      const agentData = agentResponse?.agents || []; // Access agents array from response

      // Filter processor reports by selected month/year (if applicable)
      const filteredProcessorReports = processorReports.filter(report => {
        if (filterMonth && !report.month.includes(filterMonth)) return false;
        if (filterYear && report.year !== filterYear) return false;
        return true;
      });

      // Map over agents and find matching months for processor reports
      const agentReportList = agentData.map(agent => {
        const monthsWithProcessorReports = [...new Set(
          filteredProcessorReports
            .filter(report => report.processor) // Only include relevant processor reports
            .map(report => report.month)
        )];
        return { ...agent, monthsWithProcessorReports };
      });

      setAgents(agentReportList);
      setFilteredReports(agentReportList);
    } catch (error) {
      console.error('Error fetching agents or processor reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAgentReport = (agentID, month) => {
    // Navigate to a dynamically built agent report view
    navigate(`/agent-report/${agentID}?month=${month}`);
  };

  if (loading) {
    return <div className="agents-report-list"><p>Loading...</p></div>; // Display loading state
  }

  return (
    <div className="agents-report-list">
      <table>
        <thead>
          <tr>
            <th>Agent</th>
            <th>Months</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredReports.map(agent => (
            agent.monthsWithProcessorReports.length > 0 && agent.monthsWithProcessorReports.map((month) => (
              <tr key={`${agent.agentID}-${month}`}>
                <td>
                  {agent.role === 'company' ? agent.company : `${agent.fName} ${agent.lName}`}
                </td>
                <td>{month}</td>
                <td>
                  <button className="btn-view" onClick={() => handleViewAgentReport(agent.agentID, month)}>
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgentReportsList;
