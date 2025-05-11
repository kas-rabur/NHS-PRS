import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { FaUser, FaHome, FaLock, FaEnvelope } from 'react-icons/fa';
import '../css/UserDashboard.css';

export default function ProfilePage() {
    const [prsId, setPrsId] = useState('');
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [familyMembers, setFamilyMembers] = useState([]);
    const [familyForm, setFamilyForm] = useState({
        nationalId: '',
        name: '',
        dob: '',
        address: '',
        userType: 'individual'
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [familyOpen, setFamilyOpen] = useState(false);

    // Section state
    const [section, setSection] = useState('address');
    const [addressForm, setAddressForm] = useState('');
    const [passwordForm, setPasswordForm] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [updateMessage, setUpdateMessage] = useState('');
    const [updateError, setUpdateError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('prsToken');
        if (!token) return;

        let decoded;
        try {
            decoded = jwtDecode(token);
            setPrsId(decoded.prs_id);
            setName(decoded.name);
            setDob(decoded.DOB);
        } catch {
            setError('Authentication error');
            return;
        }

        if (decoded.prs_id) {
            fetchFamily(decoded.prs_id, token);
        }
    }, []);

    // ========== API CALLS  ==========

    // 1) Fetch family members
    const fetchFamily = async (id, token) => {
        try {
            const res = await fetch('/api/getFamilyMembers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ prsId: id })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to load family members');
            }
            setFamilyMembers(data.members.filter(m => m.prsId !== id));
        } catch (err) {
            setError(err.message);
        }
    };



    const updateAddress = async () => {

        setUpdateMessage('');
        setUpdateError('');

        const token = localStorage.getItem('prsToken');
        if (!token) {
            setUpdateError('Not authenticated');
            return;
        }

        try {

            const res = await fetch('/api/updateAddress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    prsId,
                    address: addressForm,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update address');
            }

            setUpdateMessage('Address successfully updated.');
        } catch (err) {
            setUpdateError(err.message);
        }
    };

    const updatePassword = async () => {
        setUpdateMessage('');
        setUpdateError('');
        const token = localStorage.getItem('prsToken');
        try {
            const res = await fetch('/api/updatePassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    prsId,
                    oldPassword: passwordForm.current,
                    newPassword: passwordForm.new,
                    confirmPassword: passwordForm.confirm
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to change password');
            setUpdateMessage('Password successfully changed.');
        } catch (err) {
            setUpdateError(err.message);
        }
    };

    // 5) Add family member
    const addMember = async () => {
        setMessage('');
        const token = localStorage.getItem('prsToken');
        try {
            const res = await fetch('/api/addFamilyMember', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ prsId, ...familyForm })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to add family member');
            }
            setMessage(`Added: ${data.prsId}`);
            fetchFamily(prsId, token);
            setFamilyForm({
                nationalId: '',
                name: '',
                dob: '',
                address: '',
                userType: 'individual'
            });
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        }
    };

    // 6) Remove family member
    const removeMember = async id => {
        setMessage('');
        const token = localStorage.getItem('prsToken');
        try {
            const res = await fetch('/api/removeFamilyMember', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ prsId, familyMemberId: id })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to remove family member');
            }
            setMessage(`Removed: ${id}`);
            setFamilyMembers(prev => prev.filter(m => m.prsId !== id));
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        }
    };

    // ========== FORM HANDLERS ==========
    const handleAddressChange = e => setAddressForm(e.target.value);
    const handlePasswordChange = e => setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleChange = e => setFamilyForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    return (
        <div>
            {error && <p className="error-msg">{error}</p>}

            <div className="dashboard-card id-card">
                <FaUser size={48} />
                <h4>PRS Identity</h4>
                <p><strong>Name:</strong> {name}</p>
                <p><strong>ID:</strong> {prsId}</p>
                <p><strong>DOB:</strong> {dob && new Date(dob).toLocaleDateString()}</p>
            </div>

            <div className="dashboard-pair">
                <div className="dashboard-card update-card">
                    <h3>Change Information</h3>
                    <div className="button-group">
                        <button
                            className={section === 'address' ? 'btn-tab active' : 'btn-tab'}
                            onClick={() => setSection('address')}
                        >
                            <FaHome /> Address
                        </button>

                        <button
                            className={section === 'password' ? 'btn-tab active' : 'btn-tab'}
                            onClick={() => setSection('password')}
                        >
                            <FaLock /> Password
                        </button>
                    </div>

                    {section === 'address' && (
                        <div className="form-group">
                            <input
                                placeholder="New Address"
                                value={addressForm}
                                onChange={handleAddressChange}
                            />
                            <button className="btn-primary" onClick={updateAddress}>
                                Update Address
                            </button>
                        </div>
                    )}

                    {section === 'password' && (
                        <div className="form-group">
                            <input
                                name="current"
                                type="password"
                                placeholder="Current Password"
                                value={passwordForm.current}
                                onChange={handlePasswordChange}
                            />
                            <input
                                name="new"
                                type="password"
                                placeholder="New Password"
                                value={passwordForm.new}
                                onChange={handlePasswordChange}
                            />
                            <input
                                name="confirm"
                                type="password"
                                placeholder="Confirm Password"
                                value={passwordForm.confirm}
                                onChange={handlePasswordChange}
                            />
                            <button className="btn-primary" onClick={updatePassword}>
                                Change Password
                            </button>
                        </div>
                    )}

                    {updateMessage && <p className="info-msg">{updateMessage}</p>}
                    {updateError && <p className="error-msg">{updateError}</p>}
                </div>

                <div className="dashboard-card family-card">
                    <h3
                        onClick={() => setFamilyOpen(!familyOpen)}
                        style={{ cursor: 'pointer' }}
                    >
                        Family Members {familyOpen ? '▲' : '▼'}
                    </h3>
                    {familyOpen && (
                        familyMembers.length ? (
                            <ul>
                                {familyMembers.map(m => (
                                    <li key={m.prsId}>
                                        {m.name} — {m.prsId} — {new Date(m.dob).toLocaleDateString()}
                                        <button
                                            onClick={() => removeMember(m.prsId)}
                                            className="remove-button"
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No family.</p>
                        )
                    )}
                </div>
            </div>

            <div className="dashboard-card">
                <h3>Add Member</h3>
                <input
                    name="nationalId"
                    placeholder="National ID"
                    value={familyForm.nationalId}
                    onChange={handleChange}
                />
                <input
                    name="name"
                    placeholder="Name"
                    value={familyForm.name}
                    onChange={handleChange}
                />
                <input
                    name="dob"
                    type="date"
                    value={familyForm.dob}
                    onChange={handleChange}
                />
                <input
                    name="address"
                    placeholder="Address"
                    value={familyForm.address}
                    onChange={handleChange}
                />
                <select
                    name="userType"
                    value={familyForm.userType}
                    onChange={handleChange}
                >
                    <option value="individual">Individual</option>
                    <option value="child">Child</option>
                </select>
                <button className="btn-primary" onClick={addMember}>
                    Add
                </button>
                {message && <p className="info-msg">{message}</p>}
            </div>
        </div>
    );
}
