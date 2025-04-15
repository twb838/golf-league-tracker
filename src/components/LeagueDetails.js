import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { leagueService } from '../services/leagueService';
import { matchService } from '../services/matchService';
import { teamService } from '../services/teamService';
import './LeagueDetails.css';

function LeagueDetails() {
    const { id } = useParams();
    const [league, setLeague] = useState({ matches: [], teams: [] });
    const [currentWeek, setCurrentWeek] = useState(1);
    const [availableWeeks, setAvailableWeeks] = useState([]);
    const [weekMatches, setWeekMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generatedMatches, setGeneratedMatches] = useState(null);
    const [matchGenerationError, setMatchGenerationError] = useState(null);

    useEffect(() => {
        fetchLeagueDetails();
    }, [id]);

    useEffect(() => {
        if (league.id) {
            fetchAvailableWeeks();
        }
    }, [league.id]);

    useEffect(() => {
        if (league.id && currentWeek) {
            fetchWeekMatches();
        }
    }, [league.id, currentWeek]);

    useEffect(() => {
        if (currentWeek && league?.id) {
            fetchWeekMatches();
        }
    }, [currentWeek, league?.id]);

    const fetchLeagueDetails = async () => {
        try {
            // Log the league ID being fetched
            console.log('Fetching league details for ID:', id);

            // Fetch league data with error handling
            const leagueData = await leagueService.getLeague(id);
            if (!leagueData) {
                throw new Error('League data not found');
            }
            console.log('League data received:', leagueData);

            // Fetch matches with error handling
            const matchesData = await matchService.getLeagueMatches(id);
            console.log('Matches data received:', matchesData);

            // Only fetch teams if we have team_ids
            if (!leagueData.team_ids || !Array.isArray(leagueData.team_ids)) {
                throw new Error('No team IDs found in league data');
            }

            // Fetch team data with error handling
            const teamsData = await Promise.all(
                leagueData.team_ids.map(async teamId => {
                    try {
                        return await teamService.getTeam(teamId);
                    } catch (err) {
                        console.error(`Failed to fetch team ${teamId}:`, err);
                        return null;
                    }
                })
            );

            // Filter out any null teams from failed fetches
            const validTeams = teamsData.filter(team => team !== null);
            console.log('Teams data received:', validTeams);

            setLeague({
                ...leagueData,
                teams: validTeams,
                matches: matchesData || []
            });
        } catch (err) {
            console.error('Error in fetchLeagueDetails:', err);
            setError(`Failed to load league details: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableWeeks = async () => {
        try {
            const weeks = await matchService.getAvailableWeeks(id);
            setAvailableWeeks(weeks);
            if (weeks.length > 0 && !weeks.includes(currentWeek)) {
                setCurrentWeek(weeks[0]);
            }
        } catch (err) {
            setError('Failed to load available weeks');
        }
    };

    const fetchWeekMatches = async () => {
        try {
            const matches = await leagueService.getLeagueMatches(league.id);
            const filteredMatches = matches.filter(match => match.week_number === currentWeek);
            setWeekMatches(filteredMatches);
        } catch (err) {
            setError('Failed to load matches');
            console.error('Error fetching week matches:', err);
        }
    };

    const generateNewWeekMatches = () => {
        try {
            if (!league?.teams?.length) {
                setMatchGenerationError('No teams available to create matches');
                return null;
            }

            const teams = [...league.teams];
            const matches = [];
            const currentWeek = (league.matches?.length || 0) + 1;

            // Shuffle teams randomly
            for (let i = teams.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [teams[i], teams[j]] = [teams[j], teams[i]];
            }

            // Create matches
            while (teams.length > 0) {
                const team1 = teams.shift();
                const team2 = teams.length > 0 ? teams.shift() : null;
                
                if (team2) {
                    matches.push({
                        league_id: parseInt(id),
                        week_number: currentWeek,
                        team1_id: team1.id,
                        team2_id: team2.id,
                        date: calculateMatchDate(league.start_date, currentWeek - 1)
                    });
                }
            }

            return matches;
        } catch (err) {
            console.error('Error generating matches:', err);
            setMatchGenerationError('Failed to generate matches');
            return null;
        }
    };

    const calculateMatchDate = (startDate, weekOffset) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + (weekOffset * 7));
        return date.toISOString().split('T')[0];
    };

    const handleCreateNewWeek = () => {
        try {
            const newMatches = generateNewWeekMatches();
            if (!newMatches) return;
            
            setGeneratedMatches(newMatches);
            setMatchGenerationError(null);
        } catch (err) {
            setMatchGenerationError('Failed to generate matches');
            console.error('Error in handleCreateNewWeek:', err);
        }
    };

    const handleConfirmMatches = async () => {
        try {
            setLoading(true);
            await matchService.createMatches(id, generatedMatches);
            setGeneratedMatches(null);
            fetchLeagueDetails();
        } catch (err) {
            setError('Failed to save matches');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteWeek = async () => {
        if (!window.confirm(`Are you sure you want to delete Week ${currentWeek}?`)) {
            return;
        }

        try {
            setLoading(true);
            const weekMatches = league.matches.filter(m => m.week_number === currentWeek);
            await Promise.all(weekMatches.map(match => 
                matchService.deleteMatch(match.id)
            ));

            // Refresh league details
            await fetchLeagueDetails();
            
            // If there are no more matches, reset UI state
            if (league.matches.length === 0) {
                setAvailableWeeks([]);
                setWeekMatches([]);
                setCurrentWeek(1);
                return;
            }

            // Get the latest available week
            const latestWeek = Math.max(...league.matches.map(m => m.week_number));
            setCurrentWeek(latestWeek);
            
        } catch (err) {
            setError('Failed to delete week');
            console.error('Error deleting week:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading league details...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!league) return <div>League not found</div>;

    return (
        <div className="league-details-page">
            <div className="league-header">
                <h2>{league?.name || 'Loading...'}</h2>
                {league?.matches?.length < league?.number_of_weeks && (
                    <button 
                        onClick={handleCreateNewWeek}
                        disabled={loading}
                        className="create-week-button"
                    >
                        Create New Week
                    </button>
                )}
            </div>
            
            <div className="league-info">
                <p><strong>Weeks:</strong> {league?.matches?.length || 0} of {league?.number_of_weeks || 0}</p>
                <p><strong>Start Date:</strong> {league?.start_date ? new Date(league.start_date).toLocaleDateString() : 'Not set'}</p>
                <p><strong>Teams:</strong> {league?.teams?.length || 0}</p>
            </div>

            {availableWeeks.length > 0 ? (
                <>
                    <div className="week-navigation">
                        <div className="week-controls">
                            <select 
                                value={currentWeek}
                                onChange={(e) => setCurrentWeek(Number(e.target.value))}
                                className="week-selector"
                            >
                                {availableWeeks.map(week => (
                                    <option key={week} value={week}>
                                        Week {week}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="week-actions">
                            <Link 
                                to={`/leagues/${id}/generate-matches`}
                                className="create-week-button"
                            >
                                Create New Week
                            </Link>
                            <button 
                                onClick={handleDeleteWeek}
                                className="delete-week-button"
                                disabled={loading}
                            >
                                Delete Week {currentWeek}
                            </button>
                        </div>
                    </div>

                    <div className="week-matches">
                        {weekMatches.length > 0 ? (
                            weekMatches.map(match => (
                                <div key={match.id} className="match-preview">
                                    <span className="team-name">
                                        {league.teams.find(t => t.id === match.team1_id)?.name || 'TBD'}
                                    </span>
                                    <span className="vs">vs</span>
                                    <span className="team-name">
                                        {league.teams.find(t => t.id === match.team2_id)?.name || 'TBD'}
                                    </span>
                                    <span className="match-date">
                                        {new Date(match.date).toLocaleDateString()}
                                    </span>
                                    <Link 
                                        to={`/matches/${match.id}/scores`}
                                        className="score-button"
                                    >
                                        View/Enter Scores
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="no-matches-message">
                                No matches found for Week {currentWeek}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-content">
                        <h3>No Weeks Created</h3>
                        <p>This league doesn't have any weeks created yet.</p>
                        <Link 
                            to={`/leagues/${id}/generate-matches`}
                            className="create-first-week-button"
                        >
                            Create First Week
                        </Link>
                    </div>
                </div>
            )}

            {generatedMatches && (
                <div className="generated-matches">
                    <h3>Generated Matches for Week {(league.matches?.length || 0) + 1}</h3>
                    {matchGenerationError && (
                        <div className="warning-message">
                            {matchGenerationError}
                        </div>
                    )}
                    <div className="matches-preview">
                        {generatedMatches.map((match, index) => (
                            <div key={index} className="match-preview">
                                <span className="team-name">
                                    {league.teams.find(t => t.id === match.team1_id)?.name || 'TBD'}
                                </span>
                                <span className="vs">vs</span>
                                <span className="team-name">
                                    {league.teams.find(t => t.id === match.team2_id)?.name || 'TBD'}
                                </span>
                                <span className="match-date">
                                    {new Date(match.date).toLocaleDateString()}
                                </span>
                                <Link 
                                    to={`/matches/${match.id}/scores`}
                                    className="enter-scores-button"
                                >
                                    Enter Scores
                                </Link>
                            </div>
                        ))}
                    </div>
                    <div className="action-buttons">
                        <button 
                            onClick={handleCreateNewWeek}
                            className="regenerate-button"
                            disabled={loading}
                        >
                            Regenerate Matches
                        </button>
                        <button 
                            onClick={handleConfirmMatches}
                            className="confirm-button"
                            disabled={loading}
                        >
                            Confirm Matches
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

export default LeagueDetails;