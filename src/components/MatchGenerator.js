import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leagueService } from '../services/leagueService';
import './MatchGenerator.css';

function MatchGenerator() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [league, setLeague] = useState(null);
    const [nextWeekNumber, setNextWeekNumber] = useState(1);
    const [generatedMatches, setGeneratedMatches] = useState([]);
    const [manualMatches, setManualMatches] = useState([]);
    const [conflicts, setConflicts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const calculateNextWeekNumber = async () => {
        try {
            const matches = await leagueService.getLeagueMatches(id);
            const maxWeek = matches.reduce((max, match) => 
                Math.max(max, match?.week_number || 0), 0);
            setNextWeekNumber(maxWeek + 1);
        } catch (err) {
            console.error('Error calculating next week number:', err);
            setError('Failed to calculate next week number');
        }
    };

    useEffect(() => {
        fetchLeagueDetails();
    }, [id]);

    const fetchLeagueDetails = async () => {
        try {
            const leagueData = await leagueService.getLeague(id);
            setLeague(leagueData);
            
            await calculateNextWeekNumber();
            generateInitialMatches(leagueData.teams);
        } catch (err) {
            setError('Failed to load league details');
            console.error('Error fetching league details:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateInitialMatches = (teams) => {
        const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
        const matches = [];
        
        for (let i = 0; i < shuffledTeams.length - 1; i += 2) {
            matches.push({
                team1: shuffledTeams[i],
                team2: shuffledTeams[i + 1],
                isManual: false
            });
        }
        
        setGeneratedMatches(matches);
        setManualMatches(matches);
    };

    const checkConflicts = (matches) => {
        const teamAppearances = new Map();
        const conflicts = [];

        matches.forEach((match, index) => {
            [match.team1?.id, match.team2?.id].forEach(teamId => {
                if (teamId) {
                    if (teamAppearances.has(teamId)) {
                        conflicts.push({
                            teamId,
                            matches: [teamAppearances.get(teamId), index]
                        });
                    } else {
                        teamAppearances.set(teamId, index);
                    }
                }
            });
        });

        setConflicts(conflicts);
        return conflicts.length === 0;
    };

    const handleMatchUpdate = (index, field, value) => {
        const updatedMatches = [...manualMatches];
        updatedMatches[index] = {
            ...updatedMatches[index],
            [field]: value,
            isManual: true
        };
        setManualMatches(updatedMatches);
        checkConflicts(updatedMatches);
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all manual changes?')) {
            setManualMatches(generatedMatches);
            setConflicts([]);
        }
    };

    const handleSubmit = async () => {
        if (conflicts.length > 0) {
            if (!window.confirm('There are conflicts in the matchups. Continue anyway?')) {
                return;
            }
        }

        try {
            setLoading(true);
            const formattedMatches = manualMatches.map(match => ({
                league_id: parseInt(id),
                week_number: nextWeekNumber,
                team1_id: match.team1.id,
                team2_id: match.team2.id,
                date: new Date().toISOString().split('T')[0] // Use current date
            }));

            console.log('Submitting matches:', formattedMatches);

            await leagueService.createMatches(id, formattedMatches);
            navigate(`/leagues/${id}`);
        } catch (err) {
            console.error('Submit error:', err);
            setError(`Failed to save matches: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="match-generator">
            <h2>Generate Matches - Week {nextWeekNumber}</h2>
            
            <div className="match-list">
                {manualMatches.map((match, index) => (
                    <div 
                        key={index} 
                        className={`match-item ${
                            conflicts.some(c => c.matches.includes(index)) ? 'has-conflict' : ''
                        }`}
                    >
                        <select
                            value={match.team1?.id || ''}
                            onChange={(e) => handleMatchUpdate(index, 'team1', 
                                league.teams.find(t => t.id === parseInt(e.target.value))
                            )}
                        >
                            <option value="">Select Team 1</option>
                            {league.teams.map(team => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                        
                        <span className="vs">vs</span>
                        
                        <select
                            value={match.team2?.id || ''}
                            onChange={(e) => handleMatchUpdate(index, 'team2',
                                league.teams.find(t => t.id === parseInt(e.target.value))
                            )}
                        >
                            <option value="">Select Team 2</option>
                            {league.teams.map(team => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>

            {conflicts.length > 0 && (
                <div className="conflicts-warning">
                    <h3>Conflicts Detected:</h3>
                    <ul>
                        {conflicts.map((conflict, index) => (
                            <li key={index}>
                                {league.teams.find(t => t.id === conflict.teamId)?.name} 
                                appears in multiple matches
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="actions">
                <button onClick={() => generateInitialMatches(league.teams)}>
                    Regenerate Matches
                </button>
                <button 
                    onClick={handleReset}
                    className="reset-button"
                    disabled={!manualMatches.some(m => m.isManual)}
                >
                    Reset Changes
                </button>
                <button 
                    onClick={handleSubmit}
                    className={conflicts.length > 0 ? 'has-conflicts' : ''}
                >
                    Save Matches
                </button>
            </div>
        </div>
    );
}

export default MatchGenerator;