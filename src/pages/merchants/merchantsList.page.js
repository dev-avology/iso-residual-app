import React, { useEffect, useState } from "react";
import List from "../../components/general/list/list.component";
import { getMerchants } from "../../api/merchants.api";

const MerchantListPage = () => {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch merchant data
  useEffect(() => {
    const loadMerchants = async () => {
      try {
        const response = await getMerchants();
        if (response?.data) {
          setMerchants(response.data);
        }
      } catch (err) {
        setError("Failed to fetch merchants");
      } finally {
        setLoading(false);
      }
    };

    loadMerchants();
  }, []);

  // Columns for the table
  const columns = [
    { field: "mid", label: "MID" },
    { field: "name", label: "Merchant Name" },
    { field: "opened", label: "Opened" },
    { field: "closed", label: "Closed" },
    { field: "group", label: "Group" },
    { field: "processor", label: "Processor" },
    { field: "status", label: "Status" },
    { field: "active", label: "Active" },
  ];

  // Filters configuration
  const filtersConfig = [
    { field: "name", label: "Search by Name", type: "text" },
    {
      field: "status",
      label: "Status",
      type: "select",
      options: ["All", "Open", "Closed"],
    },
    {
      field: "group",
      label: "Group",
      type: "text",
    },
    {
      field: "processor",
      label: "Processor",
      type: "text",
    },
  ];

  // Actions for each row
  const actions = [
    {
      label: "View",
      icon: "👁️",
      onClick: (row) => alert(`Viewing details for ${row.name}`),
    },
    {
      label: "Deactivate",
      icon: "🔒",
      onClick: (row) => {
        alert(`Deactivating merchant: ${row.name}`);
        setMerchants((prev) =>
          prev.map((merchant) =>
            merchant.mid === row.mid
              ? { ...merchant, status: "Closed", active: "No" }
              : merchant
          )
        );
      },
    },
  ];

  if (loading) return <p>Loading merchants...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Merchant List</h1>
      <List
        data={merchants}
        setData={setMerchants}
        columns={columns}
        filtersConfig={filtersConfig}
        actions={actions}
        idField="mid"
        enableSearch={true}
        fileName="merchant_list"
      />
    </div>
  );
};

export default MerchantListPage;
