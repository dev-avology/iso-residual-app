import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
    Tabs,
    Tab,
    Box,
    Button,
    CircularProgress,
} from "@mui/material";
import Decimal from "decimal.js";
import BankSummaryReportViewer from "../../../../components/reports/bank/bank-summary-report-viewer/bank-summary-report-viewer.component.js";
import { generateBankSummaryReport, createBankSummaryReport, getBankSummaryReport, updateReport } from '../../../../api/reports.api.js'; 
import { getAgent } from "../../../../api/agents.api.js";
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
        type1: ['Merchant Id', 'Merchant Name', 'Transaction', 'Sales Amount', 'Net', 'BPS', '%', 'Agent Net', 'Branch ID'],
        type2: ['Merchant Id', 'Merchant Name', 'Payout Amount', 'Volume', 'Sales', 'Refunds', 'Reject Amount', 'Bank Split', 'Bank Payout', 'Branch ID'],
        type3: ['Merchant Id', 'Merchant DBA', 'Payout Amount', 'Volume', 'Sales', 'Refunds', 'Reject Amount', 'Bank Split', 'Bank Payout', 'Branch ID'],
        type4: ['Merchant Id', 'Merchant Name', 'Income', 'Expenses', 'Net', '%', 'Bank Payout', 'Branch ID']
    };

    const getProcessorType = (processor) => processorTypeMap[processor] || 'type1';
    
    const exportToCSV = () => {
        if (!generatedReportData.length) return;
    
        const csvRows = [];
    
        // List of fields to calculate totals for
        const fieldsToTotal = [
            "Transaction", "Sales Amount", "Income", "Expenses", "Net",
            "Agent Net", "Volume", "Sales", "Refunds", "Rejected Amount",
            "Bank Payout", "Payout Amount"
        ];
    
        // Helper function to escape commas and double quotes
        const escapeCSVValue = (value) => {
            if (value == null) return ''; // Handle null/undefined
            const stringValue = String(value).replace(/"/g, '""'); // Escape double quotes
            return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
                ? `"${stringValue}"` // Wrap in quotes if necessary
                : stringValue;
        };
    
        // Helper function to format numeric values
        const formatNumericValue = (value) => {
            if (value == null || value === '') return '';
            if (typeof value === 'string' && value.includes('%')) return value; // Keep percentages as is
            const num = parseFloat(value);
            return !isNaN(num) ? num.toFixed(2) : value;
        };
    
        generatedReportData.forEach((processorReport) => {
            // Initialize totals for this processor using Decimal.js
            const totals = fieldsToTotal.reduce((acc, field) => {
                acc[field] = new Decimal(0); // Start with Decimal(0) for precision
                return acc;
            }, {});
    
            const processorType = getProcessorType(processorReport.processor);
            csvRows.push([escapeCSVValue(processorReport.processor)]); // Add processor name as a header
            csvRows.push(processorHeaders[processorType].map(escapeCSVValue).join(',')); // Add column headers
    
            // Sort the report data by Merchant Name/DBA before processing
            const sortedReportData = [...processorReport.reportData].sort((a, b) => {
                const nameA = (a['Merchant Name'] || a['Merchant DBA'] || '').toString().toLowerCase().trim();
                const nameB = (b['Merchant Name'] || b['Merchant DBA'] || '').toString().toLowerCase().trim();
                return nameA.localeCompare(nameB);
            });
    
            sortedReportData.forEach((item) => {
                // Parse and accumulate totals dynamically using Decimal.js
                fieldsToTotal.forEach((field) => {
                    const value = item[field];
                    if (value != null && !isNaN(parseFloat(value))) {
                        totals[field] = totals[field].plus(new Decimal(value)); // Use Decimal.plus for accumulation
                    }
                });
    
                // Generate CSV row with properly escaped and formatted values
                const csvRow = processorHeaders[processorType].map((header) => {
                    const value = item[header];
                    return escapeCSVValue(formatNumericValue(value));
                });
                csvRows.push(csvRow.join(','));
            });
    
            // Add totals row dynamically
            const totalsRow = processorHeaders[processorType].map((header) => {
                if (fieldsToTotal.includes(header)) {
                    return escapeCSVValue(totals[header].toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()); // Add total with rounding
                }
                return ''; // Leave empty for non-numeric fields
            });
            totalsRow[0] = "Totals"; // Add "Totals" label to the first column
            csvRows.push(totalsRow.join(','));
    
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
