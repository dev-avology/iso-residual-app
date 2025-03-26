import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
    Tabs,
    Tab,
    Box,
    Button,
    CircularProgress,
} from "@mui/material";
import BankSummaryReportViewer from "../../../../components/reports/bank-summary-report-viewer/bank-summary-report-viewer.component.js";
import { generateBankSummaryReport, createBankSummaryReport, getBankSummaryReport, updateReport } from '../../../../api/reports.api.js'; import { getAgent } from "../../../../api/agents.api.js";
import processorTypeMap from "../../../../lib/typeMap.lib.js";
import Header from "../../../../components/general/header/header.component.js"; // Import the reusable Header component
import { mergeReports } from "../../../../utils/merge.util.js";
import "./bank-summary-report-viewer.page.css";

const BankSummaryReportViewerPage = ({ organizationID, authToken }) => {
    const [generatedReportData, setGeneratedReportData] = useState([]);
    const [dbReport, setDbReport] = useState(null);
    const [activeProcessor, setActiveProcessor] = useState(0); // Use index for MUI Tabs
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mergedData, setMergedData] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const monthYear = searchParams.get("month");

    useEffect(() => {
        if (authToken && organizationID && monthYear) {
            fetchReports();
        } else {
            setError('Missing required data to fetch reports');
        }
    }, [authToken, organizationID, monthYear]);

    useEffect(() => {
        
        console.log('Fetching reports...');
        console.log('generatedReportData:', generatedReportData);
        console.log('dbReport:', dbReport);
        console.log('mergedData:', mergedData);
    }, [mergedData, generatedReportData, dbReport]);
    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);
    
            // Fetch agent details, generated reports, and saved reports simultaneously
            const [ generatedResponse, savedResponse] = await Promise.all([
                generateBankSummaryReport(organizationID, monthYear, authToken),
                getBankSummaryReport(organizationID, monthYear, authToken),
            ]);
            console.log('generatedResponse:', generatedResponse);
            console.log('savedResponse:', savedResponse);
    
    
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
    
    const handleSaveChanges = async () => {
        try {
            // Transform mergedData to match the structure of the generated report
            const minimalReportData = mergedData.map(processorReport => ({
                processor: processorReport.processor,
                reportData: processorReport.reportData.map(({ "Merchant Id": merchantId, approved }) => ({
                    "Merchant Id": merchantId,
                    approved,
                })),
            }));
    
            // Check if all rows are approved
            const allRowsApproved = mergedData.every(processorReport =>
                processorReport.reportData.every(row => row.approved)
            );
    
            // Prepare the updated report object excluding the immutable _id field
            const { _id, ...reportWithoutId } = dbReport; // ✅ Exclude _id
            const updatedReport = {
                ...reportWithoutId, 
                reportData: minimalReportData,
                approved: allRowsApproved
            };
    
            // Save the report (update or create)
            if (dbReport && dbReport.reportID) {
                console.log('Updating existing report:', updatedReport);
                await updateReport(dbReport.reportID, updatedReport, authToken);
            } else {
                console.log('Creating new report:', updatedReport);
                await createBankSummaryReport(organizationID, monthYear, updatedReport, authToken);
            }
    
            // Refetch reports and reset change tracking
            await fetchReports();
            setHasChanges(false);
        } catch (error) {
            console.error("Error saving report:", error);
            alert("Error saving report.", error.message);
        }
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
        console.log("Exporting to CSV...");
        if (!generatedReportData || !generatedReportData.length) {
            console.error("No generated report data available.");
            return;
        }
    
        const csvRows = [];
    
        // Helper function to escape commas and double quotes
        const escapeCSVValue = (value) => {
            if (value == null) return ''; // Handle null/undefined
            const stringValue = String(value).replace(/"/g, '""'); // Escape double quotes
            return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
                ? `"${stringValue}"` // Wrap in quotes if necessary
                : stringValue;
        };
    
        // Helper function to parse and round numeric values
        const parseAndRoundValue = (value) => {
            if (typeof value === 'boolean') return value; // Keep booleans as is
            if (typeof value === 'string') return value; // Keep non-numeric strings unchanged
            if (!isNaN(parseFloat(value))) {
                return parseFloat(parseFloat(value).toFixed(2)); // Round numbers to two decimal places
            }
            return ''; // Fallback for unsupported or invalid values
        };
    
        generatedReportData.forEach((processorReport) => {
            // Validate processorReport and its structure
            if (!processorReport || !processorReport.processor || !processorReport.reportData) {
                console.error("Invalid processor report:", processorReport);
                return;
            }
    
            let totalVolume = 0;
            let totalSales = 0;
            let totalPayout = 0;
            let totalBankPayout = 0;
            let totalAgentNet = 0;
    
            const processorType = getProcessorType(processorReport.processor);
            if (!processorHeaders[processorType]) {
                console.error(`Processor type "${processorType}" not found in processorHeaders.`);
                return;
            }
    
            csvRows.push([escapeCSVValue(processorReport.processor)]); // Add processor name as a header
            csvRows.push(processorHeaders[processorType].map(escapeCSVValue).join(',')); // Add column headers
    
            processorReport.reportData.forEach((item) => {
                if (!item || typeof item !== 'object') {
                    console.error("Invalid report data item:", item);
                    return;
                }
    
                // Parse and round values
                const parseValue = (value) => parseAndRoundValue(value);
    
                // Aggregate totals based on processor type
                switch (processorType) {
                    case 'type1':
                        totalSales += parseFloat(parseValue(item['Sales Amount'])) || 0;
                        totalAgentNet += parseFloat(parseValue(item['Agent Net'])) || 0;
                        break;
                    case 'type2':
                    case 'type3':
                        totalVolume += parseFloat(parseValue(item['Volume'])) || 0;
                        totalSales += parseFloat(parseValue(item['Sales'])) || 0;
                        totalPayout += parseFloat(parseValue(item['Payout Amount'])) || 0;
                        totalBankPayout += parseFloat(parseValue(item['Bank Payout'])) || 0;
                        break;
                    case 'type4':
                        totalSales += parseFloat(parseValue(item['Income'])) || 0;
                        totalAgentNet += parseFloat(parseValue(item['Agent Net'])) || 0;
                        break;
                    default:
                        console.error(`Unhandled processor type: ${processorType}`);
                        break;
                }
    
                // Generate CSV row with properly escaped and processed values
                const csvRow = processorHeaders[processorType].map((header) => escapeCSVValue(parseValue(item[header])));
                csvRows.push(csvRow.join(','));
            });
    
            // Add totals row
            csvRows.push(
                [
                    'Totals',
                    '',
                    escapeCSVValue(totalPayout.toFixed(2)),
                    escapeCSVValue(totalVolume.toFixed(2)),
                    escapeCSVValue(totalSales.toFixed(2)),
                    '',
                    '',
                    '',
                    escapeCSVValue(totalBankPayout.toFixed(2)),
                    escapeCSVValue(totalAgentNet.toFixed(2)),
                    '',
                ].join(',')
            );
    
            csvRows.push(''); // Add an empty row for spacing
        });
    
        // Generate CSV file
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `Bank_FullReport_${monthYear}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    
    
    

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
                title={`Bank Summary Report - ${monthYear}`}
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
                sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
            >
                {generatedReportData.map((processorReport, index) => (
                    <Tab key={index} label={processorReport.processor} />
                ))}
            </Tabs>
            <Box>
                {generatedReportData[activeProcessor] && mergedData[activeProcessor] && (
                    <BankSummaryReportViewer
                        processor={generatedReportData[activeProcessor].processor}
                        mergedData={[mergedData[activeProcessor]]}
                        onSave={handleSaveChanges}
                        setMergedData={setMergedData} // Pass this prop
                        setHasChanges={setHasChanges} // Pass this prop
                        hasChanges={hasChanges} // Pass this prop
                    />
                )}
            </Box>
        </Box>
    );
};

export default BankSummaryReportViewerPage;
