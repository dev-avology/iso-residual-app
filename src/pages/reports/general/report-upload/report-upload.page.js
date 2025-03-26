import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addReport } from "../../../../api/reports.api.js";
import ReusableTable from "../../../../components/general/table/table.component.js";
import Header from "../../../../components/general/header/header.component.js";
import "../../../components/report-upload/report-upload.component.css"

const ReportUploadPage = ({ authToken, organizationID }) => {
  const processors = [
    "accept.blue",
    "PAAY",
    "Rectangle Health",
    "Hyfin",
    "Shift4",
    "TRX",
    "Merchant Lynx",
    "Micamp",
    "Global",
    "Clearent",
    "Payment Advisors",
    "Fiserv Omaha",
    "Fiserv Bin & ICA",
  ];

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const [rows, setRows] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddRow = () => {
    setRows([...rows, { processor: "", file: null }]);
  };

  const handleProcessorChange = (index, value) => {
    const updatedRows = [...rows];
    updatedRows[index].processor = value;
    setRows(updatedRows);
  };

  const handleFileChange = (index, file) => {
    const updatedRows = [...rows];
    updatedRows[index].file = file;
    setRows(updatedRows);
  };

  const handleDeleteRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (rows.length === 0 || !selectedMonth || !selectedYear) {
      setUploadStatus("Please fill in all fields before uploading.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      rows.forEach((row) => {
        if (row.file && row.processor) {
          formData.append(row.processor, row.file);
        }
      });

      formData.append("month", selectedMonth);
      formData.append("year", selectedYear);

      const response = await addReport(organizationID, formData, authToken);

      if (response && response.status === 200) {
        setUploadStatus("Files uploaded successfully!");
        setLoading(false);
        navigate("/reports/all");
      } else {
        setUploadStatus("Failed to upload files.");
        setLoading(false);
      }
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
      setLoading(false);
    }
  };

  const columns = [
    {
      field: "processor",
      label: "Processor",
      render: (value, row, index) => (
        <select
          value={value}
          onChange={(e) => handleProcessorChange(index, e.target.value)}
          required
        >
          <option value="" disabled>
            Select Processor
          </option>
          {processors.map((processor) => (
            <option key={processor} value={processor}>
              {processor}
            </option>
          ))}
        </select>
      ),
    },
    {
      field: "file",
      label: "File",
      render: (value, row, index) => (
        <input
          type="file"
          accept=".csv, .xlsx"
          onChange={(e) => handleFileChange(index, e.target.files[0])}
          required
        />
      ),
    },
    {
      field: "actions",
      label: "Actions",
      render: (value, row, index) => (
        <button
          type="button"
          className="delete-btn"
          onClick={() => handleDeleteRow(index)}
        >
          <i className="fa fa-trash"></i>
        </button>
      ),
    },
  ];

  return (
    <div>
      <Header
        title="Upload Reports"
        subtitle="Manage and upload your monthly processor reports."
      />

      <div className="month-year-selection">
        <label>
          Month:
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            required
          >
            <option value="" disabled>
              Select Month
            </option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </label>

        <label>
          Year:
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            required
          >
            <option value="" disabled>
              Select Year
            </option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ReusableTable
        data={rows}
        setData={setRows}
        columns={columns}
        enableSearch={false}
        fileName="ReportUpload"
      />

      <div className="upload-actions">
        <button type="button" onClick={handleAddRow}>
          Add File
        </button>
        <button type="button" onClick={handleUpload}>
          Upload Files
        </button>
      </div>

      {uploadStatus && <p className="upload-status">{uploadStatus}</p>}

      {loading && (
        <div className="loading-popup">
          <div className="loading-spinner"></div>
          <p>Uploading... Please wait</p>
        </div>
      )}
    </div>
  );
};

export default ReportUploadPage;
