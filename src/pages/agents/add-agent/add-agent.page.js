import React from 'react';
import './add-agent.page.css';

import AddAgent from '../../../components/agents/add-agent/add-agent.component';

const AddAgentPage = ({organizationID, authToken}) => {
    return (
        <div className="add-agent">
            <AddAgent authToken={authToken} organizationID={organizationID}/>
        </div>
    );
};

export default AddAgentPage;
