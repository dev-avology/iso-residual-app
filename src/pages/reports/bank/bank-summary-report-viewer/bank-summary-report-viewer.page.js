import React, { useState, useEffect } from "react";
import { Tabs, Tab, Box, Button, CircularProgress } from "@mui/material";
import Decimal from "decimal.js";
import BankSummaryReportViewer from "../../../../components/reports/bank/bank-summary-report-viewer/bank-summary-report-viewer.component.js";
import {
  generateBankSummaryReport,
  createBankSummaryReport,
  getBankSummaryReport,
  updateReport,
  updateMerchantData
} from "../../../../api/reports.api.js";
import { getAgent } from "../../../../api/agents.api.js";
import processorTypeMap from "../../../../lib/typeMap.lib.js";
import Header from "../../../../components/general/header/header.component.js"; // Import the reusable Header component
import { mergeReports } from "../../../../utils/merge.util.js";
import "./bank-summary-report-viewer.page.css";
import { useLocation, useNavigate } from "react-router-dom";
import { getAgents } from "../../../../api/agents.api.js";
import axios from "axios";

const BankSummaryReportViewerPage = ({ organizationID, authToken }) => {
  const [generatedReportData, setGeneratedReportData] = useState([]);
  const [dbReport, setDbReport] = useState(null);
  const [activeProcessor, setActiveProcessor] = useState(0); // Use index for MUI Tabs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mergedData, setMergedData] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [updatedMerchant, setUpdatedMerchant] = useState([]);


  const searchParams = new URLSearchParams(location.search);
  const monthYear = searchParams.get("month");

  useEffect(() => {
    if (authToken && organizationID && monthYear) {
      fetchReports();
    } else {
      setError("Missing required data to fetch reports");
    }
  }, [authToken, organizationID, monthYear]);

  useEffect(() => {
    console.log("Fetching reports...");
    console.log("generatedReportData----:", generatedReportData);
    console.log("dbReport22:", dbReport);
    console.log("mergedData:", mergedData);
  }, [mergedData, generatedReportData, dbReport]);
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch agent details, generated reports, and saved reports simultaneously
      const [generatedResponse, savedResponse] = await Promise.all([
        generateBankSummaryReport(organizationID, monthYear, authToken),
        getBankSummaryReport(organizationID, monthYear, authToken),
      ]);
      console.log("generatedResponse22:", generatedResponse);
      console.log("savedResponse:", savedResponse);

      const generatedReportData = generatedResponse.data?.reportData || [];
      setGeneratedReportData(generatedReportData);
      setDbReport(savedResponse?.data || null);

      // Merge the reports
      if (generatedReportData.length) {
        // console.log("arg1:", generatedReportData);
        // console.log("arg2:", savedResponse?.data?.reportData || null);
        const merged = mergeReports(
          generatedReportData,
          savedResponse?.data?.reportData || null
        );
        setMergedData(merged);
        console.log("Merged data:", merged);
      } else {
        // console.warn("Generated report is empty. No data to merge.");
        setMergedData([]);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

// Fetch agents
useEffect(() => {
  const fetchAgents = async () => {
    try {
      // Check if token exists and is valid
      if (!authToken) {
        console.error('No auth token available');
        navigate('/login');
        return;
      }
      // Use getAgents instead of getAgent
      const response = await getAgents(organizationID, authToken);
      console.log('Agents API Response:', response);
      
      if (response && response.agents) {
        setAgents(response.agents);
        // console.log('Agents Data:', response.agents);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
      console.error('Error details:', {
        status: err?.response?.status,
        data: err?.response?.data,
        headers: err?.response?.headers
      });
      
      // Handle token expiration
      if (err?.response?.data?.error === "Invalid or expired token") {
        console.error('Token expired, redirecting to login');
        // Clear any stored tokens
        localStorage.removeItem('token');
        localStorage.removeItem('organizationId');
        // Redirect to login
        navigate('/login');
      } else {
        setError('Failed to fetch agents');
      }
    }
  };

  if (organizationID && authToken) {
    fetchAgents();
  }
}, [organizationID, authToken, navigate]);  

  const handleSaveChanges = async () => {
    try {
        // Transform mergedData to match the structure of the generated report
        const minimalReportData = mergedData.map(processorReport => ({
            processor: processorReport.processor,
            reportData: processorReport.reportData.map(row => {
                console.log('Processing row:', row); // Log each row being processed
                return {
                    "Merchant Id": row["Merchant Id"],
                    approved: row.approved,
                    splits: row.splits || [] // Include splits data
                };
            }),
        }));

        console.log('Transformed report data:', minimalReportData); // Log transformed data

        // Check if all rows are approved
        const allRowsApproved = mergedData.every(processorReport =>
            processorReport.reportData.every(row => row.approved)
        );

        // Create a new report object without trying to destructure _id
        const updatedReport = {
            organizationID,
            monthYear,
            reportData: minimalReportData,
            approved: allRowsApproved
        };
        
        // Save the report (update or create)
        if (dbReport && dbReport.reportID) {
            console.log('Updating existing report22222:', updatedReport);
            // return false;
            await updateReport(dbReport.reportID, updatedReport, authToken);
        } else {
            console.log('Creating new report:', updatedReport);
            await createBankSummaryReport(organizationID, monthYear, updatedReport, authToken);
        }

        if(updatedMerchant){
          
          const merchantId = updatedMerchant.merchant["Merchant Id"];          
          // Create the update payload
          const updatePayload = {
              monthYear,
              organizationID,
              processor: updatedMerchant.processor,
              merchantData: updatedMerchant.merchant,
            };
          await updateMerchantData(merchantId,updatePayload,authToken);
        }

        // Refetch reports and reset change tracking
        await fetchReports();
        setHasChanges(false);
    } catch (error) {
        console.error("Error saving report:", error);
        alert("Error saving report: " + error.message);
    }
};

  const handleTabChange = (event, newValue) => {
    setActiveProcessor(newValue);
  };
  // console.log('activeProcessor',activeProcessor);

  const processorHeaders = {
    type1: [
      "Merchant Id",
      "Merchant Name",
      "Transaction",
      "Sales Amount",
      "Net",
      "BPS",
      "%",
      "Agent Net",
      "Branch ID",
    ],
    type2: [
      "Merchant Id",
      "Merchant Name",
      "Payout Amount",
      "Volume",
      "Sales",
      "Refunds",
      "Reject Amount",
      "Bank Split",
      "Bank Payout",
      "Branch ID",
    ],
    type3: [
      "Merchant Id",
      "Merchant DBA",
      "Payout Amount",
      "Volume",
      "Sales",
      "Refunds",
      "Reject Amount",
      "Bank Split",
      "Bank Payout",
      "Branch ID",
    ],
    type4: [
      "Merchant Id",
      "Merchant Name",
      "Income",
      "Expenses",
      "Net",
      "%",
      "Bank Payout",
      "Branch ID",
    ],
  };

  const getProcessorType = (processor) =>
    processorTypeMap[processor] || "type1";

  const exportToCSV = () => {
    // console.log(sortedReportData);
    // return false;
    if (!sortedReportData.length) return;

    const csvRows = [];

    // List of fields to calculate totals for
    const fieldsToTotal = [
      "Transaction",
      "Sales Amount",
      "Income",
      "Expenses",
      "Net",
      "Agent Net",
      "Volume",
      "Sales",
      "Refunds",
      "Rejected Amount",
      "Bank Payout",
      "Payout Amount",
    ];

    // Helper function to escape commas and double quotes
    const escapeCSVValue = (value) => {
      if (value == null) return ""; // Handle null/undefined
      const stringValue = String(value).replace(/"/g, '""'); // Escape double quotes
      return stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
        ? `"${stringValue}"` // Wrap in quotes if necessary
        : stringValue;
    };

    sortedReportData.forEach((processorReport) => {
      processorReport.reportData = processorReport.reportData
        .map((item) => {
          // Format Payout Amount
          if (item["Payout Amount"] != null && !isNaN(item["Payout Amount"])) {
            item["Payout Amount"] = parseFloat(item["Payout Amount"]).toFixed(
              2
            );
          }

          // Format Bank Payout
          if (item["Bank Payout"] != null && !isNaN(item["Bank Payout"])) {
            item["Bank Payout"] = parseFloat(item["Bank Payout"]).toFixed(2);
          }

          return item;
        })
        .sort((a, b) => {
          const field =
            processorReport.processor === "TRX"
              ? "Merchant DBA"
              : "Merchant Name";
          const nameA = (a[field] || "").toUpperCase();
          const nameB = (b[field] || "").toUpperCase();
          return nameA.localeCompare(nameB);
        });

      // Initialize totals for this processor using Decimal.js
      const totals = fieldsToTotal.reduce((acc, field) => {
        acc[field] = new Decimal(0); // Start with Decimal(0) for precision
        return acc;
      }, {});

      const processorType = getProcessorType(processorReport.processor);
      csvRows.push([escapeCSVValue(processorReport.processor)]); // Add processor name as a header
      csvRows.push(
        processorHeaders[processorType].map(escapeCSVValue).join(",")
      ); // Add column headers

      processorReport.reportData.forEach((item) => {
        // Parse and accumulate totals dynamically using Decimal.js
        fieldsToTotal.forEach((field) => {
          const value = item[field];
          if (value != null && !isNaN(parseFloat(value))) {
            totals[field] = totals[field].plus(new Decimal(value)); // Use Decimal.plus for accumulation
          }
        });

        // Generate CSV row with properly escaped values
        const csvRow = processorHeaders[processorType].map((header) =>
          escapeCSVValue(item[header])
        );
        csvRows.push(csvRow.join(","));
      });

      // Add totals row dynamically
      const totalsRow = processorHeaders[processorType].map((header) => {
        if (fieldsToTotal.includes(header)) {
          return escapeCSVValue(
            totals[header].toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()
          ); // Add total with rounding
        }
        return ""; // Leave empty for non-numeric fields
      });
      totalsRow[0] = "Totals"; // Add "Totals" label to the first column
      csvRows.push(totalsRow.join(","));

      csvRows.push(""); // Add an empty row for spacing
    });

    // Generate CSV file
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `Bank_FullReport_${monthYear}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Add handler for updated merchant
  const handleUpdatedMerchant = (updatedData) => {
    setUpdatedMerchant(updatedData);   
  };

  // Sort the generatedReportData alphabetically by processor name
  const sortedReportData = [...generatedReportData].sort((a, b) =>
    a.processor.localeCompare(b.processor)
  );
  // Sort mergedData the same way as sortedReportData
  const sortedMergedData = [...mergedData].sort((a, b) =>
    a.processor.localeCompare(b.processor)
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Header title="Error" subtitle={error} />
      </Box>
    );
  }

  return (
    <Box className="agent-report-viewer-page">
      <Header title={`Bank Summary Report - ${monthYear}`} />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" color="primary" onClick={exportToCSV}>
          Export Full Report
        </Button>
      </Box>

      <Tabs
        allowScrollButtonsMobile
        value={activeProcessor}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons={true}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        {sortedReportData.map((processorReport, index) => (
          <Tab key={index} label={processorReport.processor} />
        ))}
      </Tabs>
      <Box>
        {sortedReportData[activeProcessor] &&
          sortedMergedData[activeProcessor] && (
            <BankSummaryReportViewer
              processor={sortedReportData[activeProcessor].processor}
              mergedData={[sortedMergedData[activeProcessor]]}
              onSave={handleSaveChanges}
              setMergedData={setMergedData}
              setHasChanges={setHasChanges}
              hasChanges={hasChanges}
              agents={agents}
              updatedMerchantData={handleUpdatedMerchant}
            />
          )}
      </Box>
    </Box>
  );
};

export default BankSummaryReportViewerPage;
