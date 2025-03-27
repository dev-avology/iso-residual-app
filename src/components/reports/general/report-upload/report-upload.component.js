import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import the hook
import { addReport } from '../../../../api/reports.api.js';
import './report-upload.component.css';

const ReportUpload = ({ authToken, organizationID }) => {
  const processors = [
    'accept.blue',
    'Clearent',
    'Fiserv Bin & ICA',
    'Fiserv Omaha',
    'Global',
    'Hyfin',
    'Merchant Lynx',
    'Micamp',
    'PAAY',
    'Payment Advisors',
    'Rectangle Health',
    'Shift4',
    'TRX'
  ];

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Dynamically generate years including the current year and the previous few years
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const [rows, setRows] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const navigate = useNavigate(); // Initialize useNavigate

  const handleAddRow = () => {
    setRows([...rows, { processor: '', file: null }]);
  };

  const handleProcessorChange = (index, value) => {
    const updatedRows = [...rows];
    updatedRows[index].processor = value;
    setRows(updatedRows);
  };

  const handleFileChange = (index, file) => {
    const updatedRows = [...rows];
    updatedRows[index].file = file;
    setRows(updatedRows);
  };

  const handleDeleteRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (rows.length === 0) {
      setUploadStatus('Please add at least one file to upload.');
      return;
    }

    if (!selectedMonth || !selectedYear) {
      setUploadStatus('Please select a month and year.');
      return;
    }

    try {
      setLoading(true); // Show loading popup
      const formData = new FormData();
      
      rows.forEach((row) => {
        if (row.file && row.processor) {
          const processorFieldName = row.processor;
          formData.append(processorFieldName, row.file);
        }
      });

      formData.append('month', selectedMonth);
      formData.append('year', selectedYear);

      const response = await addReport(organizationID, formData, authToken);
      console.log('API Response:', response);

      if (response && response.status === 200) {
        setUploadStatus('Files uploaded successfully!');
        setLoading(false); // Hide loading popup
        navigate('/reports/all'); // Redirect after successful upload
      } else {
        setUploadStatus('Failed to upload files.');
        setLoading(false); // Hide loading popup on failure
      }
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
      setLoading(false); // Hide loading popup on error
      console.error('Upload error:', error);
    }
  };
  
  
  const selectedProcessors = rows.map(row => row.processor); // Get all selected processors

  return (
    <div className="report-upload-container">
      <h2>Upload Reports</h2>

      {/* Month and Year Selection */}
      <div className="month-year-selection">
        <label>
          Month:
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} required>
            <option value="" disabled>Select Month</option>
            {months.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </label>

        <label>
          Year:
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} required>
            <option value="" disabled>Select Year</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
      </div>

      <form onSubmit={handleUpload}>
        <table className="report-upload-table">
          <thead>
            <tr>
              <th>Processor</th>
              <th>File</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <select
                    value={row.processor}
                    onChange={(e) => handleProcessorChange(index, e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Processor</option>
                    {processors
                      .filter(processor => !selectedProcessors.includes(processor) || processor === row.processor) // Ensure processor is available or already selected
                      .map((processor) => (
                        <option key={processor} value={processor}>
                          {processor}
                        </option>
                      ))}
                  </select>
                </td>
                <td>
                  <input
                    type="file"
                    accept=".csv, .xlsx" // Limit file types to CSV and XLSX
                    onChange={(e) => handleFileChange(index, e.target.files[0])}
                    required
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDeleteRow(index)}
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="add-row-btn">
          <button type="button" onClick={handleAddRow}>
            Add File <i className="fa fa-plus"></i>
          </button>
        </div>

        {rows.length > 0 && (
          <button type="submit" className="upload-btn">
            Upload Files
          </button>
        )}
      </form>
      
      {uploadStatus && <p className="upload-status">{uploadStatus}</p>}

      {/* Loading Popup */}
      {loading && (
        <div className="loading-popup">
          <div className="loading-spinner"></div>
          <p>Uploading... Please wait</p>
        </div>
      )}
    </div>
  );
};

export default ReportUpload;
