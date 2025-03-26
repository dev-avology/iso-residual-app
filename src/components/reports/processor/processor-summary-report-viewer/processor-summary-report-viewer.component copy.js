import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getProcessorSummaryReport, generateProcessorSummaryReport, createProcessorSummaryReport, updateReport } from '../../../../api/reports.api.js';
import './processor-summary-report-viewer.component.css';
import { FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const ProcessorSummaryReportViewer = ({ authToken, organizationID }) => {
  const [summaryReport, setSummaryReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvedRows, setApprovedRows] = useState([]);
  const [dbReport, setDbReport] = useState(null);
  const [hasChanges, setHasChanges] = useState(false); // Track if any changes were made
  const [selectedRows, setSelectedRows] = useState([]);

  const location = useLocation();

  // Extract the monthYear from the URL
  const queryParams = new URLSearchParams(location.search);
  const monthYear = queryParams.get('month');

  useEffect(() => {
    if (authToken && organizationID && monthYear) {
      const initializeData = async () => {
        try {
          await generateSummaryReport(); // Generate the report first
          await fetchSavedProcessorSummaryReport(); // Then fetch the saved approvals
          console.log('approvedRows:', approvedRows);
        } catch (err) {
          console.error("Initialization failed:", err);
          setError('Initialization failed.');
        }
      };
      initializeData();
    } else {
      setError('Missing required data to fetch reports');
    }
  }, [authToken, organizationID, monthYear]);

  // Generate Processor Summary Report
  const generateSummaryReport = async () => {
    try {
      setLoading(true);
      const response = await generateProcessorSummaryReport(organizationID, monthYear, authToken);

      const processorReports = response.data.reportData;

      if (!Array.isArray(processorReports)) {
        throw new Error('Invalid response structure: reportData is not an array');
      }

      setSummaryReport(processorReports);
    } catch (err) {
      console.error('Error generating processor summary report:', err);
      setError('Failed to generate processor summary report');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedProcessorSummaryReport = async () => {
    try {
      const savedReportResponse = await getProcessorSummaryReport(organizationID, monthYear, authToken);
      if (savedReportResponse && savedReportResponse.data) {
        const savedReportData = savedReportResponse.data.reportData || [];
        console.log('Saved report data:', savedReportData);
        setApprovedRows(savedReportData);
        mergeApprovedRows(savedReportData); // Merge saved data into the generated report
        setDbReport(savedReportResponse.data); // Store the report metadata
      }
    } catch (error) {
      console.error('Error fetching saved processor summary report:', error);
    }
  };

  // Merge approvedRows with summaryReport only when approvedRows changes
useEffect(() => {
  if (approvedRows.length && summaryReport.length) {
    const updatedSummaryReport = summaryReport.map((item) => {
      const approvedRow = approvedRows.find(row => row.processor === item.processor);
      return { ...item, approved: approvedRow ? approvedRow.approved : false };
    });

    // Only update if there's a difference
    if (JSON.stringify(updatedSummaryReport) !== JSON.stringify(summaryReport)) {
      setSummaryReport(updatedSummaryReport);
    }
  }
}, [approvedRows]); // Depend only on approvedRows


  const mergeApprovedRows = (approvedRows) => {
    if (!summaryReport.length || !approvedRows.length) return;

    const updatedSummaryReport = summaryReport.map((item) => {
      const approvedRow = approvedRows.find(row => row.processor === item.processor);
      return {
        ...item,
        approved: approvedRow ? approvedRow.approved : false
      };
    });

    setSummaryReport(updatedSummaryReport);
  };


  const handleBulkSelect = () => {
    const allSelected = selectedRows.length === summaryReport.length;
    setSelectedRows(allSelected ? [] : summaryReport.map(item => item.processor));
  };

  const handleBulkApprove = () => {
    const updatedApprovedRows = [...approvedRows];
    selectedRows.forEach((processor) => {
      if (!updatedApprovedRows.some(row => row.processor === processor)) {
        updatedApprovedRows.push({ processor, approved: true });
      }
    });

    setApprovedRows(updatedApprovedRows);
    setSummaryReport((prevReport) =>
      prevReport.map((item) =>
        selectedRows.includes(item.processor) ? { ...item, approved: true } : item
      )
    );
    setSelectedRows([]);
    setHasChanges(true);
  };


  // Save changes to the backend
  const handleSaveChanges = async () => {
    try {
        // Check if all rows are approved
        const allRowsApproved = summaryReport.every((item) =>
            approvedRows.some(approvedRow =>
                approvedRow.processor === item.processor && approvedRow.approved
            )
        );

        // Prepare the updated report object, excluding _id
        const { _id, ...reportWithoutId } = dbReport || {}; // Safely destructure if dbReport exists
        const updatedReport = {
            ...reportWithoutId,  // ✅ Excludes the `_id` field from the payload
            organizationID,
            monthYear,
            reportData: approvedRows,
            approved: allRowsApproved,
        };

        // Save the report (update or create)
        if (dbReport?.reportID) {
            console.log("Updating existing report:", updatedReport);
            await updateReport(dbReport.reportID, updatedReport, authToken);
        } else {
            console.log("Creating a new processor summary report:", updatedReport);
            await createProcessorSummaryReport(organizationID, updatedReport, authToken);
        }

        alert('Changes saved successfully!');
    } catch (error) {
        console.error('Error saving processor summary report:', error);
        alert('Error saving summary report. Please check the console for more details.');
    }
};


  // Export to CSV function
  const exportToCSV = () => {
    const csvHeaders = [
      "Processor", "Total Transactions", "Total Sales Amount", "Total Income", "Total Expenses", "Total Net", "Total Agent Net", "Approved"
    ];
    const csvRows = summaryReport.map(item => [
      item.processor,
      item.totalTransactions,
      item.totalSalesAmount,
      item.totalIncome,
      item.totalExpenses,
      item.totalNet,
      item.totalAgentNet,
      item.approved ? 'Yes' : 'No'
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `Processor_Summary_Report_${monthYear}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  // Render table rows
  const renderTableRows = () => {
    return summaryReport.map((item, index) => {
      const isApproved = item.approved;
      const isSelected = selectedRows.includes(item.processor);
      const totalTransactions = Number.isFinite(item.totalTransactions) ? item.totalTransactions.toFixed(2) : 'N/A';
      const totalSalesAmount = Number.isFinite(item.totalSalesAmount) ? item.totalSalesAmount.toFixed(2) : 'N/A';
      const totalIncome = Number.isFinite(item.totalIncome) ? item.totalIncome.toFixed(2) : 'N/A';
      const totalExpenses = Number.isFinite(item.totalExpenses) ? item.totalExpenses.toFixed(2) : 'N/A';
      const totalNet = Number.isFinite(item.totalNet) ? item.totalNet.toFixed(2) : 'N/A';
      const totalAgentNet = Number.isFinite(item.totalAgentNet) ? item.totalAgentNet.toFixed(2) : 'N/A';

      return (
        <tr key={index} className={`report-row ${isApproved ? 'approved' : ''}`}>
          <td>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => setSelectedRows(prev =>
                isSelected ? prev.filter(id => id !== item.processor) : [...prev, item.processor]
              )}
            />
          </td>
          <td>{item.processor}</td>
          <td>{totalTransactions}</td>
          <td>{totalSalesAmount}</td>
          <td>{totalIncome}</td>
          <td>{totalExpenses}</td>
          <td>{totalNet}</td>
          <td>{totalAgentNet}</td>
          <td className={`approved-column ${isApproved ? 'approved' : ''}`}>
            {isApproved ? (
              <FaCheck />
            ) : (
              <div className="">

              </div>
            )}
          </td>
        </tr>
      );
    });
  };

  // Loading and error handling
  if (loading) {
    return <div className="processor-summary-report-viewer"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="processor-summary-report-viewer"><p>{error}</p></div>;
  }

  return (
    <div className="report-viewer processor-summary-report-viewer">
      <header className="header">
        <h1 className="header-title">Processor Summary Report - {monthYear}</h1>

        <div className="header-actions">
          <button onClick={exportToCSV} className="btn-export">Export to CSV</button>
        </div>
      </header>

      <div className="status-save-container">
        {/* Status text */}
        <div className="header-details">
          {dbReport?.approved ? (
            <p className="status status-approved">Status: Approved</p>
          ) : (
            <p className="status status-needs-approval">Status: Needs Approval</p>
          )}
        </div>

        {/* Save button */}
        {hasChanges && (
          <button onClick={handleSaveChanges} className="btn-save">Save Changes</button>
        )}
      </div>
      <div className="bulk-action-container">
        <button onClick={handleBulkApprove} disabled={!selectedRows.length} className="bulk-action-btn">
          Bulk Approve
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" onChange={handleBulkSelect} checked={selectedRows.length === summaryReport.length} /></th>
              <th>Processor</th>
              <th>Total Transactions</th>
              <th>Total Sales Amount</th>
              <th>Total Income</th>
              <th>Total Expenses</th>
              <th>Total Net</th>
              <th>Total Agent Net</th>
              <th>Approved</th>
            </tr>
          </thead>
          <tbody>
            {renderTableRows()}
          </tbody>
        </table>
      </div>
    </div>
  );

};

export default ProcessorSummaryReportViewer;
