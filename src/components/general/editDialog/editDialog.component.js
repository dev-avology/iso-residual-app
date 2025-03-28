import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
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

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Details</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {fields.map((field) => (
            <Box key={field.field} sx={{ mb: 2 }}>
              {field.type === 'custom' && field.component ? (
                field.component({
                  value: formData[field.field],
                  onChange: (value) => handleChange(field.field, value)
                })
              ) : (
                <TextField
                  fullWidth
                  label={field.label}
                  type={field.type === 'boolean' ? 'checkbox' : field.type || 'text'}
                  value={formData[field.field]}
                  onChange={(e) => handleChange(field.field, e.target.value)}
                  variant="outlined"
                />
              )}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;
