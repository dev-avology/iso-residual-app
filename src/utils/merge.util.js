export const mergeReports = (generatedReports, savedReports) => {
    // Validate inputs
    if (!Array.isArray(generatedReports)) {
        console.warn("Invalid generatedReports: Expected an array");
        return [];
    }
    if (!Array.isArray(savedReports)) {
        console.warn("Invalid savedReports: Defaulting to generatedReports with `approved: false`");
        return generatedReports.map(processorReport => ({
            ...processorReport,
            reportData: processorReport.reportData.map(row => ({
                ...row,
                approved: row.approved || false, // Default `approved` to false
            })),
        }));
    }

    // Create a map of savedReports keyed by processor for faster lookups
    const savedReportsMap = new Map(
        savedReports.map(savedProcessor => [
            savedProcessor.processor,
            new Map(
                savedProcessor.reportData.map(row => [row["Merchant Id"], row])
            ),
        ])
    );

    // Merge the data
    return generatedReports.map(processorReport => {
        const savedProcessorMap = savedReportsMap.get(processorReport.processor) || new Map();
        const updatedReportData = processorReport.reportData.map(generatedRow => {
            const savedRow = savedProcessorMap.get(generatedRow["Merchant Id"]);
            return {
                ...generatedRow,
                approved: savedRow ? savedRow.approved : false, // Use saved `approved` if found, default to false
            };
        });

        return {
            ...processorReport,
            reportData: updatedReportData,
        };
    });
};
