import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import TableWithFilters from '../../general/table/table.component';

const AgentMerchants = ({ clients, updateAgentClients }) => {
  // Local state holds only agent merchants (non-partner)
  const [agentData, setAgentData] = useState([]);
  const [selected, setSelected] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Modal state and form data for adding a new merchant
  const [openModal, setOpenModal] = useState(false);
  const [newMerchant, setNewMerchant] = useState({
    merchantID: '',
    merchantName: '',
  });

  // Update local agent data whenever the parent's clients change.
  // (Only non-partner merchants are shown here.)
  useEffect(() => {
    const filtered = clients.filter(client => !client.partner);
    setAgentData(filtered);
  }, [clients]);

  // Open the add merchant modal and reset the form values.
  const handleOpenModal = () => {
    setNewMerchant({
      merchantID: '',
      merchantName: '',
    });
    setOpenModal(true);
  };

  // Close the modal without adding a merchant.
  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Add the new merchant from the modal form.
  const handleAddNewMerchant = () => {
    // If no merchant ID is provided, generate a temporary one using Date.now().
    const newMerchantWithID = {
      ...newMerchant,
      merchantID: newMerchant.merchantID || Date.now().toString(),
    };
    setAgentData(prev => [...prev, newMerchantWithID]);
    setHasChanges(true);
    setOpenModal(false);
  };

  // onSave callback from TableWithFilters.
  // Merge updated agent data with the partner clients, then update the parent.
  const handleSave = (updatedData) => {
    const partnerClients = clients.filter(client => client.partner);
    const updatedClients = [...partnerClients, ...updatedData];
    updateAgentClients(updatedClients);
    setHasChanges(false);
  };

  // Define the columns for the agent merchants table.
  const columns = [
    { field: 'merchantID', label: 'Merchant ID', type: 'text' },
    { field: 'merchantName', label: 'Merchant Name', type: 'text' },
  ];

  // Define the actions dropdown items.
  // In this case, we only have the "Add Merchant" action.
  const actions = [
    {
      name: 'Add Merchant',
      onClick: handleOpenModal,
    }
  ];

  return (
    <div>
      {/* Modal Dialog for Adding an Agent Merchant */}
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Add Agent Merchant</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Merchant ID"
            type="text"
            fullWidth
            variant="outlined"
            value={newMerchant.merchantID}
            onChange={(e) =>
              setNewMerchant({ ...newMerchant, merchantID: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Merchant Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newMerchant.merchantName}
            onChange={(e) =>
              setNewMerchant({ ...newMerchant, merchantName: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddNewMerchant} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reusable Table with Filters */}
      <TableWithFilters
        data={agentData}
        setData={setAgentData}
        idField="merchantID"
        columns={columns}
        enableSearch={true}
        selected={selected}
        setSelected={setSelected}
        // Setting approvalAction to true renders an actions column (for editing/deleting)
        approvalAction={true}
        fileName="agent_merchants.csv"
        hasChanges={hasChanges}
        setHasChanges={setHasChanges}
        onSave={handleSave}
        totalFields={[]}  // Add field keys here if you need totals for any numeric columns
        actions={actions} // Pass the actions dropdown items to the table
      />
    </div>
  );
};

export default AgentMerchants;
