import Decimal from "decimal.js";

export const exportToCSV = (data, columns, totals = {}, filename = "export.csv") => {
    console.log("exportToCSV function called");

    if (!data || data.length === 0 || columns.length === 0) {
        alert("No data available to export.");
        return;
    }

    // Log input data
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
    data.forEach((row, index) => {
        console.log(`Processing Row ${index}:`, row);

        const values = validColumns.map((col) => {
            const value = row[col.field];
            const processedValue = processValue(value); // Process each value

            // Wrap processed value in double quotes and escape inner quotes
            return processedValue !== null && processedValue !== undefined
                ? `"${String(processedValue).replace(/"/g, '""')}"`
                : ""; // Leave blank for null or undefined
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
