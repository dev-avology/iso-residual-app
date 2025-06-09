import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    Tabs,
    Tab,
    Box,
    Button,
    CircularProgress,
} from "@mui/material";
import AgentReportViewer from "../../../../components/reports/agent/agent-report-viewer/agent-report-viewer.component.js";
import { generateAgentReport, createAgentReport, getAgentReportByMonth, updateReport,updateMerchantData } from '../../../../api/reports.api.js'; 
import { getAgent } from "../../../../api/agents.api.js";
import processorTypeMap from "../../../../lib/typeMap.lib.js";
import Header from "../../../../components/general/header/header.component.js"; // Import the reusable Header component
import { mergeReports } from "../../../../utils/merge.util.js";
import "./agent-report-viewer.page.css";
import { use } from "react";
import { getAgents } from "../../../../api/agents.api.js";
import { useNavigate,useLocation } from "react-router-dom";


const AgentReportViewerPage = ({ organizationID, authToken }) => {
    const { agentID } = useParams();
    const [agent, setAgent] = useState(null);
    const [generatedReportData, setGeneratedReportData] = useState([]);
    const [dbReport, setDbReport] = useState(null);
    const [activeProcessor, setActiveProcessor] = useState(0); // Use index for MUI Tabs
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mergedData, setMergedData] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [agents, setAgents] = useState([]);
    const [updatedMerchant, setUpdatedMerchant] = useState([]);

    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const monthYear = searchParams.get("month");
    const navigate = useNavigate();

    useEffect(() => {
        if (authToken && organizationID && agentID && monthYear) {
            fetchReports();
        } else {
            setError('Missing required data to fetch reports');
        }
    }, [authToken, organizationID, agentID, monthYear]);

    useEffect(() => {
        
        console.log('Fetching reports...');
        console.log('generatedReportDataSS:', generatedReportData);
        console.log('dbReport:', dbReport);
        console.log('mergedData:', mergedData);
    }, [mergedData, generatedReportData, dbReport]);
    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);
    
            // Fetch agent details, generated reports, and saved reports simultaneously
            const [agentResponse, generatedResponse, savedResponse] = await Promise.all([
                getAgent(organizationID, agentID, authToken),
                generateAgentReport(organizationID, agentID, monthYear, authToken),
                getAgentReportByMonth(organizationID, agentID, monthYear, authToken),
            ]);
            console.log('agentResponse:', agentResponse);
            console.log('generatedResponse:', generatedResponse);
            console.log('savedResponse:', savedResponse);
    
            // Set agent details
            const agentData = agentResponse.data?.agent || null;
            setAgent(agentData);
    
            const generatedReportData = generatedResponse.data?.reportData || [];
            setGeneratedReportData(generatedReportData);
            setDbReport(savedResponse?.data || null);
    
            // Merge the reports
            if (generatedReportData.length) {
                console.log('arg1:', generatedReportData);
                console.log('arg2:', savedResponse?.data?.reportData || null);
                const merged = mergeReports(generatedReportData, savedResponse?.data?.reportData || null);
                setMergedData(merged);
                console.log("Merged data:", merged);
            } else {
                console.warn("Generated report is empty. No data to merge.");
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
          console.log('Agents reports API Response:', response);
          
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
                processor: processorReport.processor, // Keep the processor name
                reportData: processorReport.reportData.map(({ "Merchant Id": merchantId, approved, splits }) => ({
                    "Merchant Id": merchantId,
                    approved,
                    splits: splits || {} // Include splits data
                })),
            }));
    
            // ✅ Check if all rows across all processors are approved
            const allRowsApproved = mergedData.every(processorReport =>
                processorReport.reportData.every(row => row.approved)
            );
    
            // Construct the final report data with the approved status
            const reportData = {
                reportData: minimalReportData,
                approved: allRowsApproved,  // ✅ Set report approval status based on all rows
            };
    
            // ✅ Save the report (update or create)
            if (dbReport && dbReport.reportID) {
                dbReport.reportData = minimalReportData;
                dbReport.approved = allRowsApproved; // ✅ Ensure this is updated in the existing report
                console.log('Updating dbReport:', dbReport);
                await updateReport(dbReport.reportID, dbReport, authToken);
            } else {
                console.log('Creating a new report with approval status.');
                await createAgentReport(organizationID, agentID, monthYear, reportData, authToken);
            }

            if(updatedMerchant){
                const merchantId = updatedMerchant.merchant["Merchant Id"];          
                // Create the update payload
                // const updatePayload = {
                //     monthYear,
                //     organizationID,
                //     processor: updatedMerchant.processor,
                //     merchantData: {
                //         ...updatedMerchant.merchant,
                //         splits: updatedMerchant.merchant.splits || {} // Ensure splits are included
                //     },
                // };


                const updatePayload = {
                    monthYear,
                    organizationID,
                    processor: updatedMerchant.processor,
                    merchantData: updatedMerchant.merchant,
                  };


                console.log('updatePayload', updatePayload);
                await updateMerchantData(merchantId, updatePayload, authToken);
            }
    
            // ✅ Refetch reports and reset change tracking
            await fetchReports();
            setHasChanges(false);
            alert("Report saved successfully.");
        } catch (error) {
            console.error("Error saving report:", error);
            alert("Error saving report. Please check the console for details.");
        }
    };
    
    const handleUpdatedMerchant = (updatedData) => {
      setUpdatedMerchant(updatedData);   
    };
    


    const handleTabChange = (event, newValue) => {
        setActiveProcessor(newValue);
    };
    



    const processorHeaders = {
        type1: ['Merchant Id', 'Merchant Name', 'Transaction', 'Sales Amount', 'Income', 'Expenses', 'Net', 'BPS', '%', 'Agent Net', 'Branch ID'],
        type2: ['Merchant Id', 'Merchant Name', 'Payout Amount', 'Volume', 'Sales', 'Refunds', 'Reject Amount', 'Bank Split', 'Bank Payout', 'Branch ID'],
        type3: ['Merchant Id', 'Merchant DBA', 'Payout Amount', 'Volume', 'Sales', 'Refunds', 'Reject Amount', 'Bank Split', 'Bank Payout', 'Branch ID'],
        type4: ['Merchant Id', 'Merchant Name', 'Income', 'Expenses', 'Net', '%', 'Agent Net', 'Branch ID']
    };

    const getProcessorType = (processor) => processorTypeMap[processor] || 'type1';

    const exportToCSV = () => {
        if (!sortedReportData || !sortedReportData.length) {
            console.error("No generated report data available.");
            return;
        }
    
        const csvRows = [];
    
        // Helper function to escape values for CSV (handles commas, quotes, and newlines)
        const escapeCSVValue = (value) => {
            if (value == null) return ''; // Handle null/undefined
            let stringValue = String(value).replace(/"/g, '""'); // Escape existing double quotes
    
            // Wrap in double quotes if the value contains a comma, double quote, or newline
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                stringValue = `"${stringValue}"`;
            }
    
            return stringValue;
        };
    
        sortedReportData.forEach((processorReport) => {
            // Ensure processorReport and its reportData are valid
            if (!processorReport || !processorReport.processor || !processorReport.reportData || !processorReport.reportData.length) {
                console.error("Invalid processor report structure:", processorReport);
                return;
            }
    
            // ✅ Extract headers dynamically, ensuring the reportData[0] exists
            const headers = Object.keys(processorReport.reportData[0] || {}).filter(header => header !== "approved");
    
            // ✅ Add processor name and dynamic headers
            csvRows.push([escapeCSVValue(processorReport.processor)]); 
            csvRows.push(headers.map(escapeCSVValue).join(',')); // Escape headers as well
    
            processorReport.reportData.forEach((item) => {
                // ✅ Corrected the handling for both strings and numbers
                const parseValue = (value) => {
                    if (typeof value === "boolean") return value; // Keep booleans as is
                    if (typeof value === "string") return escapeCSVValue(value); // Escape string values
                    if (!isNaN(parseFloat(value))) {
                        return escapeCSVValue(parseFloat(value).toFixed(2)); // Round numbers to 2 decimals
                    }
                    return ''; // Fallback for unsupported or invalid values
                };
    
                // ✅ Map each row's values based on the extracted headers
                const csvRow = headers.map(header => {
                    const value = item[header];
                    return value != null && value !== '' ? parseValue(value) : ''; 
                });
                csvRows.push(csvRow.join(',')); // ✅ Use escaped values
            });
    
            /**
             * ✅ Totals Row Fix:
             * - Totals only numeric columns.
             * - Skips non-numeric columns (`Merchant Id`, `Branch ID`, `Merchant Name`, `Agent Split`)
             * - Correct alignment: "Totals" in column 1 (`Merchant Id`)
             */
            const totalRow = headers.map((header, index) => {
                if (["Merchant Id"].includes(header)) {
                    return escapeCSVValue('Totals'); // ✅ Place "Totals" label in the first column
                }
    
                if (["Branch ID", "Merchant Name", "Agent Split"].includes(header)) {
                    return ''; // ✅ Skip these non-numeric columns
                }
    
                const isNumericColumn = processorReport.reportData.some(
                    row => !isNaN(parseFloat(row[header]))
                );
    
                if (isNumericColumn) {
                    const total = processorReport.reportData.reduce((sum, row) => {
                        const value = parseFloat(row[header]) || 0;
                        return sum + value;
                    }, 0);
                    return escapeCSVValue(total.toFixed(2));
                }
                return ''; 
            });
    
            csvRows.push(totalRow.join(',')); // ✅ Use escaped values
            csvRows.push(''); // Add an empty row for spacing
        });
    
        // ✅ CSV Export Logic
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `Agent_FullReport_${monthYear}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
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
            <Header
                title={`${agent.fName} ${agent.lName}`}
                subtitle={`Agent Report - ${monthYear}`}
            />
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
                // sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
                sx={{ 
                    borderBottom: 1, 
                    borderColor: "divider", 
                    mb: 3,
                    '& .MuiTab-root': {
                        color: '#000000',
                        '&.Mui-selected': {
                        color: '#000000',
                        },
                    },
                }}
            >
                {sortedReportData.map((processorReport, index) => (
                    <Tab key={index} label={processorReport.processor} />
                ))}
            </Tabs>
            <Box>
                {sortedReportData[activeProcessor] && (
                    <AgentReportViewer
                        authToken={authToken}
                        organizationID={organizationID}
                        agentID={agentID}
                        monthYear={monthYear}
                        processor={sortedReportData[activeProcessor].processor}
                        mergedData={[sortedMergedData[activeProcessor]]}
                        onSave={handleSaveChanges}
                        setMergedData={setMergedData} // Pass this prop
                        setHasChanges={setHasChanges} // Pass this prop
                        hasChanges={hasChanges} // Pass this prop
                        agents={agents}
                        updatedMerchantData={handleUpdatedMerchant}
                    />
                )}
            </Box>
        </Box>
    );
};

export default AgentReportViewerPage;
