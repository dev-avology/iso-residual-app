import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

const EditDialog = ({ open, onClose, onSave, fields }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    // Initialize form data with default values
    const initialData = fields.reduce((acc, field) => {
      acc[field.field] = field.defaultValue;
      return acc;
    }, {});
    setFormData(initialData);
  }, [fields]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to format currency values for display
  const formatCurrencyForDisplay = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return numValue.toFixed(2);
  };

  const handleSubmit = () => {
    let dataToSave = { ...formData };
    // If splits_section exists, move it to splits
    if (dataToSave.splits_section) {
      dataToSave.splits = dataToSave.splits_section;
      delete dataToSave.splits_section;
    }
    onSave(dataToSave);
  };

  
  const renderField = (field) => {
    console.log('field.component',field.component);
    
    // Define currency fields that should show dollar sign
    const currencyFields = [
      'Expenses', 'Income', 'Net', 'BPS', 'Sales Amount', 
      'Agent Net', 'Bank Payout', 'Payout Amount', 'Volume', 
      'Sales', 'Refunds', 'Reject Amount', 'Fee', 'Total',
      'Setup Fee ISO', 'Monthly Gateway Fee ISO', 'Transaction Fee ISO',
      'ISO Total', 'lineItemAmount', 'lineItemPrice',
      'totalSalesAmount', 'totalIncome', 'totalExpenses', 'totalNet', 'totalAgentNet'
    ];
    const isCurrencyField = currencyFields.includes(field.label) || currencyFields.includes(field.field);
    
    // Define integer fields
    const integerFields = ['Transaction', 'Transactions', 'Transaction Count', 'lineItemQuantity', 'totalTransactions'];
    const isIntegerField = integerFields.includes(field.label) || integerFields.includes(field.field);
    
    switch (field.type) {
      case 'select':
        return (
          <FormControl fullWidth variant="outlined">
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={formData[field.field] || ''}
              onChange={(e) => handleChange(field.field, e.target.value)}
              label={field.label}
            >
              {field.options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'boolean':
        return (
          <TextField
            fullWidth
            label={field.label}
            type="checkbox"
            checked={formData[field.field] || false}
            onChange={(e) => handleChange(field.field, e.target.checked)}
            variant="outlined"
          />
        );
      case 'custom':
        // console.log('formData[field.field]',formData[field.field]);
        return field.component?.({
          value: formData[field.field],
          onChange: (value) => handleChange(field.field, value)
        });
      default:
        return (
          <TextField
            fullWidth
            label={field.label}
            type={isIntegerField ? 'number' : (field.type || 'text')}
            value={isCurrencyField ? formatCurrencyForDisplay(formData[field.field]) : (formData[field.field] || '')}
            onChange={(e) => {
              let value;
              if (isCurrencyField) {
                // Remove dollar sign and commas for currency fields
                const cleanValue = e.target.value.replace(/[$,]/g, '');
                value = parseFloat(cleanValue) || 0;
              } else if (isIntegerField) {
                // Integer field
                value = parseInt(e.target.value) || 0;
              } else if (field.type === 'number') {
                value = parseFloat(e.target.value) || 0;
              } else {
                value = e.target.value;
              }
              handleChange(field.field, value);
            }}
            InputProps={{
              startAdornment: isCurrencyField ? '$' : null,
            }}
            variant="outlined"
          />
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth className='pop-form'>
      <DialogTitle className='pb-6 mb-6 border-b border-yellow-400/20'>Edit Details</DialogTitle>
      <DialogContent className='pop-form-wrap'>
        <Box sx={{ mt: 2 }}>
          {fields.map((field) => (
            <Box key={field.field} sx={{ mb: 2 }}>
              {renderField(field)}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} className='text-yellow-400 cncl'>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" className=' cncl-btn text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400'>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;
