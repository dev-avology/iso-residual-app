import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { generateAgentReport, createAgentReport, getAgentReportByMonth, updateReport } from '../../../api/reports.api.js'; // Import the correct API function
import { getAgent } from '../../../api/agents.api.js'; // Import the correct API function
import processorTypeMap from '../../../lib/typeMap.lib.js'; // Import the processor type map
import {  FaCheck,  } from 'react-icons/fa';
import './agent-report-viewer.component.css';

const AgentReportViewer = ({ authToken, organizationID }) => {
  const { agentID } = useParams();
  const location = useLocation();
  const [generatedReportData, setGeneratedReportData] = useState([]);
  const [generatedReport, setGeneratedReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agent, setAgent] = useState(null);
  const [approvedRows, setApprovedRows] = useState([]); // Store approved rows from DB
  const [dbReport, setDbReport] = useState([]); // Store saved report from DB
  const [hasChanges, setHasChanges] = useState(false); // Track if any changes were made
  const [isEditingRow, setIsEditingRow] = useState(null);
  const [pageNumbers, setPageNumbers] = useState({}); // Track current page for each processor report
  const [currentPage, setCurrentPage] = useState(1); // Track current page for pagination
  const [selectedRows, setSelectedRows] = useState([]); // Tracks selected rows for bulk actions
  const [editableReportData, setEditableReportData] = useState(null);
  const [selectedRowsByProcessor, setSelectedRowsByProcessor] = useState({});


  // Variables for pagination
  const rowsPerPage = 10; // Rows per page
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const totalPages = Math.ceil(editableReportData?.length / rowsPerPage);

  // Slice data to show only current page rows
  const currentRows = editableReportData?.slice(indexOfFirstRow, indexOfLastRow);

  const paginate = (processorIndex, pageNumber) => {
    setPageNumbers((prev) => ({
      ...prev,
      [processorIndex]: pageNumber,
    }));
  };




  const searchParams = new URLSearchParams(location.search);
  const monthYear = searchParams.get('month');

  useEffect(() => {
    if (authToken && organizationID && agentID && monthYear) {
      fetchAgentDetailsAndReport();
      fetchSavedAgentReport(); // Fetch saved approval data
    } else {
      setError('Missing required data to fetch reports');
    }
  }, [authToken, organizationID, agentID, monthYear]);

  const processorHeaders = {
    type1: ['Merchant Id', 'Merchant Name', 'Transaction', 'Sales Amount', 'Income', 'Expenses', 'Net', 'BPS', '%', 'Agent Net', 'Branch ID'],
    type2: ['Merchant Id', 'Merchant Name', 'Payout Amount', 'Volume', 'Sales', 'Refunds', 'Reject Amount', 'Bank Split', 'Bank Payout', 'Branch ID'],
    type3: ['Merchant Id', 'Merchant DBA', 'Payout Amount', 'Volume', 'Sales', 'Refunds', 'Reject Amount', 'Bank Split', 'Bank Payout', 'Branch ID'],
    type4: ['Merchant Id', 'Merchant Name', 'Income', 'Expenses', 'Net', '%', 'Agent Net', 'Branch ID']
  };

  const exportToCSV = () => {
    if (!generatedReportData.length) return; // If there's no data, don't do anything

    // Prepare CSV content
    const csvRows = [];

    // Iterate over each processor report
    generatedReportData.forEach((processorReport) => {
      let totalVolume = 0;
      let totalSales = 0;
      let totalPayout = 0;
      let totalBankPayout = 0;
      let totalAgentNet = 0;

      const processorType = getProcessorType(processorReport.processor);

      // Add processor name as a separate row
      csvRows.push([processorReport.processor]);

      // Add headers row
      csvRows.push(processorHeaders[processorType].join(','));

      // Loop through each merchant and append the data rows
      processorReport.reportData.forEach((item) => {
        switch (processorType) {
          case 'type1':
            totalSales += parseFloat(item['Sales Amount']) || 0;
            totalAgentNet += parseFloat(item['Agent Net']) || 0;
            break;
          case 'type2':
          case 'type3':
            totalVolume += parseFloat(item['Volume']) || 0;
            totalSales += parseFloat(item['Sales']) || 0;
            totalPayout += parseFloat(item['Payout Amount']) || 0;
            totalBankPayout += parseFloat(item['Bank Payout']) || 0;
            break;
          case 'type4':
            totalSales += parseFloat(item['Income']) || 0;
            totalAgentNet += parseFloat(item['Agent Net']) || 0;
            break;
          default:
            break;
        }

        const csvRow = processorHeaders[processorType].map((header) => item[header] || '');
        csvRows.push(csvRow.join(','));
      });

      // Add totals row for the current processor
      csvRows.push([
        'Totals',
        '', // Merchant Id
        '', // Merchant Name
        totalPayout ? totalPayout.toFixed(2) : '', // Payout Amount
        totalVolume ? totalVolume.toFixed(2) : '', // Volume
        totalSales.toFixed(2), // Sales/Income
        '', // Refunds/Expenses
        '', // Reject Amount
        '', // Bank Split
        totalBankPayout ? totalBankPayout.toFixed(2) : '', // Bank Payout
        totalAgentNet ? totalAgentNet.toFixed(2) : '', // Agent Net
        '', // Branch ID
      ].join(','));

      // Add two empty rows between different processors
      csvRows.push('');
      csvRows.push('');
    });

    // Convert the rows into a CSV string
    const csvString = csvRows.join('\n');
    // Create a blob from the string and trigger a download
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${agent.lName}.AgentReport.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };


  const fetchAgentDetailsAndReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const agentResponse = await getAgent(organizationID, agentID, authToken);
      const agentData = agentResponse.data?.agent || null;
      setAgent(agentData);

      const reportResponse = await generateAgentReport(organizationID, agentID, monthYear, authToken);
      const agentReportData = reportResponse.data?.reportData || [];

      if (agentReportData.length === 0) {
        setError('No report data found for this month');
      } else {
        setGeneratedReportData(agentReportData);
        setGeneratedReport(reportResponse.data);
      }
    } catch (err) {
      console.error('Error fetching agent report:', err);
      setError('Failed to fetch agent report');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedAgentReport = async () => {
    try {
      const savedReportResponse = await getAgentReportByMonth(organizationID, agentID, monthYear, authToken);
      const savedReportData = savedReportResponse?.data?.reportData || [];

      setApprovedRows(Array.isArray(savedReportData) ? savedReportData : []); // Ensure it's always an array
      setDbReport(savedReportResponse?.data); // Store the saved report data
    } catch (error) {
      console.error('Error fetching saved agent report:', error);
      setApprovedRows([]); // Fallback to empty array on error
    }
  };



  const handleApproveRow = (merchantId) => {
    const updatedApprovedRows = [...approvedRows];
    const index = updatedApprovedRows.findIndex(row => row['Merchant Id'] === merchantId);

    if (index === -1) {
      updatedApprovedRows.push({ 'Merchant Id': merchantId, approved: true });
    } else {
      updatedApprovedRows[index].approved = true;
    }

    setIsEditingRow(index);
    setHasChanges(true); // Flag that changes are being made
    setApprovedRows(updatedApprovedRows); // Update the approvedRows state
  };


  const toggleRowSelection = (processorIndex, rowIndex) => {
    setSelectedRowsByProcessor((prevSelectedRows) => {
      const selectedRows = prevSelectedRows[processorIndex] || [];
      return {
        ...prevSelectedRows,
        [processorIndex]: selectedRows.includes(rowIndex)
          ? selectedRows.filter((index) => index !== rowIndex)
          : [...selectedRows, rowIndex],
      };
    });
  };


  // Select or deselect all rows on the current page
  const toggleSelectAll = () => {
    const pageIndices = currentRows.map((_, idx) => idx + (currentPage - 1) * rowsPerPage);
    const allSelected = pageIndices.every((idx) => selectedRows.includes(idx));
    setSelectedRows(allSelected ? selectedRows.filter((idx) => !pageIndices.includes(idx)) : [...selectedRows, ...pageIndices]);
  };

  const handleBulkDelete = (processorIndex) => {
    const updatedReportData = [...generatedReportData];
    const selectedRows = selectedRowsByProcessor[processorIndex] || [];

    updatedReportData[processorIndex].reportData = updatedReportData[processorIndex].reportData.filter(
      (_, rowIndex) => !selectedRows.includes(rowIndex)
    );

    setGeneratedReportData(updatedReportData);
    setSelectedRowsByProcessor((prevSelectedRows) => ({
      ...prevSelectedRows,
      [processorIndex]: [], // Clear selected rows after bulk action
    }));
    setHasChanges(true);
  };



  const handleBulkApprove = (processorIndex) => {
    const updatedReportData = [...generatedReportData];
    const selectedRows = selectedRowsByProcessor[processorIndex] || [];

    selectedRows.forEach((rowIndex) => {
      updatedReportData[processorIndex].reportData[rowIndex].approved = true;
    });

    setGeneratedReportData(updatedReportData);
    setSelectedRowsByProcessor((prevSelectedRows) => ({
      ...prevSelectedRows,
      [processorIndex]: [], // Clear selected rows after bulk action
    }));
    setHasChanges(true);
  };






  const getProcessorType = (processor) => {
    return processorTypeMap[processor] || 'type1'; // Default to 'type1' if not found
  };

  const renderTableHeaders = (type) => {
    return (
      <thead>
        <tr>
          {processorHeaders[type].map((header, index) => (
            <th key={index}>{header}</th>
          ))}
          <th>Approved</th>
        </tr>
      </thead>
    );
  };

  const calculateTotals = (type, reportData) => {
    let totals = {
      volume: 0,
      sales: 0,
      payoutAmount: 0,
      income: 0,
      expenses: 0,
      net: 0,
      bankPayout: 0,
      agentNet: 0,
    };

    reportData.forEach((item) => {
      switch (type) {
        case 'type1':
          totals.sales += parseFloat(item['Sales Amount']) || 0;
          totals.income += parseFloat(item['Income']) || 0;
          totals.expenses += parseFloat(item['Expenses']) || 0;
          totals.net += parseFloat(item['Net']) || 0;
          totals.agentNet += parseFloat(item['Agent Net']) || 0;
          break;
        case 'type2':
        case 'type3':
          totals.payoutAmount += parseFloat(item['Payout Amount']) || 0;
          totals.volume += parseFloat(item['Volume']) || 0;
          totals.sales += parseFloat(item['Sales']) || 0;
          totals.bankPayout += parseFloat(item['Bank Payout']) || 0;
          break;
        case 'type4':
          totals.income += parseFloat(item['Income']) || 0;
          totals.expenses += parseFloat(item['Expenses']) || 0;
          totals.net += parseFloat(item['Net']) || 0;
          totals.agentNet += parseFloat(item['Agent Net']) || 0;
          break;
        default:
          break;
      }
    });

    return totals;
  };

  const renderTableRows = (type, reportData, processorIndex) => {
    const currentPage = pageNumbers[processorIndex] || 1;
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = reportData.slice(indexOfFirstRow, indexOfLastRow);
  
    return currentRows.map((item, index) => {
      const globalIndex = indexOfFirstRow + index;
      const isSelected = selectedRowsByProcessor[processorIndex]?.includes(globalIndex) || false;
      const isApproved = Array.isArray(approvedRows) && approvedRows.some(row => row['Merchant Id'] === item['Merchant Id'] && row.approved);
  
      let row = [];
  
      switch (type) {
        case 'type1':
          row = [item['Merchant Id'], item['Merchant Name'], item['Transaction'], item['Sales Amount'], item['Income'], item['Expenses'], item['Net'], item['BPS'], item['%'], item['Agent Net'], item['Branch ID']];
          break;
        case 'type2':
        case 'type3':
          row = [item['Merchant Id'], item['Merchant Name'] || item['Merchant DBA'], item['Payout Amount'], item['Volume'], item['Sales'], item['Refunds'], item['Reject Amount'], item['Bank Split'], item['Bank Payout'], item['Branch ID']];
          break;
        case 'type4':
          row = [item['Merchant Id'], item['Merchant Name'], item['Income'], item['Expenses'], item['Net'], item['%'], item['Agent Net'], item['Branch ID']];
          break;
        default:
          break;
      }
  
      return (
        <tr key={globalIndex} className={`report-row ${isApproved ? 'approved' : ''}`}>
          <td>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleRowSelection(processorIndex, globalIndex)}
            />
          </td>
          {row.map((data, i) => (
            <td key={i}>{data}</td>
          ))}
          <td className={`approved-column ${isApproved ? 'approved' : ''}`}>
            {isApproved ? (
              <FaCheck />
            ) : (
              <div className="action-buttons">
                <button onClick={() => handleApproveRow(item['Merchant Id'])} className="btn-approve">
                  <FaCheck />
                </button>
              </div>
            )}
          </td>
        </tr>
      );
    });
  };
  

  const handleSaveChanges = async () => {
    try {
      // Check if all rows are approved
      const allRowsApproved = generatedReportData.every((processorReport) =>
        processorReport.reportData.every((item) =>
          approvedRows.some(approvedRow => approvedRow['Merchant Id'] === item['Merchant Id'] && approvedRow.approved)
        )
      );

      // Update the existing report if it exists
      if (dbReport && dbReport.reportID) {
        const updatedReport = {
          ...dbReport,
          reportData: approvedRows,
          approved: allRowsApproved
        };
        await updateReport(dbReport.reportID, updatedReport, authToken);
        alert('Report updated successfully!');
      } else {
        // Create a new report if no report was found
        const newReport = {
          organizationID,
          agentID,
          month: monthYear,
          reportData: approvedRows,
          approved: allRowsApproved
        };
        await createAgentReport(organizationID, agentID, monthYear, newReport, authToken);
        alert('Report created successfully!');
      }

      // Refetch reports to refresh data
      fetchAgentDetailsAndReport();
    } catch (error) {
      console.error('Error saving approvals:', error);
      alert('Error saving approvals.');
    }
  };

  const renderTotalsRow = (type, totals) => {
    switch (type) {
      case 'type1':
        return (
          <tr className="totals-row">
            <td colSpan="3"><strong>Totals</strong></td>
            <td><strong>{totals.sales.toFixed(2)}</strong></td>
            <td><strong>{totals.income.toFixed(2)}</strong></td>
            <td><strong>{totals.expenses.toFixed(2)}</strong></td>
            <td><strong>{totals.net.toFixed(2)}</strong></td>
            <td colSpan="1"></td>
            <td><strong>{totals.agentNet.toFixed(2)}</strong></td>
            <td colSpan="1"></td>
          </tr>
        );
      case 'type2':
      case 'type3':
        return (
          <tr className="totals-row">
            <td colSpan="2"><strong>Totals</strong></td>
            <td><strong>{totals.payoutAmount.toFixed(2)}</strong></td>
            <td><strong>{totals.volume.toFixed(2)}</strong></td>
            <td><strong>{totals.sales.toFixed(2)}</strong></td>
            <td colSpan="3"></td>
            <td><strong>{totals.bankPayout.toFixed(2)}</strong></td>
            <td colSpan="1"></td>
          </tr>
        );
      case 'type4':
        return (
          <tr className="totals-row">
            <td colSpan="2"><strong>Totals</strong></td>
            <td><strong>{totals.income.toFixed(2)}</strong></td>
            <td><strong>{totals.expenses.toFixed(2)}</strong></td>
            <td><strong>{totals.net.toFixed(2)}</strong></td>
            <td colSpan="1"></td>
            <td><strong>{totals.agentNet.toFixed(2)}</strong></td>
            <td colSpan="1"></td>
          </tr>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="agent-report-viewer"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="agent-report-viewer"><p>{error}</p></div>;
  }

  return (
    <div className="report-viewer">
      <header className='header'>
        <h1 className="header-title">
          Agent Report for {agent ? (agent.fName ? `${agent.fName} ${agent.lName}` : agent.company) : 'Agent'}
        </h1>
        <button onClick={exportToCSV} className="btn-export">Export to CSV</button>
      </header>
      <p><strong>Month:</strong> {generatedReport.month}</p>

      <div className="status-save-container">
        {/* Status text */}
        {generatedReport.approved ? (
          <p className="status-text approved-status">Status: Approved</p>
        ) : (
          <p className="status-text needs-approval">Status: Needs Approval</p>
        )}

        {/* Save button */}
        {hasChanges && (
          <button onClick={handleSaveChanges} className="btn-save">Save Changes</button>
        )}
      </div>


      {generatedReportData.length > 0 ? (
        generatedReportData.map((processorReport, processorIndex) => {
          const processorType = getProcessorType(processorReport.processor);
          const totals = calculateTotals(processorType, processorReport.reportData);

          return (
            <div key={processorIndex} className="processor-report">
              <h3>Processor: {processorReport.processor}</h3>

              {/* Bulk Actions Dropdown */}
              <div className="bulk-action-container">
                <button onClick={() => handleBulkApprove(processorIndex)} disabled={!selectedRowsByProcessor[processorIndex]?.length} className="bulk-action-btn">Bulk Approve</button>
                <button onClick={() => handleBulkDelete(processorIndex)} disabled={!selectedRowsByProcessor[processorIndex]?.length} className="bulk-action-btn">Bulk Delete</button>
              </div>
              <div className="table-container">
                <table>
                  {renderTableHeaders(processorType)}
                  <tbody>
                    {renderTableRows(processorType, processorReport.reportData)}
                    {renderTotalsRow(processorType, totals)}
                  </tbody>
                </table>

                {generatedReportData.map((processorReport, processorIndex) => {
                  const processorType = getProcessorType(processorReport.processor);
                  const totals = calculateTotals(processorType, processorReport.reportData);
                  const currentPage = pageNumbers[processorIndex] || 1;
                  const totalPages = Math.ceil(processorReport.reportData.length / rowsPerPage);

                  return (
                    <div key={processorIndex} className="processor-report">
                      <h3>Processor: {processorReport.processor}</h3>
                      <div className="table-container">
                        <table>
                          {renderTableHeaders(processorType)}
                          <tbody>
                            {renderTableRows(processorType, processorReport.reportData, processorIndex)}
                            {renderTotalsRow(processorType, totals)}
                          </tbody>
                        </table>

                        {/* Pagination controls */}
                        <div className="pagination">
                          <button
                            onClick={() => paginate(processorIndex, currentPage - 1)}
                            disabled={currentPage === 1}
                            className="pagination-arrow"
                          >
                            &laquo;
                          </button>

                          {currentPage > 1 && (
                            <button onClick={() => paginate(processorIndex, currentPage - 1)}>
                              {currentPage - 1}
                            </button>
                          )}

                          <button className="active">{currentPage}</button>

                          {currentPage < totalPages && (
                            <button onClick={() => paginate(processorIndex, currentPage + 1)}>
                              {currentPage + 1}
                            </button>
                          )}

                          <button
                            onClick={() => paginate(processorIndex, currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="pagination-arrow"
                          >
                            &raquo;
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          );
        })
      ) : (
        <p>No report available for this month.</p>
      )}
    </div>
  );

};

export default AgentReportViewer;
