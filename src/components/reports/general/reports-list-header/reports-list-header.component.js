import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReportsListHeader = ({ 
  filterMonth, 
  filterYear, 
  setFilterMonth, 
  setFilterYear, 
  reportType, 
  setReportType, 
  searchTerm, 
  setSearchTerm, 
  onUploadClick 
}) => {
    const navigate = useNavigate();

    const handleUploadClick = () => {
        navigate('/upload-report');
    };

    // Generate years from 2020 to the current year dynamically
    const getYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = 2020; year <= currentYear; year++) {
            years.push(year);
        }
        return years;
    };

    return (
        <div className="reports-header">
            <div className="header">
                <h2>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Reports</h2>
                <button onClick={handleUploadClick}>Go to Report Upload</button>
            </div>

            <div className="filters">
                {/* Month filter */}
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                    <option value="">All Months</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                        <option key={month} value={month}>{month}</option>
                    ))}
                </select>

                {/* Year filter */}
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                    <option value="">All Years</option>
                    {getYears().map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>

                {/* Report type filter */}
                <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                    <option value="all">All Reports</option>
                    <option value="agent">Agent Reports</option>
                    <option value="agent-summary">Agent Summary Reports</option> {/* New Agent Summary Reports Option */}
                    <option value="ar">AR Reports</option>
                    <option value="bank-summary">Bank Summary Reports</option>
                    <option value="billing">Billing Reports</option>
                    <option value="processor">Processor Reports</option>
                    <option value="processor-summary">Processor Summary Reports</option>
                </select>

                {/* Search field */}
                <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
    );
};

export default ReportsListHeader;
