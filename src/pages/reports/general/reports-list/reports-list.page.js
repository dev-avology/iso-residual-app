import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import './reports-list.page.css';

// Importing Components
import ReportsList from '../../../../components/reports/general/reports-list/reports-list.component.js';
import ReportsListHeader from '../../../../components/reports/general/reports-list-header/reports-list-header.component.js';
import AgentReportsList from '../../../../components/reports/agent/agent-reports-list/agent-reports-list.component.js';
import ProcessorSummaryReportsList from '../../../../components/reports/processor/processor-summary-reports-list/processor-summary-reports-list.component.js';
import AgentSummaryReportsList from '../../../../components/reports/agent/agent-summary-reports-list/agent-summary-reports-list.component.js';
import BankSummaryReportsList from '../../../../components/reports/bank/bank-summary-reports-list/bank-summary-reports-list.component.js';
import { jwtDecode } from 'jwt-decode';

const ReportsPage = ({ organizationID, authToken }) => {
    const { type } = useParams();
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [reportType, setReportType] = useState(type || 'billing'); // Default to 'billing' if type is not provided
    const [searchTerm, setSearchTerm] = useState(''); // New state for search input
    const [uniqueFirstNames , setUniqueFirstNames] = useState('');
    const [uniqueProcessor , setUniqueProcessor] = useState('');

    console.log(uniqueProcessor,'uniqueFirstProcessor from listing');
    console.log(reportType,'reportType from listing');

    const handleUploadClick = () => {
        // Logic for handling "Go to Report Upload" button click
    };

    const token = localStorage.getItem('authToken');
    const decodedToken = jwtDecode(token);
    const userId = decodedToken?.user_id || '';
    const roleId = decodedToken?.roleId || '';

    let userID = '';

    // Add userId to formData if condition is met
    if (decodedToken && (userId !== '') && (roleId !== 1 && roleId !== 2)) {
       userID = userId
    }

    return (
        <div className="reports-page p-6">
             <div className="reports-page-wrap max-w-7xl mx-auto bg-zinc-900 rounded-lg shadow-sm p-6 mb-8">
            <ReportsListHeader
                reportType={reportType}
                setReportType={setReportType}
                filterMonth={filterMonth}
                setFilterMonth={setFilterMonth}
                filterYear={filterYear}
                setFilterYear={setFilterYear}
                searchTerm={searchTerm} // Pass the search term state
                setSearchTerm={setSearchTerm} // Pass the function to update the search term
                onUploadClick={handleUploadClick}
                uniqueFirstNames={uniqueFirstNames}
                uniqueProcessor={uniqueProcessor}
                userID= {userID}
            />
            {/* Based on the report type, render the appropriate report list */}
            {reportType === 'agent' ? (
                <div>
                    <AgentReportsList 
                        authToken={authToken} 
                        organizationID={organizationID} 
                        searchTerm={searchTerm} // Pass search term to AgentReportsList
                        filterMonth={filterMonth}
                        filterYear={filterYear}
                        setUniqueFirstNames={setUniqueFirstNames}
                        userID={userID}
                    />
                </div>
            ) : reportType === 'processor-summary' ? (
                <div>
                    <ProcessorSummaryReportsList
                        authToken={authToken}
                        organizationID={organizationID}
                        filterMonth={filterMonth}
                        filterYear={filterYear}
                        userID={userID}
                    />
                </div>
            ) : reportType === 'agent-summary' ? ( // New case for agent summary report
                <div>
                    <AgentSummaryReportsList
                        authToken={authToken}
                        organizationID={organizationID}
                        filterMonth={filterMonth}
                        filterYear={filterYear}
                        userID={userID}
                    />
                </div>
            ) : reportType === 'bank-summary' ? (
                <div>
                    <BankSummaryReportsList
                        authToken={authToken}
                        organizationID={organizationID}
                        filterMonth={filterMonth}
                        filterYear={filterYear}
                        userID={userID}
                    />
                </div>
            ) : (
                <ReportsList
                    authToken={authToken}
                    organizationID={organizationID}
                    type={reportType}
                    filterMonth={filterMonth}
                    filterYear={filterYear}
                    searchTerm={searchTerm} // Pass search term to ReportsList
                    setUniqueProcessor={setUniqueProcessor}
                />
            )}
            </div>
        </div>
    );
};

export default ReportsPage;
