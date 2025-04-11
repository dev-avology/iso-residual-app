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

  const handleSubmit = () => {
    onSave(formData);
  };

  const renderField = (field) => {
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
        return field.component?.({
          value: formData[field.field],
          onChange: (value) => handleChange(field.field, value)
        });
      default:
        return (
          <TextField
            fullWidth
            label={field.label}
            type={field.type || 'text'}
            value={formData[field.field] || ''}
            onChange={(e) => handleChange(field.field, e.target.value)}
            variant="outlined"
          />
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Details</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {fields.map((field) => (
            <Box key={field.field} sx={{ mb: 2 }}>
              {renderField(field)}
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
