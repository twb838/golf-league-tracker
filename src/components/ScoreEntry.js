import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { matchService } from '../services/matchService';
import './ScoreEntry.css';

function ScoreEntry() {
    const { matchId } = useParams();
    const [match, setMatch] = useState(null);
    const [course, setCourse] = useState(null);
    const [team1Players, setTeam1Players] = useState([]);
    const [team2Players, setTeam2Players] = useState([]);
    const [scores, setScores] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMatchDetails();
    }, [matchId]);

    const fetchMatchDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching match details for ID:', matchId);
            
            const matchData = await matchService.getMatch(matchId);
            console.log('Match data received:', matchData);
            
            // Check for course_id in the league data
            if (!matchData.league?.course_id) {
                throw new Error('No course ID found for this match');
            }
            
            // Fetch course using the ID
            const courseData = await matchService.getCourse(matchData.league.course_id);
            console.log('Course data received:', courseData);

            if (!matchData.team1?.players || !matchData.team2?.players) {
                throw new Error('Team or player data missing');
            }

            setMatch(matchData);
            setCourse(courseData);
            setTeam1Players(matchData.team1.players.sort((a, b) => 
                (a.first_name + a.last_name).localeCompare(b.first_name + b.last_name)
            ));
            setTeam2Players(matchData.team2.players.sort((a, b) => 
                (a.first_name + a.last_name).localeCompare(b.first_name + b.last_name)
            ));

            // Initialize scores structure
            const initialScores = {};
            [...matchData.team1.players, ...matchData.team2.players].forEach(player => {
                initialScores[player.id] = Array(courseData.holes.length).fill('');
            });
            setScores(initialScores);
        } catch (err) {
            console.error('Error in fetchMatchDetails:', err);
            setError(`Failed to load match details: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (playerId, holeIndex, value) => {
        const score = parseInt(value) || '';
        setScores(prev => ({
            ...prev,
            [playerId]: [
                ...prev[playerId].slice(0, holeIndex),
                score,
                ...prev[playerId].slice(holeIndex + 1)
            ]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const formattedScores = Object.entries(scores).map(([playerId, holeScores]) => ({
                player_id: parseInt(playerId),
                team_id: team1Players.find(p => p.id === parseInt(playerId)) 
                    ? match.team1_id 
                    : match.team2_id,
                hole_scores: holeScores.map((strokes, index) => ({
                    hole_number: index + 1,
                    strokes: parseInt(strokes) || 0
                }))
            }));

            await matchService.submitScores(matchId, formattedScores);
            // Redirect to match results or league details
        } catch (err) {
            setError('Failed to submit scores');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading match details...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!match || !course) return <div>Match or course not found</div>;

    return (
        <div className="score-entry-page">
            <h2>Enter Scores - {match?.league?.name}</h2>
            
            <div className="match-info">
                <div className="team-names">
                    <span className="team1-name">{match?.team1?.name}</span>
                    <span className="vs">vs</span>
                    <span className="team2-name">{match?.team2?.name}</span>
                </div>
                <p className="match-date">Date: {new Date(match?.date).toLocaleDateString()}</p>
            </div>

            <form onSubmit={handleSubmit} className="score-entry-form">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th className="player-name-header">Player</th>
                                {course?.holes.map((hole, index) => (
                                    <th key={index + 1}>
                                        {index + 1}
                                        <div className="par">Par {hole.par}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Team 1 Section */}
                            <tr className="team-header">
                                <td colSpan={course?.holes.length + 1}>{match?.team1?.name}</td>
                            </tr>
                            {team1Players.map(player => (
                                <tr key={player.id} className="team1-row">
                                    <td className="player-name">
                                        {player.first_name} {player.last_name}
                                    </td>
                                    {scores[player.id]?.map((score, holeIndex) => (
                                        <td key={holeIndex}>
                                            <input
                                                type="number"
                                                min="1"
                                                max="15"
                                                value={score}
                                                onChange={(e) => handleScoreChange(player.id, holeIndex, e.target.value)}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {/* Team 2 Section */}
                            <tr className="team-header">
                                <td colSpan={course?.holes.length + 1}>{match?.team2?.name}</td>
                            </tr>
                            {team2Players.map(player => (
                                <tr key={player.id} className="team2-row">
                                    <td className="player-name">
                                        {player.first_name} {player.last_name}
                                    </td>
                                    {scores[player.id]?.map((score, holeIndex) => (
                                        <td key={holeIndex}>
                                            <input
                                                type="number"
                                                min="1"
                                                max="15"
                                                value={score}
                                                onChange={(e) => handleScoreChange(player.id, holeIndex, e.target.value)}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="form-actions">
                    <button type="submit" disabled={loading}>Submit Scores</button>
                </div>
            </form>
        </div>
    );
}

export default ScoreEntry;