import React, { useState, useEffect } from 'react';
import { teamService } from '../services/teamService';
import './Teams.css';

function Teams() {
    const [teams, setTeams] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTeam, setNewTeam] = useState({
        name: '',
        players: [{
            first_name: '',
            last_name: ''
        }]
    });
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch teams on component mount
    useEffect(() => {
        fetchTeams(); // Ensure teams are set after fetching
    }, []);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const data = await teamService.getTeams();
            setTeams(data);
        } catch (err) {
            setError('Failed to load teams');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTeam(prev => ({
            ...prev,
            name: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateTeam()) return;

        try {
            setLoading(true);
            await teamService.createTeam(newTeam);
            setNewTeam({
                name: '',
                players: [{
                    first_name: '',
                    last_name: ''
                }]
            });
            setSuccessMessage('Team created successfully');
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
            fetchTeams();
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const deleteTeam = async (teamId) => {
        try {
            setLoading(true);
            await teamService.deleteTeam(teamId);
            setTeams(prev => prev.filter(team => team.id !== teamId));
            setSuccessMessage(`Team has been deleted successfully`);
            setShowSuccessModal(true); // Show success modal
            setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
        } catch (err) {
            setError('Failed to delete team');
            setTimeout(() => setError(false), 3000); // Hide after 3 seconds
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const viewTeamDetails = async (team) => {
        try {
            setLoading(true);
            const teamDetails = await teamService.getTeamDetails(team.id);
            setSelectedTeam(teamDetails);
        } catch (err) {
            setError('Failed to load team details');
            setTimeout(() => setError(false), 3000); // Hide after 3 seconds
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addPlayer = () => {
        if (newTeam.players.length >= 4) return;
        setNewTeam(prev => ({
            ...prev,
            players: [...prev.players, { first_name: '', last_name: '' }]
        }));
    };

    const removePlayer = (index) => {
        if (newTeam.players.length <= 1) return;
        setNewTeam(prev => ({
            ...prev,
            players: prev.players.filter((_, i) => i !== index)
        }));
    };

    const handlePlayerChange = (index, field, value) => {
        setNewTeam(prev => ({
            ...prev,
            players: prev.players.map((player, i) => 
                i === index ? { ...player, [field]: value } : player
            )
        }));
    };

    const validateTeam = () => {
        if (!newTeam.name.trim()) {
            setError('Team name is required');
            return false;
        }
        if (newTeam.players.length < 1) {
            setError('At least one player is required');
            return false;
        }
        if (newTeam.players.some(player => !player.first_name.trim() || !player.last_name.trim())) {
            setError('All player names are required');
            return false;
        }
        return true;
    };

    const cleanupUnassignedPlayers = async () => {
        try {
            setLoading(true);
            await teamService.cleanupUnassignedPlayers();
            setSuccessMessage('Unassigned players have been removed');
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
            fetchTeams(); // Refresh the teams list
        } catch (err) {
            setError('Failed to cleanup unassigned players');
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="teams-container">
            <div className="teams-header">
                <h2>Current Teams</h2>
                <button 
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="toggle-form-button"
                >
                    {showCreateForm ? 'Hide Form' : 'Create New Team'}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {loading && <div className="loading">Loading...</div>}
            {showSuccessModal && (
                <div className="success-modal">
                    <div className="success-modal-content">
                        <h3>Success!</h3>
                        <p>{successMessage}</p>
                    </div>
                </div>
            )}
            {selectedTeam && (
                <div className="team-details-modal">
                    <div className="team-details-content">
                        <h3>Team Details</h3>
                        <p><strong>Team Name:</strong> {selectedTeam.name}</p>
                        {selectedTeam.players.map((player, index) => (
                            <p key={index}>
                                <strong>Player {index + 1}:</strong> {player.first_name} {player.last_name}
                            </p>
                        ))}
                        <button onClick={() => setSelectedTeam(null)}>Close</button>
                    </div>
                </div>
            )}
            <div className="teams-list">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : teams.length > 0 ? (
                    <ul>
                        {teams.map((team, index) => (
                            <li key={team.id} className="team-item">
                                <span className="team-number">{index + 1}.</span>
                                <div className="team-info">
                                    <h4>{team.name}</h4>
                                    <p>Players: {team.players?.length || 0}</p>
                                </div>
                                <div className="button-group">
                                    <button 
                                        onClick={() => viewTeamDetails(team)} 
                                        className="view-button"
                                    >
                                        View Details
                                    </button>
                                    <button 
                                        onClick={() => deleteTeam(team.id)} 
                                        className="delete-button"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No teams available. Create a new team to get started!</p>
                )}
            </div>

            {showCreateForm && (
                <div className="create-team-section">
                    <h3>Create New Team</h3>
                    <form onSubmit={handleSubmit} className="team-form">
                        <div className="form-group">
                            <label>Team Name:</label>
                            <input
                                type="text"
                                value={newTeam.name}
                                onChange={(e) => handleInputChange(e)}
                                required
                            />
                        </div>

                        <div className="players-section">
                            <h4>Players</h4>
                            {newTeam.players.map((player, index) => (
                                <div key={index} className="player-inputs">
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={player.first_name}
                                        onChange={(e) => handlePlayerChange(index, 'first_name', e.target.value)}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={player.last_name}
                                        onChange={(e) => handlePlayerChange(index, 'last_name', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePlayer(index)}
                                        className="remove-player-button"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addPlayer}
                                className="add-player-button"
                            >
                                Add Player
                            </button>
                        </div>

                        <div className="form-actions">
                            <button type="submit" disabled={loading}>
                                Create Team
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <button onClick={cleanupUnassignedPlayers} className="cleanup-btn">
                Cleanup Unassigned Players
            </button>
        </div>
    );
}

export default Teams;

const getValidHoles = (holes) => {
    return holes.filter(hole => hole.par && hole.par !== '');
};