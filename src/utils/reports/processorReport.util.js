import { getAgents } from '../../api/agents.api';

const processorTypeMap = {
    'accept.blue': 'billing',
    'PAAY': 'billing',
    'Clearent': 'type1',
    'Fiserv Bin & ICA': 'type1',
    'Fiserv Omaha': 'type1',
    'Global': 'type1',
    'Merchant Lynx': 'type1',
    'Micamp': 'type1',
    'Payment Advisors': 'type1',
    'Shift4': 'type2',
    'Hyfin': 'type4',
    'Rectangle Health': 'type4',
    'TRX': 'type3',
    'Line Item Deductions': 'type4',
};

export const regenerateProcessorReport = async (organizationID, authToken, report) => {
    try {
        // Step 1: Fetch agents
        const agentsResponse = await getAgents(organizationID, authToken);
        const agents = agentsResponse.agents;
        console.log('Agents fetched:', agents);

        // Step 2: Build the merchantID-to-branchID map
        const merchantIDMap = buildMerchantIDMap(agents);
        console.log('MerchantID Map:', merchantIDMap);

        // Step 3: Regenerate the report data
        const updatedReportData = regenerateReportData(report, merchantIDMap);
        console.log('Updated Report Data:', updatedReportData);

        // Update and return the report
        return {
            ...report,
            reportData: updatedReportData,
        };
    } catch (error) {
        console.error('Error regenerating processor report:', error);
        throw error;
    }
};

const buildMerchantIDMap = (agents) => {
    const merchantIDMap = {};
    agents.forEach(agent => {
        if (agent.clients) {
            agent.clients.forEach(client => {
                merchantIDMap[client.merchantID] = client.branchID;
            });
        }
    });
    return merchantIDMap;
};

const regenerateReportData = (report, merchantIDMap) => {
    const processorType = processorTypeMap[report.processor] || 'type1'; // Default to Type 1 if not found
    console.log(`Processor type: ${processorType}`);

    return report.reportData.map((row, index) => {
        const merchantID = row['Merchant Id']?.trim();
        if (!merchantID) {
            console.warn(`Row ${index + 1} has no Merchant ID.`);
            return row;
        }

        if (!merchantIDMap[merchantID]) {
            console.warn(`MerchantID ${merchantID} not found in map.`);
            return row;
        }

        console.log(`Updating row for MerchantID: ${merchantID}`);

        const branchID = merchantIDMap[merchantID];
        const bankSplit = 0.35; // Default bank split

        // Update row dynamically based on processor type
        switch (processorType) {
            case 'type1':
                return {
                    ...row,
                    'Branch ID': branchID,
                    'BPS': row['BPS'] || 'N/A',
                    '%': formatPercentage(bankSplit),
                    'Agent Net': calculateBankPayout(row['Net'], bankSplit).toFixed(2),
                    needsAudit: false,
                };

            case 'type2':
                return {
                    ...row,
                    'Branch ID': branchID,
                    'Bank Split': formatPercentage(bankSplit),
                    'Bank Payout': calculateBankPayout(row['Payout Amount'], bankSplit).toFixed(2),
                    needsAudit: false,
                };

            case 'type3':
                return {
                    ...row,
                    'Branch ID': branchID,
                    'Bank Split': formatPercentage(bankSplit),
                    'Bank Payout': calculateBankPayout(row['Payout Amount'], bankSplit).toFixed(2),
                    needsAudit: false,
                };

            case 'type4':
                return {
                    ...row,
                    'Branch ID': branchID,
                    '%': formatPercentage(bankSplit),
                    'Bank Payout': calculateBankPayout(row['Net'], bankSplit).toFixed(2),
                    needsAudit: false,
                };

            default:
                console.warn(`Unknown processor type: ${processorType}`);
                return row; // Leave the row unchanged
        }
    });
};

// Helper function to format percentages
const formatPercentage = (value) => `${(value * 100).toFixed(2)}%`;

// Helper function to calculate payouts
const calculateBankPayout = (amount, bankSplit) => {
    if (typeof amount === 'string') {
        amount = parseFloat(amount);
    }
    if (typeof bankSplit === 'string') {
        bankSplit = parseFloat(bankSplit) / 100; // Convert percentage to decimal
    }
    return (amount || 0) * (bankSplit || 0);
};
