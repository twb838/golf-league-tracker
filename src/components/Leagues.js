import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { teamService } from '../services/teamService';
import { leagueService } from '../services/leagueService';
import './Leagues.css';

function Leagues() {
    const [courses, setCourses] = useState([]);
    const [teams, setTeams] = useState([]);
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [editingLeague, setEditingLeague] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [newLeague, setNewLeague] = useState({
        name: '',
        course_id: '',
        number_of_weeks: 1,
        team_ids: [],
        start_date: ''
    });

    useEffect(() => {
        fetchCourses();
        fetchTeams();
        fetchLeagues();
    }, []);

    const fetchCourses = async () => {
        try {
            const data = await courseService.getCourses();
            setCourses(data);
        } catch (err) {
            setError('Failed to load courses');
        }
    };

    const fetchTeams = async () => {
        try {
            const data = await teamService.getTeams();
            setTeams(data);
        } catch (err) {
            setError('Failed to load teams');
        }
    };

    const fetchLeagues = async () => {
        try {
            const data = await leagueService.getLeagues();
            setLeagues(data);
        } catch (err) {
            console.error('Error fetching leagues:', err);
            setError('Failed to load leagues');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewLeague(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTeamSelection = (e) => {
        const selectedTeams = Array.from(e.target.selectedOptions, option => parseInt(option.value, 10));
        setNewLeague(prev => ({
            ...prev,
            team_ids: selectedTeams
        }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateLeague()) return;

        try {
            setLoading(true);
            if (editingLeague) {
                await leagueService.updateLeague(editingLeague.id, newLeague);
                setSuccessMessage('League updated successfully');
                setEditingLeague(null);
            } else {
                await leagueService.createLeague(newLeague);
                setSuccessMessage('League created successfully');
            }
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
            resetForm();
            fetchLeagues();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const validateLeague = () => {
        if (!newLeague.name.trim()) {
            setError('League name is required');
            return false;
        }
        if (!newLeague.course_id) {
            setError('Please select a course');
            return false;
        }
        if (newLeague.number_of_weeks < 1 || newLeague.number_of_weeks > 15) {
            setError('Number of weeks must be between 1 and 15');
            return false;
        }
        return true;
    };

    const resetForm = () => {
        setNewLeague({
            name: '',
            course_id: '',
            number_of_weeks: 1,
            team_ids: [],
            start_date: ''
        });
    };

    const handleDeleteLeague = async (leagueId) => {
        if (!window.confirm('Are you sure you want to delete this league?')) return;
        
        try {
            setLoading(true);
            await leagueService.deleteLeague(leagueId);
            setLeagues(prev => prev.filter(league => league.id !== leagueId));
            setSuccessMessage('League deleted successfully');
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
        } catch (err) {
            setError('Failed to delete league');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (league) => {
        setEditingLeague(league);
        setNewLeague({
            name: league.name,
            course_id: league.course_id,
            number_of_weeks: league.number_of_weeks,
            team_ids: league.team_ids,
            start_date: league.start_date
        });
    };

    const handleCancelEdit = () => {
        setEditingLeague(null);
        resetForm();
    };

    return (
        <div className="leagues-container">
            <div className="leagues-header">
                <h2>Current Leagues</h2>
                <button 
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="toggle-form-button"
                >
                    {showCreateForm ? 'Hide Form' : 'Create New League'}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {showSuccessModal && (
                <div className="success-modal">
                    <div className="success-modal-content">
                        <p>{successMessage}</p>
                    </div>
                </div>
            )}

            <div className="leagues-list">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : leagues.length > 0 ? (
                    <ul>
                        {leagues.map(league => (
                            <li key={league.id} className="league-item">
                                <div className="league-info">
                                    <h4>{league.name}</h4>
                                    <p>Weeks: {league.number_of_weeks}</p>
                                    <p>Start Date: {new Date(league.start_date).toLocaleDateString()}</p>
                                    <p>Teams: {league.teams?.length || 0}</p>
                                </div>
                                <div className="button-group">
                                    <Link 
                                        to={`/leagues/${league.id}`}
                                        className="view-button"
                                    >
                                        View League
                                    </Link>
                                    <button 
                                        onClick={() => handleEdit(league)}
                                        className="edit-button"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteLeague(league.id)}
                                        className="delete-button"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No leagues available. Create a new league to get started!</p>
                )}
            </div>

            {showCreateForm && (
                <div className="create-league-section">
                    <h3>Create New League</h3>
                    <form onSubmit={handleSubmit} className="league-form">
                        <div className="form-group">
                            <label>League Name:</label>
                            <input
                                type="text"
                                name="name"
                                value={newLeague.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Course:</label>
                            <select
                                name="course_id"
                                value={newLeague.course_id}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select a course</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Number of Weeks:</label>
                            <input
                                type="number"
                                name="number_of_weeks"
                                min="1"
                                max="15"
                                value={newLeague.number_of_weeks}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Start Date:</label>
                            <input
                                type="date"
                                name="start_date"
                                value={newLeague.start_date}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Select Teams (hold Ctrl/Cmd to select multiple):</label>
                            <select
                                multiple
                                size={Math.min(10, teams.length)}
                                value={newLeague.team_ids}
                                onChange={handleTeamSelection}
                                required
                            >
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" disabled={loading}>
                            {editingLeague ? 'Update League' : 'Create League'}
                        </button>
                        {editingLeague && (
                            <button 
                                type="button" 
                                onClick={handleCancelEdit}
                                className="cancel-button"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
}

export default Leagues;