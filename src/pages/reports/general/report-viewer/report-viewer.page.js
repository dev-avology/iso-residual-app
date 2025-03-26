import React, { useState, useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";
import { FaExclamationTriangle } from "react-icons/fa"; // Import the specific icon
import { useParams } from "react-router-dom";
import { FaCheck } from "react-icons/fa"; // Import the specific icon
import Header from "../../../../components/general/header/header.component";
import ReusableTable from "../../../../components/general/table/table.component";
import { getReportById, updateReport } from "../../../../api/reports.api";
import { regenerateProcessorReport } from "../../../../utils/reports/processorReport.util";

const ReportViewerPage = ({ authToken }) => {
    const { reportID } = useParams();
    const [report, setReport] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [filteredData, setFilteredData] = useState([]); // For filtered results
    const [selectedRows, setSelectedRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [idField, setIdField] = useState("id");
    const [hasChanges, setHasChanges] = useState(false);
    const [status, setStatus] = useState({ loading: true, error: null });

    // Fetch report data on mount
    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                const data = await getReportById(reportID, authToken);
                setIdField(Object.keys(data.reportData[0])[1]);
                setReport(data);
                setReportData(data.reportData);
                setFilteredData(data.reportData); // Initialize with all data
                setLoading(false);
                console.log("Fetched report data:", data.reportData);
            } catch (err) {
                setError("Failed to load report data");
                setLoading(false);
            }
        };

        fetchReport();
    }, [reportID, authToken]);


    const handleRegenerateReport = async () => {
        try {
            setStatus({ loading: true, error: null });
            const updatedReport = await regenerateProcessorReport(report.organizationID, authToken, report);
            setReport(updatedReport);
            setFilteredData(updatedReport.reportData);
            setHasChanges(true); // Mark changes as unsaved
            setStatus({ loading: false, error: null });
        } catch (error) {
            console.error('Error regenerating report:', error);
            setStatus({ loading: false, error: 'Failed to regenerate report.' });
        }
    };


    const handleBulkApprove = () => {
        if (selectedRows.length === 0) {
            alert("No rows selectedRows for approval.");
            return;
        }

        const updatedData = filteredData.map((row) =>
            selectedRows.includes(row[idField])
                ? { ...row, approved: true, needsAudit: false }
                : row
        );
        setHasChanges(true); // Set changes flag
        setFilteredData(updatedData); // Update the table data
        setSelectedRows([]); // Clear the selected rows
    };

    // Define columns dynamically based on data
    const columns = reportData.length > 0
        ? Object.keys(reportData[0]).map((field) => ({
            field,
            label: field.replace(/_/g, " "),
        }))
        : [];

    if (report?.type === "processor" ) {
    columns.shift(); // Remove the first column
    columns.pop(); // Remove the last column
    columns.pop(); // Remove the last column

    } else if (report?.type === "ar") {
        columns.pop(); // Remove the last column

    };

    columns.push({
        field: "approved",
        label: "Approved",
        render: (approved) =>
            approved ? (
                <FaCheck color="green" title="Approved" />
            ) : null,
    });

    // Add the "Needs Audit" column
    columns.unshift({
        field: "needsAudit",
        label: "Needs Audit",
        render: (needsAudit) =>
            needsAudit ? (
                <FaExclamationTriangle color="orange" title="Needs Audit" />
            ) : null,
    });

    // Define filter configuration
    const filterConfig = report?.type === "processor" ? [
        { label: "Needs Audit", field: "needsAudit", type: "checkbox" },
        { label: "Approved", field: "approved", type: "checkbox" },
        { label: "Branch ID", field: "Branch ID", type: "hasValue" },
    ] : [
        { label: "Needs Audit", field: "needsAudit", type: "checkbox" },
        { label: "Approved", field: "approved", type: "checkbox" }
    ];

    const actions = [
        { name: "Approve", onClick: handleBulkApprove },
        { name: "Regenerate Report", onClick: handleRegenerateReport },
    ];

    const totalFields = [
        { field: "Setup Fee ISO", label: "Setup Fee ISO" },
        { field: "Monthly Gateway Fee ISO", label: "Monthly Gateway Fee ISO" },
        { field: "Transaction Fee ISO", label: "Transaction Fee ISO" },
        { field: "Transaction Count", label: "Transaction Count" },
        { field: "ISO Total", label: "ISO Total" },
        { field: "lineItemQuantity", label: "Line Item Quantity" },
        { field: "lineItemAmount", label: "Line Item Amount" },
        { field: "lineItemPrice", label: "Line Item Price" },
        { field: "Transactions", label: "Transactions" },
        { field: "Fee", label: "Fee" },
        { field: "Total", label: "Total" },
        { field: "Income", label: "Income" },
        { field: "Expense", label: "Expense" },
        { field: "Net", label: "Net" },
        { field: "Payout Amount", label: "Payout Amount" },
        { field: "Volume", label: "Volume" },
        { field: "Sales", label: "Sales" },
        { field: "Refunds", label: "Refunds" },
        { field: "Reject Amount", label: "Reject Amount" },
        { field: "Agent Net", label: "Agent Net" },
        { field: "Sales Amount", label: "Sales Amount" },
        { field: "Expenses", label: "Expenses" },
        { field: "Bank Payout", label: "Bank Payout" },
        { field: "ISO Total", label: "ISO Total" },
        { field: "Transaction Fee ISO", label: "Transaction Fee ISO" },
        { field: "Monthly Gateway Fee ISO", label: "Monthly Gateway Fee ISO" },
        
    ];

    const handleSaveChanges = async () => {
        try {
            // Check if all rows are approved
            const allRowsApproved = filteredData.every(row => row.approved);
    
            // Update the report object and mark as approved if all rows are approved
            const updatedReport = {
                ...report,
                approved: allRowsApproved, // ✅ Mark the report as approved if all rows are approved
                reportData: filteredData
            };
    
            await updateReport(reportID, updatedReport, authToken);
            alert("Report saved successfully.");
    
            setHasChanges(false); // Reset the change flag after saving
        } catch (err) {
            alert("Failed to save changes.");
        }
    };
    

    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    if (loading) return <Typography>Loading...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box sx={{ p: 4 }}>
            <Header
                title={`${capitalizeFirstLetter(report?.type)} Report`}
                subtitle={`${report?.processor} - ${report?.month}`}
            />
            <ReusableTable
                data={filteredData}
                setData={setFilteredData}
                idField={idField}
                columns={columns}
                filtersConfig={filterConfig}
                actions={actions}
                enableSearch={true}
                enableFilters={false} // Filters handled by FilterComponent
                selected={selectedRows}
                setSelected={setSelectedRows}
                approvalAction={true}
                fileName={`${report?.type}_${report?.processor}_${report?.month}.csv`}
                hasChanges={hasChanges}
                setHasChanges={setHasChanges}
                enableTotals={true}
                onSave={handleSaveChanges}
                totalFields={totalFields}
            />
        </Box>
    );
};

export default ReportViewerPage;
