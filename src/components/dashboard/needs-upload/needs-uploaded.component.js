import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './needs-uploaded.component.css'; // Assuming you'll add styles here

const NeedsUploaded = ({ reports }) => {
  const [processorsThatNeedUpload, setProcessorsThatNeedUpload] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 5; // Adjust this value based on how many reports you want per page
  const navigate = useNavigate(); // To navigate to uploader

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle navigation to the uploader
  const goToUploader = () => {
    navigate('/upload-report'); // Adjust the route to your uploader route
  };

  useEffect(() => {
    const processorReports = {
      'accept.blue': 'billing report',
      'PAAY': 'billing report',
      'Clearent': 'process report',
      'Fiserv Bin & ICA': 'process report',
      'Fiserv Omaha': 'process report',
      'Global': 'process report',
      'Merchant Lynx': 'process report',
      'Micamp': 'process report',
      'Payment Advisors': 'process report',
      'Shift4': 'process report',
      'Hyfin': 'process report',
      'Rectangle Health': 'process report',
      'TRX': 'process report',
    };

    // Gather processors from reports that have been uploaded
    const uploadedProcessors = [];
    reports.forEach((report) => {
      if (report.processor) {
        uploadedProcessors.push(report.processor);
      }
      if (report.processors && report.processors.length > 0) {
        uploadedProcessors.push(...report.processors);
      }
    });

    // Remove duplicates from uploaded processors
    const uniqueUploadedProcessors = [...new Set(uploadedProcessors)];

    // Check for processors that haven't uploaded reports
    const processorsThatNeedUpload = Object.keys(processorReports).filter(
      (processor) => !uniqueUploadedProcessors.includes(processor)
    );

    setProcessorsThatNeedUpload(
      processorsThatNeedUpload.map((processor) => ({
        processor,
        reportType: processorReports[processor],
      }))
    );
  }, [reports]);

  // Pagination logic
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = processorsThatNeedUpload.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(processorsThatNeedUpload.length / reportsPerPage);

  return (
    <div className="needs-upload-container">
      <h3>Reports Needing Upload</h3>
      {processorsThatNeedUpload.length > 0 ? (
        <>
          <ul className="report-list">
            {currentReports.map((report, index) => (
              <li key={index} className="report-item">
                <strong>Processor:</strong> {report.processor}
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

          {/* Upload Button */}
          <div className="upload-button-container">
            <button className="upload-btn" onClick={goToUploader}>
              Upload Missing Reports
            </button>
          </div>
        </>
      ) : (
        <p>All reports have been uploaded.</p>
      )}
    </div>
  );
};

export default NeedsUploaded;
