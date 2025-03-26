import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import TableWithFilters from '../../general/table/table.component';
import { updateAgent } from '../../../api/agents.api'; // using same updateAgent API

const PartnerMerchants = ({ 
  clients, 
  updatePartnerClients,
  organizationID,
  agentID,
  authToken,
  agentDetails // full agent object from parent
}) => {
  const [partnerData, setPartnerData] = useState([]);
  const [selected, setSelected] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [newMerchant, setNewMerchant] = useState({
    merchantID: '',
    merchantName: '',
    partner: '',
    partnerSplit: '',
    branchID: ''
  });

  useEffect(() => {
    const filtered = clients.filter(client => client.partner);
    setPartnerData(filtered);
  }, [clients]);

  const handleOpenModal = () => {
    setNewMerchant({
      merchantID: '',
      merchantName: '',
      partner: '',
      partnerSplit: '',
      branchID: ''
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleAddNewMerchant = () => {
    const newMerchantWithID = {
      ...newMerchant,
      merchantID: newMerchant.merchantID || Date.now().toString()
    };
    updatePartnerClients(prev => [...prev, newMerchantWithID]);
    setHasChanges(true);
    setOpenModal(false);
  };

  // Default onSave callback for row edits that updates partnerData.
  // This is used by the TableWithFilters snackbar.
  const handleSave = (updatedData) => {
    const nonPartnerClients = clients.filter(client => !client.partner);
    const updatedClients = [...nonPartnerClients, ...updatedData];
    updatePartnerClients(updatedClients);
    setHasChanges(false);
  };

  // Global save function adapted for use via TableWithFilters.
  // It now accepts updatedData from the table's snackbar.
  const handleSavePartner = async (updatedData) => {
    try {
      // Merge non-partner clients from agentDetails with the updated partner data from table.
      const nonPartnerClients = (agentDetails.clients || []).filter(client => !client.partner);
      const updatedClients = [...nonPartnerClients, ...updatedData];
      const updatedAgent = { ...agentDetails, clients: updatedClients };
      
      const response = await updateAgent(organizationID, agentID, updatedAgent, authToken);
      if(response.data?.success) {
        alert('Partner merchants saved successfully!');
        setHasChanges(false);
      } else {
        alert('Failed to save partner merchants.');
      }
    } catch (err) {
      alert('Failed to save partner merchants.');
    }
  };

  const columns = [
    { field: "merchantID", label: "Merchant ID", type: "text" },
    { field: "merchantName", label: "Merchant Name", type: "text" },
    { field: "partner", label: "Partner", type: "text" },
    { field: "partnerSplit", label: "Partner Split (%)", type: "text" },
    { field: "branchID", label: "Branch ID", type: "text" },
  ];

  const actions = [
    {
      name: 'Add Merchant',
      onClick: handleOpenModal,
    }
  ];

  return (
    <div>
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Add Partner Merchant</DialogTitle>
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
          {/* Additional fields */}
          <TextField
            margin="dense"
            label="Partner"
            type="text"
            fullWidth
            variant="outlined"
            value={newMerchant.partner}
            onChange={(e) =>
              setNewMerchant({ ...newMerchant, partner: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Partner Split (%)"
            type="text"
            fullWidth
            variant="outlined"
            value={newMerchant.partnerSplit}
            onChange={(e) =>
              setNewMerchant({ ...newMerchant, partnerSplit: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Branch ID"
            type="text"
            fullWidth
            variant="outlined"
            value={newMerchant.branchID}
            onChange={(e) =>
              setNewMerchant({ ...newMerchant, branchID: e.target.value })
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

      <TableWithFilters
        data={partnerData}
        setData={setPartnerData}
        idField="merchantID"
        columns={columns}
        enableSearch={true}
        selected={selected}
        setSelected={setSelected}
        approvalAction={true}
        fileName="partner_merchants.csv"
        hasChanges={hasChanges}
        setHasChanges={setHasChanges}
        // Use the table component's snackbar save by passing our global save callback.
        onSave={handleSavePartner}
        totalFields={[]}
        actions={actions}
      />
    </div>
  );
};

export default PartnerMerchants;
