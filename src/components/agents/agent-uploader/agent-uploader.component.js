import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAgents } from '../../../api/agents.api'; // This is the API call to upload the file
import './agent-uploader.component.css';

const AgentUploader = ({ authToken, organizationID }) => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setUploadStatus('Please select a file to upload.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('agents', file);

    try {
      const response = await uploadAgents(organizationID, formData, authToken);
      
      if (response && response.status === 200) {
        const { needsAudit, rejectedMerchants } = response.data;

        // Log to confirm data content
        console.log("needsAudit data:", needsAudit);
        console.log("rejectedMerchants data:", rejectedMerchants);

        setUploadStatus('File uploaded successfully!');
        
        setTimeout(() => {
          // Redirect to needs-audit page with needsAudit and rejectedMerchants data
          navigate('/needs-audit', {
            state: { needsAudit, rejectedMerchants },
          });
        }, 1000);
      } else {
        setUploadStatus('Failed to upload the file.');
      }
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agent-upload-container">
      <h2>Upload Agent List</h2>

      <form onSubmit={handleUpload}>
        <div className="file-input-container">
          <label htmlFor="fileUpload">Choose file:</label>
          <input
            type="file"
            id="fileUpload"
            accept=".csv, .xlsx"
            onChange={handleFileChange}
          />
        </div>

        {file && (
          <div className="file-info">
            <p>Selected file: {file.name}</p>
          </div>
        )}

        <button type="submit" className="upload-btn">
          Upload File
        </button>
      </form>

      {uploadStatus && <p className="upload-status">{uploadStatus}</p>}

      {/* Loading Popup */}
      {loading && (
        <div className="loading-popup">
          <div className="loading-spinner"></div>
          <p>Uploading... Please wait</p>
        </div>
      )}
    </div>
  );
};

export default AgentUploader;
