import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Select, MenuItem, TextField, FormControl, InputLabel, IconButton } from "@mui/material";
import { FaExclamationTriangle } from "react-icons/fa"; // Import the specific icon
import { useParams, useNavigate } from "react-router-dom";
import { FaCheck } from "react-icons/fa"; // Import the specific icon
import Header from "../../../../components/general/header/header.component";
import ReusableTable from "../../../../components/general/table/table.component";
import { getReportById, updateReport } from "../../../../api/reports.api";
import { regenerateProcessorReport } from "../../../../utils/reports/processorReport.util";
import DeleteIcon from '@mui/icons-material/Delete';
import { getAgents } from "../../../../api/agents.api";

const ReportViewerPage = ({ authToken, organizationID }) => {
    const { reportID } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [filteredData, setFilteredData] = useState([]); // For filtered results
    const [selectedRows, setSelectedRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [idField, setIdField] = useState("id");
    const [hasChanges, setHasChanges] = useState(false);
    const [status, setStatus] = useState({ loading: true, error: null });
    const [splits, setSplits] = useState([]);
    const [editRow, setEditRow] = useState(null);
    const [newSplit, setNewSplit] = useState({
        type: '',
        name: '',
        value: ''
    });
    const [agents, setAgents] = useState([]);

    const splitTypes = ['agent', 'company', 'manager', 'partner', 'rep'];

    // Validate token on component mount
    useEffect(() => {
        if (!authToken) {
            setError("Authentication token is missing");
            // Redirect to login or handle unauthorized access
            navigate('/login');
            return;
        }
    }, [authToken, navigate]);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                if (!authToken) {
                    throw new Error("No authentication token available");
                }
                const response = await getAgents(organizationID, authToken);
                console.log('response ashish',response);
                if (response && response.agents) {
                    setAgents(response.agents);
                } else {
                    setAgents([]);
                }
            } catch (err) {
                console.error("Agent fetch error:", err?.response?.data || err.message);
                if (err?.response?.data?.error === "Invalid or expired token") {
                    setError("Your session has expired. Please log in again.");
                    navigate('/login');
                } else {
                    setError('Failed to fetch agents');
                }
            } finally {
                setLoading(false);
            }
        };

        if (authToken && organizationID) {
            fetchAgents();
        }
    }, [reportID, authToken, organizationID, navigate]);

    console.log('agents data',agents);

    // Fetch report data on mount
    useEffect(() => {
        const fetchReport = async () => {
            try {
                if (!authToken) {
                    throw new Error("No authentication token available");
                }
                setLoading(true);
                const data = await getReportById(reportID, authToken);
                setIdField(Object.keys(data.reportData[0])[1]);
                setReport(data);
                setReportData(data.reportData);
                setFilteredData(data.reportData);
                
                setLoading(false);
                console.log("Fetched report data:", data.reportData);
            } catch (err) {
                console.error("Report fetch error:", err?.response?.data || err.message);
                if (err?.response?.data?.error === "Invalid or expired token") {
                    setError("Your session has expired. Please log in again.");
                    navigate('/login');
                } else {
                    setError("Failed to load report data");
                }
                setLoading(false);
            }
        };

        if (authToken) {
            fetchReport();
        }
    }, [reportID, authToken, navigate]);

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
    let baseColumns = reportData.length > 0
        ? Object.keys(reportData[0]).map((field) => ({
            field,
            label: field.replace(/_/g, " "),
        }))
        : [];

    if (report?.type === "processor" ) {
        baseColumns.shift(); // Remove the first column
        baseColumns.pop(); // Remove the last column
        baseColumns.pop(); // Remove the last column
    } else if (report?.type === "ar") {
        baseColumns.pop(); // Remove the last column
    }

    // Add the "Needs Audit" column
    baseColumns.unshift({
        field: "needsAudit",
        label: "Needs Audit",
        render: (needsAudit) =>
            needsAudit ? (
                <FaExclamationTriangle color="orange" title="Needs Audit" />
            ) : null,
    });

    // Add the "Approved" column
    baseColumns.push({
        field: "approved",
        label: "Approved",
        render: (approved) =>
            approved ? (
                <FaCheck color="green" title="Approved" />
            ) : null,
    });

    // Use the base columns for the table
    const columns = baseColumns;

    console.log('Columns with splits:', columns); // Debug log

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
        { field: "Other Splits", label: "Other Splits" },
        { field: "ISO Total", label: "ISO Total" },
        { field: "Transaction Fee ISO", label: "Transaction Fee ISO" },
        { field: "Monthly Gateway Fee ISO", label: "Monthly Gateway Fee ISO" },
        
    ];

    const handleAddSplit = () => {
        if (newSplit.type && newSplit.name && newSplit.value) {
            setSplits([...splits, newSplit]);
            setNewSplit({ type: '', name: '', value: '' });
        }
    };

    const handleRemoveSplit = (index) => {
        const updatedSplits = splits.filter((_, i) => i !== index);
        setSplits(updatedSplits);
    };

    const handleSaveChanges = async () => {
        try {
            // Check if all rows are approved
            const allRowsApproved = filteredData.every(row => row.approved);
    
            // Update the report object and mark as approved if all rows are approved
            const updatedReport = {
                ...report,
                approved: allRowsApproved,
                reportData: filteredData.map(row => ({
                    ...row,
                    splits: row[idField] === editRow?.[idField] ? splits : (row.splits || [])
                }))
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

    const editDialogProps = {
        getFields: (row) => {
            const baseFields = columns.map((col) => ({
                label: col.label,
                field: col.field,
                type: col.type || (typeof row?.[col.field] === "boolean" ? "boolean" : "text"),
                defaultValue: row?.[col.field] || col.defaultValue || "",
            }));

            const splitFields = [   
                {
                    label: "Other Splits",
                    field: "splits_section",
                    type: "custom",
                    component: ({ value = row.splits || [], onChange }) => {
                        const splitsArray = value;
                        return (
                            <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                                <Typography variant="h6" gutterBottom>Other Splits</Typography>
                                {splitsArray.map((split, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Split Type</InputLabel>
                                            <Select
                                                value={split.type}
                                                className="select-nn"
                                                onChange={(e) => {
                                                    const updatedSplits = [...splitsArray];
                                                    updatedSplits[index] = { ...updatedSplits[index], type: e.target.value };
                                                    onChange(updatedSplits);
                                                }}
                                                label="Split Type"
                                            >
                                                {splitTypes.map(type => (
                                                    <MenuItem key={type} value={type}>
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <FormControl fullWidth>
                                            <InputLabel>Name</InputLabel>
                                            <Select
                                                value={split.name || ''}
                                                onChange={(e) => {
                                                    const updatedSplits = [...splitsArray];
                                                    updatedSplits[index] = { 
                                                        ...updatedSplits[index], 
                                                        name: e.target.value 
                                                    };
                                                    onChange(updatedSplits);
                                                }}
                                                label="Name"
                                            >
                                                {agents.map((agent) => (
                                                    <MenuItem 
                                                        key={agent.agentID} 
                                                        value={`${agent.fName} ${agent.lName}`}
                                                    >
                                                        {`${agent.fName} ${agent.lName}`}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                            {/* <TextField
                                                label="Name"
                                                value={split.name || ''}
                                                onChange={(e) => {
                                                    const updatedSplits = [...splitsArray];
                                                    updatedSplits[index] = { ...updatedSplits[index], name: e.target.value };
                                                    onChange(updatedSplits);
                                                }}
                                            /> */}

                                        <TextField
                                            label="Value"
                                            type="number"
                                            value={split.value || ''}
                                            onChange={(e) => {
                                                const updatedSplits = [...splitsArray];
                                                updatedSplits[index] = { ...updatedSplits[index], value: e.target.value };
                                                onChange(updatedSplits);
                                            }}
                                        />
                                        <IconButton 
                                            color="error"
                                            className="dlt-btn"
                                            onClick={() => {
                                                const updatedSplits = splitsArray.filter((_, i) => i !== index);
                                                onChange(updatedSplits);
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                ))}
                                <Button 
                                    variant="contained" 
                                    onClick={() => onChange([...splitsArray, { type: '', name: '', value: '' }])}
                                    sx={{ mt: 2 }}
                                >
                                    Add Split
                                </Button>
                            </Box>
                        );
                    },
                    defaultValue: row.splits || [],
                }
            ];

            return [...baseFields, ...splitFields];
        }
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
                enableFilters={false}
                selected={selectedRows}
                setSelected={setSelectedRows}
                approvalAction={true}
                fileName={`${report?.type}_${report?.processor}_${report?.month}.csv`}
                hasChanges={hasChanges}
                setHasChanges={setHasChanges}
                enableTotals={true}
                onSave={handleSaveChanges}
                totalFields={totalFields}
                editDialogProps={editDialogProps}
            />
        </Box>
    );
};

export default ReportViewerPage;
