import React, { useState } from "react";
import { FaCheck } from "react-icons/fa";
import ReusableTable from "../../../general/table/table.component.js";
import processorTypeMap from "../../../../lib/typeMap.lib.js";
import { 
    Box, 
    Typography, 
    Button, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    TextField, 
    IconButton 
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

const AgentReportViewer = ({
    processor,
    mergedData,
    onSave,
    setMergedData, 
    hasChanges,
    setHasChanges, 
    agents,
    updatedMerchantData
}) => {
    const [selectedRows, setSelectedRows] = useState([]);
    const reportData = mergedData[0]?.reportData || [];
    console.log('reportDataeeeee',reportData);
    const processorType = processorTypeMap[processor] || "type1";
    const splitTypes = ['agent', 'company', 'manager', 'partner', 'rep'];

    /**
     * ✅ Columns generated directly from the report data headers
     * - Removed the calculation logic for "Agent Net"
     */
    const columns = reportData.length > 0
        ? Object.keys(reportData[0])
              .filter((field) => field !== "approved" && field !== "splits") // Exclude 'approved' from headers
              .map((field) => ({
                  field,
                  label: field,
              }))
        : [];

    /**
     * ✅ Keep the approved column logic as requested
     */
    columns.push({
        field: "approved",
        label: "Approved",
        render: (approved) =>
            approved ? (
                <FaCheck color="green" title="Approved" />
            ) : null,
    });

    columns.push({
        field: "splits",
        label: "Splits",
        render: (splits) => {
            if (!splits || !Array.isArray(splits)) return null;
            return splits.map((split, index) => (
                <div key={index}>
                    {`${split.type}: ${split.name} - ${split.value}`}
                </div>
            ));
        }
    });

    /**
     * ✅ Bulk approval handler
     */
    console.log('columns33333',columns);
    const handleBulkApprove = () => {
        if (selectedRows.length === 0) {
            alert("No rows selected for approval.");
            return;
        }

        const updatedReportData = reportData.map((row) =>
            selectedRows.includes(row["Merchant Id"])
                ? { ...row, approved: true }
                : row
        );

        // ✅ Update merged data
        setMergedData((prev) => {
            const updatedMergedData = [...prev];
            updatedMergedData.find(
                (proc) => proc.processor === processor
            ).reportData = updatedReportData;
            return updatedMergedData;
        });

        setSelectedRows([]); 
        setHasChanges(true); 
    };

    const filterConfig = [
        { label: "Needs Audit", field: "needsAudit", type: "checkbox" },
        { label: "Approved", field: "approved", type: "checkbox" },
    ];

    const actions = [
        {
            name: "Bulk Approve",
            onClick: handleBulkApprove,
        },
    ];

    console.log('columns2222',columns)

     const editDialogProps = {
        getFields: (row) => {
            const baseFields = columns
                .filter(col => col.field !== "splits") // Exclude splits from base fields
                .map((col) => ({
                    label: col.label,
                    field: col.field,
                    type: col.type || (typeof row?.[col.field] === "boolean" ? "boolean" : "text"),
                    defaultValue: row?.[col.field] || col.defaultValue || "",
                }));

            const splitFields = [   
                {
                    label: "Other Splits",
                    field: "splits",
                    type: "custom",
                    // Always initialize with row.splits if present
                    defaultValue: Array.isArray(row.splits) ? row.splits : [],
                    component: ({ value = Array.isArray(row.splits) ? row.splits : [], onChange }) => {
                        // Use value prop for splitsArray to ensure reactivity
                        const splitsArray = Array.isArray(value) ? value : [];
                        console.log('Original splits from database:', row.splits);
                        console.log('Current splits array:', splitsArray);
                        console.log('Current row data:', row);
                        return (
                            <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                                <Typography variant="h6" gutterBottom>Other Splits</Typography>
                                {splitsArray.map((split, index) => {
                                    console.log('Rendering split:', split);
                                    return (
                                        <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                            <FormControl fullWidth>
                                                <InputLabel>Split Type</InputLabel>
                                                <Select
                                                    value={split.type || ''}
                                                    className="select-nn"
                                                    onChange={(e) => {
                                                        const updatedSplits = [...splitsArray];
                                                        updatedSplits[index] = { 
                                                            ...updatedSplits[index], 
                                                            type: e.target.value 
                                                        };
                                                        console.log('Updated splits after type change:', updatedSplits);
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
                                                        console.log('Updated splits after name change:', updatedSplits);
                                                        onChange(updatedSplits);
                                                    }}
                                                    label="Name"
                                                >
                                                    {agents?.map((agent) => (
                                                        <MenuItem 
                                                            key={agent.agentID} 
                                                            value={`${agent.fName} ${agent.lName}`}
                                                        >
                                                            {`${agent.fName} ${agent.lName}`}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>

                                            <TextField
                                                label="Value"
                                                type="number"
                                                value={split.value || ''}
                                                onChange={(e) => {
                                                    const updatedSplits = [...splitsArray];
                                                    updatedSplits[index] = { 
                                                        ...updatedSplits[index], 
                                                        value: e.target.value 
                                                    };
                                                    console.log('Updated splits after value change:', updatedSplits);
                                                    onChange(updatedSplits);
                                                }}
                                            />
                                            <IconButton 
                                                color="error"
                                                className="dlt-btn"
                                                onClick={() => {
                                                    const updatedSplits = splitsArray.filter((_, i) => i !== index);
                                                    console.log('Updated splits after deletion:', updatedSplits);
                                                    onChange(updatedSplits);
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    );
                                })}
                                <Button 
                                    variant="contained" 
                                    onClick={() => {
                                        const newSplits = [...splitsArray, { type: '', name: '', value: '' }];
                                        console.log('Updated splits after adding new:', newSplits);
                                        onChange(newSplits);
                                    }}
                                    sx={{ mt: 2 }}
                                >
                                    Add Split
                                </Button>
                            </Box>
                        );
                    },
                }
            ];

            return [...baseFields, ...splitFields];
        }
    };

    /**
     * ✅ Render Component (No Agent Net Calculations)
     */
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                {processor} Agent Report
            </Typography>
            <ReusableTable
                data={reportData}
                // setData={(updatedData) => {
                //     setMergedData((prev) => {
                //         const updatedMergedData = [...prev];
                //         updatedMergedData.find(
                //             (proc) => proc.processor === processor
                //         ).reportData = updatedData;
                //         return updatedMergedData;
                //     });
                //     setHasChanges(true); 
                // }}

                  setData={(updatedData) => {
                    // Find the updated merchant record
                    const updatedMerchant = updatedData.find(row => 
                        !reportData.find(originalRow => 
                            originalRow["Merchant Id"] === row["Merchant Id"] && 
                            JSON.stringify(originalRow) === JSON.stringify(row)
                        )
                    );
                    
                    if (updatedMerchant) {
                        console.log('Updated Merchant Record:', updatedMerchant);
                        // Pass both the updated merchant and the processor
                        updatedMerchantData({
                            merchant: updatedMerchant,
                            processor: processor // Add processor information
                        });
                    }

                    setMergedData((prev) => {
                        const updatedMergedData = [...prev];
                        updatedMergedData.find(
                            (proc) => proc.processor === processor
                        ).reportData = updatedData;
                        return updatedMergedData;
                    });
                    setHasChanges(true); 
                }}









                idField="Merchant Id"
                columns={columns}
                filtersConfig={filterConfig}
                actions={actions}
                enableSearch={true}
                selected={selectedRows}
                setSelected={setSelectedRows}
                fileName={`${processor}_AgentReport.csv`}
                enableTotals={true}
                approvalAction={true}
                onSave={onSave}
                setHasChanges={setHasChanges}
                hasChanges={hasChanges}
                editDialogProps={editDialogProps}
                 type="report"
            />
        </Box>
    );
};

export default AgentReportViewer;
