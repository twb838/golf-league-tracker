import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { leagueService } from '../services/leagueService';
import { matchService } from '../services/matchService';
import { teamService } from '../services/teamService';
import { MatchSchedule } from './MatchSchedule';
import './LeagueDetails.css';

function LeagueDetails() {
    const { id } = useParams();
    const [league, setLeague] = useState({ matches: [], teams: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generatedMatches, setGeneratedMatches] = useState(null);
    const [matchGenerationError, setMatchGenerationError] = useState(null);

    useEffect(() => {
        fetchLeagueDetails();
    }, [id]);

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

    const generateNewWeekMatches = () => {
        if (!league?.teams?.length) {
            setMatchGenerationError('No teams available to create matches');
            return null;
        }

        if (league.teams.length < 2) {
            setMatchGenerationError('Need at least 2 teams to create matches');
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
        while (teams.length >= 2) {
            const team1 = teams.shift();
            const team2 = teams.shift();
            matches.push({
                league_id: parseInt(id),
                week_number: currentWeek,
                team1_id: team1.id,
                team2_id: team2.id,
                date: calculateMatchDate(league.start_date, currentWeek - 1)
            });
        }

        return matches;
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

    if (loading) return <div className="loading">Loading league details...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!league) return <div>League not found</div>;

    return (
        <div className="league-details-page">
            <div className="league-header">
                <h2>{league?.name || 'Loading...'}</h2>
                <button 
                    onClick={handleCreateNewWeek}
                    disabled={loading || ((league?.matches?.length || 0) >= (league?.number_of_weeks || 0))}
                    className="create-week-button"
                >
                    Create New Week
                </button>
            </div>
            
            <div className="league-info">
                <p><strong>Weeks:</strong> {league?.matches?.length || 0} of {league?.number_of_weeks || 0}</p>
                <p><strong>Start Date:</strong> {league?.start_date ? new Date(league.start_date).toLocaleDateString() : 'Not set'}</p>
                <p><strong>Teams:</strong> {league?.teams?.length || 0}</p>
            </div>

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

            <MatchSchedule leagueId={id} teams={league.teams} />
        </div>
    );
}

export default LeagueDetails;