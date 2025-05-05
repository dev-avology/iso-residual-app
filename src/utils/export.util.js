import Decimal from "decimal.js";

export const exportToCSV = (data, columns, totals = {}, filename = "export.csv",agentDetails) => {
    console.log("exportToCSV function called");

    if (!data || data.length === 0 || columns.length === 0) {
        alert("No data available to export.");
        return;
    }
    var agentSplit = 0;
    if(agentDetails){
        agentSplit = parseFloat(agentDetails.agentSplit.replace("%", ""));
    }
    console.log("agentSplit:", agentSplit);
    console.log("Input Data:", data);
    console.log("Input Columns:", columns);

    // Validate if fields in columns exist in data
    const validColumns = columns.filter((col) => data.some((row) => col.field in row));
    if (validColumns.length === 0) {
        alert("No valid fields to export.");
        return;
    }

    console.log("Valid Columns:", validColumns);

    // Extract headers
    const headers = validColumns.map((col) => col.label || col.field);
    console.log("Headers:", headers);

    // Initialize CSV rows with headers
    const csvRows = [headers.map((header) => `"${header}"`).join(",")];

    // Helper function to process values
    const processValue = (value) => {
        if (typeof value === "boolean") {
            return value; // Keep booleans as is
        }
        if (typeof value === "string" && value.includes("%")) {
            // Handle percentage strings (e.g., "35%")
            const percentageValue = parseFloat(value.replace("%", ""));
            return isNaN(percentageValue) ? value : `${percentageValue.toFixed(2)}%`; // Keep as string with 2 decimals
        }
        if (typeof value === "string") {
            return value; // Keep non-numeric strings unchanged
        }
        if (typeof value === "number") {
            return new Decimal(value).toDecimalPlaces(2).toNumber(); // Round numbers to 2 decimals
        }
        return ""; // Fallback for unsupported types
    };

    // Add data rows with processed values
    // data.forEach((row, index) => {
    //     console.log(`Processing Row ${index}:`, row);

    //     const values = validColumns.map((col) => {
    //         const value = row[col.field];
    //         const processedValue = processValue(value); // Process each value

    //         // Wrap processed value in double quotes and escape inner quotes
    //         return processedValue !== null && processedValue !== undefined
    //             ? `"${String(processedValue).replace(/"/g, '""')}"`
    //             : ""; // Leave blank for null or undefined
    //     });

    //     console.log(`Row ${index} values (processed):`, values);
    //     csvRows.push(values.join(","));
    // });

    data.forEach((row, index) => {
        console.log(`Processing Row ${index}:`, row);
    
        const values = validColumns.map((col) => {
            var value = row[col.field];
            console.log(value, 'valuevalue');
            console.log(col.label, 'col.label'); 
    
            if (Array.isArray(value) && value.length > 0) {
                const firstItem = value[0];
                if (firstItem.hasOwnProperty("name") && firstItem.hasOwnProperty("split")) {
                    const firstItem = value[0];
                    if (col.label === 'Number of Partners') {
                        value = value.length;
                    }else if (col.label === 'Number of Reps') {
                        value = value.length
                    }else if(col.label === 'Total Rep Split (%)'){
                        let totalSplit = 0;
                        const names = value.map(item => {
                            const percent = parseFloat(item.split?.replace('%', '') || 0); // convert to number
                            totalSplit += percent; // now adds numerically
                            return item.name;
                        });
                        value = Math.round(Number(totalSplit) + Number(agentSplit)) + '%';
                    }else{
                        let totalSplit = 0;
                        const names = value.map(item => {
                            const percent = parseFloat(item.split?.replace('%', '') || 0); // convert to number
                            totalSplit += percent; // now adds numerically
                            return item.name;
                        });
                        value = totalSplit + '%';
                    }
                }
            }
    
            const processedValue = processValue(value);
            return processedValue !== null && processedValue !== undefined
                ? `"${String(processedValue).replace(/"/g, '""')}"`
                : "";
        });
    
        console.log(`Row ${index} values (processed):`, values);
        csvRows.push(values.join(","));
    });

    // Add totals row if provided
    if (Object.keys(totals).length > 0) {
        const totalsRow = validColumns.map((col, index) =>
            index === 0
                ? "Totals" // Add "Totals" label to the first column
                : totals[col.field] !== undefined
                ? new Decimal(totals[col.field]).toDecimalPlaces(2).toNumber().toFixed(2) // Round totals to 2 decimals
                : ""
        );
        console.log("Totals Row:", totalsRow);
        csvRows.push(totalsRow.join(","));
    }

    console.log("Final CSV Rows:", csvRows);

    // Convert rows to CSV string
    const csvString = csvRows.join("\n");
    console.log("Final CSV String:", csvString);

    // Create and trigger download
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
