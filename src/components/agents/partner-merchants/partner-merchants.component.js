import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Typography } from '@mui/material';
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
    partners: [{ name: '', split: '' }], // Array of partners with their splits
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
      partners: [{ name: '', split: '' }],
      branchID: ''
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Add a new partner row
  const handleAddPartner = () => {
    setNewMerchant(prev => ({
      ...prev,
      partners: [...prev.partners, { name: '', split: '' }]
    }));
  };

  // Remove a partner row
  const handleRemovePartner = (index) => {
    setNewMerchant(prev => ({
      ...prev,
      partners: prev.partners.filter((_, i) => i !== index)
    }));
  };

  // Update partner name or split
  const handlePartnerChange = (index, field, value) => {
    setNewMerchant(prev => ({
      ...prev,
      partners: prev.partners.map((partner, i) => 
        i === index ? { ...partner, [field]: value } : partner
      )
    }));
  };

  const handleAddNewMerchant = () => {
    // Validate all partners have names and valid splits
    const isValid = newMerchant.partners.every(partner => 
      partner.name.trim() !== '' && 
      (partner.split === '' || (parseFloat(partner.split) >= 0 && parseFloat(partner.split) <= 100))
    );

    if (!isValid) {
      alert('Please fill in all partner names and ensure splits are between 0 and 100');
      return;
    }

    const newMerchantWithID = {
      ...newMerchant,
      merchantID: newMerchant.merchantID || Date.now().toString(),
      partners: newMerchant.partners.map(partner => ({
        ...partner,
        split: partner.split ? `${partner.split}%` : '0%'
      }))
    };
    updatePartnerClients(prev => [...prev, newMerchantWithID]);
    setHasChanges(true);
    setOpenModal(false);
  };

  // Add validation function for partner split
  const handlePartnerSplitChange = (index, value) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // If empty, set empty string
    if (numericValue === '') {
      handlePartnerChange(index, 'split', '');
      return;
    }

    // Convert to number and ensure it's between 0 and 100
    const numValue = parseFloat(numericValue);
    if (numValue >= 0 && numValue <= 100) {
      handlePartnerChange(index, 'split', numValue);
    }
  };

  // Global save function adapted for use via TableWithFilters.
  // It now accepts updatedData from the table's snackbar.
  const handleSavePartner = async (updatedData) => {
    try {
      // Get existing non-partner clients
      const nonPartnerClients = (agentDetails.clients || []).filter(client => !client.partner && !client.partners);
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
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
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
          
          {/* Partners Section */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Typography variant="subtitle1">Partners</Typography>
              <Button 
                size="small" 
                onClick={handleAddPartner}
                variant="outlined"
                color="primary"
              >
                Add Partner
              </Button>
            </div>
            
            {newMerchant.partners.map((partner, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <TextField
                  margin="dense"
                  label="Partner Name"
                  type="text"
                  style={{ width: '70%' }}
                  variant="outlined"
                  value={partner.name}
                  onChange={(e) => handlePartnerChange(index, 'name', e.target.value)}
                />
                <TextField
                  margin="dense"
                  label="Split (%)"
                  type="text"
                  style={{ width: '30%' }}
                  variant="outlined"
                  value={partner.split}
                  onChange={(e) => handlePartnerSplitChange(index, e.target.value)}
                  helperText="0-100"
                  inputProps={{ 
                    pattern: "[0-9.]*",
                    inputMode: "numeric"
                  }}
                />
                <Button
                  size="small"
                  onClick={() => handleRemovePartner(index)}
                  color="error"
                  style={{ marginTop: '8px' }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

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
          <Button 
            onClick={handleAddNewMerchant} 
            color="primary"
            disabled={!newMerchant.merchantID || !newMerchant.merchantName || newMerchant.partners.length === 0}
          >
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
