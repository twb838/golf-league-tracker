import React, { useState, useEffect } from 'react';
import { matchService } from '../services/matchService';
import './MatchSchedule.css';

/**
 * Displays a schedule of matches for a league
 * @param {Object} props
 * @param {number} props.leagueId - The ID of the league
 * @param {Array<{id: number, name: string}>} props.teams - Array of teams in the league
 * @returns {JSX.Element}
 */
export const MatchSchedule = ({ leagueId, teams }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMatches();
    }, [leagueId]);

    const fetchMatches = async () => {
        try {
            setLoading(true);
            const data = await matchService.getLeagueMatches(leagueId);
            setMatches(data);
        } catch (err) {
            setError('Failed to load matches');
        } finally {
            setLoading(false);
        }
    };

    const handleScoreEntry = (match) => {
        window.location.href = `/matches/${match.id}/scores`;
    };

    const getTeamName = (teamId) => {
        return teams.find(team => team.id === teamId)?.name || 'Unknown Team';
    };

    if (loading) return <div className="loading">Loading matches...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="match-schedule">
            <h3>Match Schedule</h3>
            {matches.length > 0 ? (
                <div className="matches-grid">
                    {matches.map(match => (
                        <div key={match.id} className="match-card">
                            <div className="match-header">
                                Week {match.week_number}
                            </div>
                            <div className="match-teams">
                                <span>{getTeamName(match.team1_id)}</span>
                                <span className="vs">vs</span>
                                <span>{getTeamName(match.team2_id)}</span>
                            </div>
                            <div className="match-date">
                                {new Date(match.date).toLocaleDateString()}
                            </div>
                            <button 
                                onClick={() => handleScoreEntry(match)}
                                className="score-entry-button"
                            >
                                Enter Scores
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No matches scheduled yet.</p>
            )}
        </div>
    );
};