import React, { useState, useEffect } from 'react';
import { FaEye, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { confirmAlert } from 'react-confirm-alert'; // Import confirmAlert
// api
import { getReports, deleteReport } from '../../../api/reports.api';
// styles
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css for confirm-alert
import './reports-list.component.css'; // Reuse this CSS file for styling

const ReportsList = ({ authToken, organizationID, type }) => {
    const [reports, setReports] = useState([]); // Initialize as an array
    const [filteredReports, setFilteredReports] = useState([]); // Initialize as an array
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [reportType, setReportType] = useState(type); // Default report type
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const reportsPerPage = 10;
    const navigate = useNavigate(); // Initialize the useNavigate hook

    useEffect(() => {
        if (authToken && organizationID) {
            fetchReports();
        }
    }, [authToken, organizationID, reportType]); // Fetch reports when authToken, organizationID, or reportType changes

    useEffect(() => {
        filterReports();
    }, [filterMonth, filterYear, reports]);

    const fetchReports = async () => {
        try {
            setLoading(true); // Set loading to true before fetching
            const data = await getReports(organizationID, reportType, authToken);
            setReports(Array.isArray(data) ? data : []); // Ensure it's an array
            setFilteredReports(Array.isArray(data) ? data : []); // Ensure it's an array
        } catch (error) {
            console.error(`Error fetching ${reportType} reports:`, error);
        } finally {
            setLoading(false); // Stop loading after data is fetched
        }
    };

    const filterReports = () => {
        let filtered = reports;

        if (filterMonth) {
            filtered = filtered.filter(report => report.month.includes(filterMonth));
        }

        if (filterYear) {
            filtered = filtered.filter(report => report.year === filterYear);
        }

        setFilteredReports(filtered);
        setCurrentPage(1); // Reset to the first page after filtering
    };

    const handleView = (reportID) => {
        navigate(`/report/${reportID}`);
    };

    const handleDelete = async (reportID) => {
        try {
            confirmAlert({
                title: 'Confirm to delete',
                message: 'Are you sure you want to delete this report? This action can\'t be undone.',
                buttons: [
                    {
                        label: 'Yes',
                        onClick: async () => {
                            try {
                                await deleteReport(reportID, authToken);
                                setReports(reports.filter(report => report.reportID !== reportID));
                            } catch (err) {
                                setError('Failed to delete report');
                            }
                        }
                    },
                    {
                        label: 'No'
                    }
                ]
            });
        } catch (error) {
            console.error('Error deleting report:', error);
        }
    };

    const handleUploadClick = () => {
        navigate('/upload-report');
    };

    // Pagination logic
    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    
    // Ensure currentReports is always an array
    const currentReports = Array.isArray(filteredReports) ? filteredReports.slice(indexOfFirstReport, indexOfLastReport) : [];

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) {
        return <div className="report-list"><p>Loading...</p></div>; // Display loading state
    }

    return (
        <div className="report-list">
            <div className="header">
                <h2>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Reports</h2>
                <button onClick={handleUploadClick}>Go to Report Upload</button>
            </div>
            <div className="filters">
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                    <option value="">All Months</option>
                    {/* Month options */}
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                        <option key={month} value={month}>{month}</option>
                    ))}
                </select>
                <input
                    type="number"
                    placeholder="Year"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                />
                <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                    <option value="billing">Billing Reports</option>
                    <option value="ar">AR Reports</option>
                    <option value="processor">Processor Reports</option>
                    {/* Add more report types here as needed */}
                </select>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Processor</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentReports.map((report) => (
                        <tr key={report.reportID}>
                            <td>{report.month}</td>
                            <td>{report.processor}</td>
                            <td>
                                <button className="btn-view" onClick={() => handleView(report.reportID)}>
                                    <FaEye />
                                </button>
                                <button className="btn-delete" onClick={() => handleDelete(report.reportID)}>
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="pagination">
                {[...Array(Math.ceil(filteredReports.length / reportsPerPage)).keys()].map(number => (
                    <button
                        key={number + 1}
                        onClick={() => paginate(number + 1)}
                        className={currentPage === number + 1 ? 'active' : ''}
                    >
                        {number + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ReportsList;
