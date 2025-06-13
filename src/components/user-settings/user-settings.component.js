import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { updateUser, getUser } from "../../api/users.api";
import "./user-settings.component.css";
import { jwtDecode } from "jwt-decode";

const UserSettings = ({
  authToken,
  organizationID,
  username,
  setUsername,
  isAdmin,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
  const [showManageTeam, setShowManageTeam] = useState(isAdmin); // Initialize with isAdmin
  const [validationErrors, setValidationErrors] = useState({});
  const [validationPasswordErrors, setValidationPasswordErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [passSuccessMessage, setPassSuccessMessage] = useState('');

  const decodedToken = jwtDecode(authToken);
  const user_id = decodedToken.user_id;
  const iso_token = localStorage.getItem("iso_token");

  // if(isChangePasswordVisible){
  //   setPassSuccessMessage(''); // Clear any existing success message
  //   setValidationPasswordErrors({}); // Clear any existing validation errors
  // }
  useEffect(() => {
    if(isChangePasswordVisible){
      setPassSuccessMessage('');
      setValidationPasswordErrors({});
    }
  }, [isChangePasswordVisible])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await fetch(
          `${process.env.REACT_APP_ISO_BACKEND_URL}/user/get-user-details`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${iso_token}`,
            },

            body: JSON.stringify({ user_id: user_id }),
          }
        );

        const userData = await userResponse.json();
        if (userData) {
          setFirstName(userData.data.first_name);
          setLastName(userData.data.last_name);
          setEmail(userData.data.email);
          setPhone(userData.data.phone);
        }

        if (!userResponse.ok) {
          throw new Error(userData.message || "Failed to fetch user");
        }
        // try {
        //   const user = await getUser(organizationID, username, authToken);
        //   setNewEmail(user.email);
        //   setNewUsername(user.username); // Update username as well in case it changes
        // } catch (error) {
        //   console.error('Error fetching user data: ', error);
        // }
      } catch (error) {
        console.error("Error updating profile: ", error);
      }
    };

    fetchUserData();
  }, [organizationID, username, authToken]);

  // Ensure showManageTeam gets updated as soon as isAdmin changes
  useEffect(() => {
    setShowManageTeam(isAdmin); // Update showManageTeam based on the latest value of isAdmin
  }, [isAdmin]);

  const handleProfileUpdate = async () => {
    setSuccessMessage(''); // Clear any existing success message
    setValidationErrors({}); // Clear any existing validation errors
    
    const updatedUser = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      user_id: user_id
    };

    try {
      const userResponse = await fetch(
        `${process.env.REACT_APP_ISO_BACKEND_URL}/user/update-user-info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${iso_token}`,
          },
          body: JSON.stringify(updatedUser),
        }
      );

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        // Handle validation errors
        if (userData.errors) {
          setValidationErrors(userData.errors);
          return; // Stop here if there are validation errors
        }
        throw new Error(userData.message || 'Failed to create user');
      }
      console.log('userData',userData);
      setSuccessMessage('Profile updated successfully!');
      setValidationErrors({}); // Clear any validation errors on success

    } catch (error) {
      console.error("Error updating profile: ", error);
      setValidationErrors({ general: [error.message] });
    }

    // try {
    //   // setUsername(newUsername); // Update username in case it changes
    //   // setNewEmail(newEmail); // Update email in case it changes
    //   await updateUser(organizationID, username, updatedUser, authToken);
    //   alert('Profile updated successfully');
    // } catch (error) {
    //   console.error('Error updating profile: ', error);
    // }
  };

  const handleChangePassword = async () => {
    setPassSuccessMessage(''); // Clear any existing success message
    setValidationPasswordErrors({}); // Clear any existing validation errors
    
    if (newPassword !== confirmPassword) {
      setValidationPasswordErrors({ general: ['New password and confirm password do not match'] });
      return;
    }

    const updatedUser = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      user_id: user_id,
      // current_password: currentPassword,
      new_password: newPassword,
      // confirm_password: confirmPassword
    };

    try {
      const userResponse = await fetch(
        `${process.env.REACT_APP_ISO_BACKEND_URL}/user/update-user-info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${iso_token}`,
          },
          body: JSON.stringify(updatedUser),
        }
      );

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        // Handle validation errors
        if (userData.errors) {
          setValidationPasswordErrors(userData.errors);
          return;
        }
        // Handle current password error specifically
        if (userData.message?.toLowerCase().includes('current password')) {
          setValidationPasswordErrors({ general: ['Current password is incorrect'] });
          return;
        }
        throw new Error(userData.message || 'Failed to update password');
      }

      setPassSuccessMessage('Password updated successfully!');
      setValidationPasswordErrors({});
      
      // Clear password fields
      // setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangePasswordVisible(true);

    } catch (error) {
      console.error("Error updating password: ", error);
      setValidationPasswordErrors({ general: [error.message] });
    }
  };

  const toggleChangePassword = () => {
    setIsChangePasswordVisible(!isChangePasswordVisible);
    // Clear all password related messages
    setPassSuccessMessage('');
    setValidationPasswordErrors({});
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="user-settings-main p-6">
      <div className="user-settings-container">
        <h2>User Settings</h2>

        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            value={firstName}
            required
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Last Name</label>
          <input
            type="text"
            value={lastName}
            required
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {validationErrors.email && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.email[0]}</p>
          )}
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="phone"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {successMessage && (
          <div className="text-green-500 text-base font-semibold mt-2 mb-4">
            {successMessage}
          </div>
        )}


        {validationErrors.general && (
          <div className="text-red-500 text-sm mt-2 mb-4">
            {validationErrors.general[0]}
          </div>
        )}

        <button className="save-button" onClick={handleProfileUpdate}>
          Save Profile
        </button>

        <button
          className="toggle-password-button"
          onClick={() => setIsChangePasswordVisible(!isChangePasswordVisible)}
        >
          {isChangePasswordVisible ? "Hide Change Password" : "Change Password"}
        </button>

        {isChangePasswordVisible && (
          <>
            <h3 className="mt-2">Change Password</h3>
            {passSuccessMessage && (
            <div className="text-green-500 text-center font-semibold mt-2 mb-4">
              {passSuccessMessage}
            </div>
          )}
            {/* <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div> */}
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

            {validationPasswordErrors.general && (
              <div className="text-red-500 text-sm mt-2 mb-4">
                {validationPasswordErrors.general[0]}
              </div>
            )}

            </div>
            <button className="save-button" onClick={handleChangePassword}>
              Change Password
            </button>
          </>
        )}

        {showManageTeam && (
          <div className="manage-users-link">
            <Link to="/manage-team" className="manage-team-button">
              Manage Team
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSettings;
