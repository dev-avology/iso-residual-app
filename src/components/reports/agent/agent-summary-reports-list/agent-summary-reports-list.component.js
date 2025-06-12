import React, { useState, useEffect } from "react";
import { FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getReports } from "../../../../api/reports.api";
import "./agent-summary-reports-list.component.css"; // Add your own styling here

const AgentSummaryReportsList = ({ authToken, organizationID, userID }) => {
  const [summaryReports, setSummaryReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authToken && organizationID) {
      fetchAgentReports();
    }
  }, [authToken, organizationID]);

  console.log('summaryReports',summaryReports);

  const fetchAgentReports = async () => {
    try {
      setLoading(true);
      // Fetch all reports
      const allReports = await getReports(organizationID, "agent", authToken);
      console.log('allReports',allReports);
      let approvedAgentReports = [];

      if(userID === ''){
        // Filter agent reports (type: 'agent') and check for approved reports
        approvedAgentReports = allReports
          // .filter(report => report.type === 'agent' && report.approved) // Only approved agent reports
          // this upper line is commented date 05-16-2025
          .filter((report) => report.type === "agent") // Only approved agent reports
          .reduce((acc, report) => {
            const monthYear = `${report.month}`;
            if (!acc.includes(monthYear)) {
              acc.push(monthYear); // Collect unique month-year combinations
            }
            return acc;
          }, []);
      }else {
         approvedAgentReports = allReports
         .filter((report) => report.type === "agent" && report.userID == userID)
         .reduce((acc, report) => {
           const monthYear = `${report.month}`;
           if (!acc.includes(monthYear)) {
             acc.push(monthYear);
           }
           return acc;
         }, []);
      }

      // Create summary reports for the unique month-year combinations
      const summaryReportsData = approvedAgentReports.map((monthYear) => {
        const [month, year] = monthYear.split("-");
        return { month, year };
      });

      setSummaryReports(summaryReportsData);
    } catch (error) {
      console.error("Error fetching agent reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSummaryReport = (month, year) => {
    // Navigate to the agent summary report viewer page
    navigate(`/agent-summary-report?month=${month}`);
  };

  if (loading) {
    return (
      <div className="agent-summary-reports-list">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="agent-summary-reports-list">
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {summaryReports.map((summaryReport, index) => (
            <tr key={`${summaryReport.month}-${summaryReport.year}-${index}`}>
              <td>
                {summaryReport.year
                  ? `${summaryReport.month}-${summaryReport.year}`
                  : summaryReport.month}
              </td>
              <td>
                <button
                  className="btn-view"
                  onClick={() =>
                    handleViewSummaryReport(
                      summaryReport.month,
                      summaryReport.year
                    )
                  }
                >
                  <FaEye />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgentSummaryReportsList;
