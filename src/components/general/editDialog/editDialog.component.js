import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

const EditDialog = ({ 
  open, 
  onClose, 
  fields, // Array of field configurations: [{ label, field, type, defaultValue, handleInputChange }]
  onSave // Function to handle the save action
}) => {
  const [formValues, setFormValues] = useState(
    fields.reduce((acc, field) => {
      acc[field.field] = field.defaultValue || ""; // Set default values if provided
      return acc;
    }, {})
  );

  const handleChange = (field, value) => {
    // If there's a custom input handler for this field, use it
    const fieldConfig = fields.find(f => f.field === field);
    if (fieldConfig?.handleInputChange) {
      const processedValue = fieldConfig.handleInputChange(field, value);
      setFormValues((prev) => ({ ...prev, [field]: processedValue }));
    } else {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = () => {
    onSave(formValues); // Pass form values to the save function
    onClose(); // Close the dialog after saving
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            marginTop: 1,
          }}
        >
          {fields.map((field) => (
            <React.Fragment key={field.field}>
              {field.type === "boolean" ? (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!formValues[field.field]}
                      onChange={(e) =>
                        handleChange(field.field, e.target.checked)
                      }
                    />
                  }
                  label={field.label}
                />
              ) : (
                <TextField
                  label={field.label}
                  type={field.type || "text"}
                  value={formValues[field.field]}
                  onChange={(e) => handleChange(field.field, e.target.value)}
                  fullWidth
                  multiline={field.type === "textarea"}
                  rows={field.type === "textarea" ? 4 : 1}
                  inputProps={{ 
                    pattern: field.type === "number" ? "[0-9.]*" : undefined,
                    inputMode: field.type === "number" ? "numeric" : undefined
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;
