import React from 'react';
import { useParams } from 'react-router-dom';
import ProcessorSummaryReportViewer from '../../../../components/reports/processor/processor-summary-report-viewer/processor-summary-report-viewer.component.js';


const ProcessorSummaryReportViewerPage = ({ authToken, organizationID }) => {
    const {monthYear } = useParams();

  return (
    <div className="processor-summary-report-viewer">
      <ProcessorSummaryReportViewer authToken={authToken} organizationID={organizationID} monthYear={monthYear}  
      />
    </div>
  );
};

export default ProcessorSummaryReportViewerPage;
