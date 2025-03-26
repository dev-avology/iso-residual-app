import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './needs-audit.component.css'; // Assuming you'll add styles here

const NeedsAudit = ({ reports }) => {
  const [reportsThatNeedAudit, setReportsThatNeedAudit] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 5; // Adjust the number of reports per page
  const navigate = useNavigate();

  useEffect(() => {
    // Filter reports that have entries needing audit
    const reportsNeedingAudit = reports.filter(report => 
      Array.isArray(report.reportData) && report.reportData.some(item => item.needsAudit)
    );
    setReportsThatNeedAudit(reportsNeedingAudit);
  }, [reports]);

  // Pagination logic
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reportsThatNeedAudit.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reportsThatNeedAudit.length / reportsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Navigate to the report edit page
  const handleEditClick = (reportID) => {
    navigate(`/report/${reportID}`);
  };

  return (
    <div className="needs-audit-container">
      <h3>Reports Needing Audit</h3>
      {reportsThatNeedAudit.length > 0 ? (
        <>
          <ul className="audit-list">
            {currentReports.map((report, index) => (
              <li key={index} className="audit-item">
                <strong>{report.processor || 'Unknown Processor'}</strong>
                <button onClick={() => handleEditClick(report.reportID)}>Edit</button>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`pagination-btn ${index + 1 === currentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p>All reports have been audited.</p>
      )}
    </div>
  );
};

export default NeedsAudit;
