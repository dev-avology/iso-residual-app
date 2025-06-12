import React from 'react';
import { useParams } from 'react-router-dom';
import ProcessorSummaryReportViewer from '../../../../components/reports/processor/processor-summary-report-viewer/processor-summary-report-viewer.component.js';
import { jwtDecode } from 'jwt-decode';

const ProcessorSummaryReportViewerPage = ({ authToken, organizationID }) => {
    const {monthYear } = useParams();

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
    <div className="processor-summary-report-viewer">
      <ProcessorSummaryReportViewer authToken={authToken} organizationID={organizationID} monthYear={monthYear}  
      userID={userID}
      />
    </div>
  );
};

export default ProcessorSummaryReportViewerPage;
