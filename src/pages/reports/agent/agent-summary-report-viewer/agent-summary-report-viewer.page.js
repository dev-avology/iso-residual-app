import React, { useState, useEffect } from "react";
import { Box, Button } from "@mui/material";
import Header from "../../../../components/general/header/header.component.js";
import ReusableTable from "../../../../components/general/table/table.component.js";
import { FaCheck } from "react-icons/fa";
import { getAgentSummaryReport, generateAgentSummaryReport, createAgentSummaryReport, updateReport } from '../../../../api/reports.api.js';
import { useLocation } from 'react-router-dom';

const AgentSummaryReportViewerPage = ({ authToken, organizationID }) => {
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
          console.log('Initializing data...');
          await generateSummaryReport(); // Generate the report first
          await fetchSavedAgentSummaryReport(); // Fetch saved approvals
        } catch (err) {
          console.error('Initialization failed:', err);
          setError('Initialization failed.');
        }
      };
      initializeData();
    } else {
      setError('Missing required data to fetch reports');
    }
  }, [authToken, organizationID, monthYear]);

  // Generate Agent Summary Report
  const generateSummaryReport = async () => {
    try {
      setLoading(true);
      console.log('Generating agent summary report...');
      const response = await generateAgentSummaryReport(organizationID, monthYear, authToken);
      const agentReports = response.data.reportData;

      console.log('Generated agent reports:', agentReports);

      if (!Array.isArray(agentReports)) {
        throw new Error('Invalid response structure: reportData is not an array');
      }

      if (agentReports) {
        // Separate TOTALS row from other data
        const totalsRow = agentReports.find(item => item.agentName === "TOTALS");
        const otherRows = agentReports.filter(item => item.agentName !== "TOTALS");
  
        // Sort the data alphabetically by agent name (excluding TOTALS)
        const sortedData = [...otherRows].sort((a, b) => 
          a.agentName.localeCompare(b.agentName)
        );
  
        // Add TOTALS back at the end
        const finalData = [...sortedData];
        if (totalsRow) {
          finalData.push(totalsRow);
        }
  
        setSummaryReport(finalData);
      }
      
      // setSummaryReport(agentReports);
      // Set the initial report data and keep it in memory for merging later

    } catch (err) {
      console.error('Error generating agent summary report:', err);
      setError('Failed to generate agent summary report');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedAgentSummaryReport = async () => {
    try {
      console.log('Fetching saved agent summary report...');
      const savedReportResponse = await getAgentSummaryReport(organizationID, monthYear, authToken);
      if (savedReportResponse && savedReportResponse.data) {
        const savedReportData = savedReportResponse.data.reportData || [];
        console.log('Fetched saved report from DB:', savedReportData);
        setApprovedRows(savedReportData);
        mergeApprovedRows(savedReportData); // Merge saved data into the generated report
        setDbReport(savedReportResponse.data);
      }
    } catch (error) {
      console.error('Error fetching saved agent summary report:', error);
    }
  };

  const handleBulkSelect = () => {
    const allSelected = selectedRows.length === summaryReport.length;
    setSelectedRows(allSelected ? [] : summaryReport.map(item => item.agentID));
  };

  const handleBulkApprove = () => {
    const updatedApprovedRows = [...approvedRows];
    selectedRows.forEach((agentID) => {
      if (!updatedApprovedRows.some(row => row.agentID === agentID)) {
        updatedApprovedRows.push({ agentID, approved: true });
      }
    });

    setApprovedRows(updatedApprovedRows);
    setSummaryReport((prevReport) =>
      prevReport.map((item) =>
        selectedRows.includes(item.agentID) ? { ...item, approved: true } : item
      )
    );
    setSelectedRows([]);
    setHasChanges(true);
  };

  // Use useEffect to merge once both summaryReport and approvedRows are available
  useEffect(() => {
    if (summaryReport.length > 0 && approvedRows.length > 0) {
      mergeApprovedRows(approvedRows);
    }
  }, [summaryReport, approvedRows]);

  const mergeApprovedRows = (approvedRows) => {
    console.log('Merging approved rows:', approvedRows);
    console.log('Current summary report before merging:', summaryReport);

    if (!summaryReport.length || !approvedRows.length) return;

    // Directly assign the approved status to matching agentIDs
    const updatedSummaryReport = summaryReport.map((item) => {
      const approvedRow = approvedRows.find(row => row.agentID === item.agentID);

      if (approvedRow) {
        console.log(`Assigning approved status for agentID: ${item.agentID}`);
        item.approved = approvedRow.approved; // Directly assign the approved status
      }

      return item;
    });

    console.log('Updated summary report after merging:', updatedSummaryReport);
    setSummaryReport(updatedSummaryReport);
  };


  // Handle row approval
  const handleApproveRow = (agentID) => {
    console.log('Handling row approval for agentID:', agentID);
    const updatedApprovedRows = [...approvedRows];
    const index = updatedApprovedRows.findIndex(row => row.agentID === agentID);

    if (index === -1) {
      updatedApprovedRows.push({ agentID, approved: true });
    } else {
      updatedApprovedRows[index].approved = true;
    }

    console.log('Updated approved rows:', updatedApprovedRows);
    setApprovedRows(updatedApprovedRows);

    // Update the summary report with the new approval status
    const updatedSummaryReport = summaryReport.map((item) =>
      item.agentID === agentID ? { ...item, approved: true } : item
    );

    setHasChanges(true); // Flag that changes are being made
    setSummaryReport(updatedSummaryReport);
  };

  // Save changes
  const handleSaveChanges = async () => {
    try {
        console.log('Saving changes...');

        // ✅ Check if all rows are approved
        const allRowsApproved = summaryReport.every(item =>
            approvedRows.some(approvedRow => 
                approvedRow.agentID === item.agentID && approvedRow.approved
            )
        );

        // ✅ Prepare the updated report structure with approval status
        const updatedReport = {
            monthYear,
            reportData: approvedRows,  // Save the report data directly
            approved: allRowsApproved,  // ✅ Mark the entire report as approved if all rows are approved
        };

        console.log('Final report to save:', updatedReport);

        // ✅ Save or update the report in the database
        if (dbReport) {
            await updateReport(dbReport.reportID, updatedReport, authToken);
            console.log("Updated existing report.");
        } else {
            await createAgentSummaryReport(organizationID, updatedReport, authToken);
            console.log("Created a new summary report.");
        }

        alert('Changes saved successfully!');
        setHasChanges(false);  // ✅ Reset the changes flag after a successful save
    } catch (error) {
        console.error('Error saving agent summary report:', error);
        alert('Error saving agent summary report. Please check the console for details.');
    }
};


  // Export to CSV function
  const exportToCSV = () => {
    const csvHeaders = [
      "Agent ID", "Agent Name", "Transactions", "Sales Amount", "Income", "Expenses", "Net", "Agent Net"
    ];

    // Separate TOTALS row from other data
    const totalsRow = summaryReport.find(item => item.agentName === "TOTALS");
    const otherRows = summaryReport.filter(item => item.agentName !== "TOTALS");

    // Sort the data alphabetically by agent name (excluding TOTALS)
    const sortedData = [...otherRows].sort((a, b) => 
      a.agentName.localeCompare(b.agentName)
    );

    // Add TOTALS back at the end
    const finalData = [...sortedData];
    if (totalsRow) {
      finalData.push(totalsRow);
    }

    const csvRows = finalData.map(item => [
      item.agentID,
      item.agentName,
      item.totalTransactions,
      item.totalSalesAmount,
      item.totalIncome,
      item.totalExpenses,
      item.totalNet,
      // Format agent net to 2 decimal places
      Number(item.totalAgentNet).toFixed(2)
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `Agent_Summary_Report_${monthYear}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  // useEffect(() => {
 
  // }, [summaryReport]);

  if (loading) {
    return <div className="agent-summary-report-viewer"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="agent-summary-report-viewer"><p>{error}</p></div>;
  }
  return (
    <Box sx={{ p: 4 }}>
        {/* Reusable Header */}
        <Header
            title="Agent Summary Report"
            subtitle={`Organization ID: ${organizationID} | Month: ${monthYear}`}
        />

        {/* Reusable Table */}
        <ReusableTable
            data={summaryReport}
            setData={setSummaryReport}
            idField="agentID"
            columns={[
                { field: 'agentName', label: 'Agent Name' },
                { field: 'totalTransactions', label: 'Transactions' },
                { field: 'totalSalesAmount', label: 'Sales Amount' },
                { field: 'totalIncome', label: 'Income' },
                { field: 'totalExpenses', label: 'Expenses' },
                { field: 'totalNet', label: 'Net' },
                { field: 'totalAgentNet', label: 'Agent Net' },
                {
                    field: 'approved',
                    label: 'Approved',
                    render: (approved) =>
                        approved ? (
                            <FaCheck color="green" title="Approved" />
                        ) : null,
                },
            ]}
            filtersConfig={[
                { label: "Needs Audit", field: "needsAudit", type: "checkbox" },
                { label: "Approved", field: "approved", type: "checkbox" },
            ]}
            actions={[
                {
                    name: "Bulk Approve",
                    onClick: handleBulkApprove
                },
                {
                    name: "Export CSV",
                    onClick: exportToCSV
                }
            ]}
            enableSearch={true}
            selected={selectedRows}
            setSelected={setSelectedRows}
            enableTotals={true}
            approvalAction={true}
            type="report"
        />

        {/* Save Changes Button */}
        {hasChanges && (
            <Button
                variant="contained"
                color="primary"
                onClick={handleSaveChanges}
                sx={{ mt: 3 }}
            >
                Save Changes
            </Button>
        )}
    </Box>
);
};

export default AgentSummaryReportViewerPage;
