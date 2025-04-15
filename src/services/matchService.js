/**
 * @typedef {import('../types/match').Match} Match
 * @typedef {import('../types/match').MatchResult} MatchResult
 * @typedef {import('../types/match').PlayerScore} PlayerScore
 */

const API_BASE_URL = 'http://localhost:8000';

export const matchService = {
    /**
     * Creates a new match
     * @param {Match} match - The match to create
     * @returns {Promise<Match>} The created match
     */
    async createMatch(match) {
        const response = await fetch(`${API_BASE_URL}/matches/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(match)
        });
        if (!response.ok) throw new Error('Failed to create match');
        return response.json();
    },

    /**
     * Submits scores for a match
     * @param {number} matchId - The ID of the match
     * @param {PlayerScore[]} scores - Array of player scores
     * @returns {Promise<MatchResult>} The match results
     */
    async submitScores(matchId, scores) {
        try {
            const response = await fetch(`${API_BASE_URL}/matches/${matchId}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scores)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to submit scores');
            }
            return response.json();
        } catch (err) {
            console.error('Error submitting scores:', err);
            throw err;
        }
    },

    /**
     * Gets the results for a specific match
     * @param {number} matchId - The ID of the match
     * @returns {Promise<MatchResult>} The match results
     */
    async getMatchResults(matchId) {
        const response = await fetch(`${API_BASE_URL}/matches/${matchId}/results`);
        if (!response.ok) throw new Error('Failed to get match results');
        return response.json();
    },

    /**
     * Gets all matches for a league
     * @param {number} leagueId - The ID of the league
     * @returns {Promise<Match[]>} Array of matches
     */
    async getLeagueMatches(leagueId) {
        const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/matches`);
        if (!response.ok) throw new Error('Failed to fetch league matches');
        return response.json();
    },

    /**
     * Creates multiple matches for a league
     * @param {number} leagueId - The ID of the league
     * @param {Match[]} matches - Array of matches to create
     * @returns {Promise<Match[]>} Array of created matches
     */
    async createMatches(leagueId, matches) {
        const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/matches/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matches })
        });
        if (!response.ok) throw new Error('Failed to create matches');
        return response.json();
    },

    async getMatch(matchId) {
        try {
            if (!matchId) {
                throw new Error('Match ID is required');
            }

            console.log(`Fetching match ${matchId} from ${API_BASE_URL}/matches/${matchId}`);
            const response = await fetch(`${API_BASE_URL}/matches/${matchId}`);
            
            if (response.status === 404) {
                throw new Error('Match not found');
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch match');
            }

            const data = await response.json();
            console.log('Match data:', data);
            return data;
        } catch (err) {
            console.error('Error in getMatch:', err);
            throw err;
        }
    },

    async getCourse(courseId) {
        try {
            if (!courseId) {
                throw new Error('Course ID is required');
            }

            console.log(`Fetching course ${courseId}`);
            const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
            
            if (response.status === 404) {
                throw new Error('Course not found');
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch course');
            }

            const data = await response.json();
            console.log('Course data received:', data);
            return data;
        } catch (err) {
            console.error('Error in getCourse:', err);
            throw err;
        }
    },

    async deleteMatch(matchId) {
        try {
            const response = await fetch(`${API_BASE_URL}/matches/${matchId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to delete match');
            }

            return true;
        } catch (err) {
            console.error('Error deleting match:', err);
            throw err;
        }
    },

    /**
     * Gets matches for a specific week
     * @param {number} leagueId - The ID of the league
     * @param {number} weekNumber - The week number to fetch
     * @returns {Promise<Match[]>} Array of matches for the week
     */
    async getMatchesByWeek(leagueId, weekNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/matches/week/${weekNumber}`);
            
            if (response.status === 404) {
                return []; // Return empty array if no matches found
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch week matches');
            }

            const data = await response.json();
            console.log(`Week ${weekNumber} matches:`, data);
            return data;
        } catch (err) {
            console.error('Error fetching week matches:', err);
            throw err;
        }
    },

    /**
     * Gets available weeks for a league
     * @param {number} leagueId - The ID of the league
     * @returns {Promise<number[]>} Array of week numbers
     */
    async getAvailableWeeks(leagueId) {
        try {
            const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/weeks`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch available weeks');
            }

            const data = await response.json();
            console.log('Available weeks:', data.sort((a, b) => a - b));
            return data.sort((a, b) => a - b);
        } catch (err) {
            console.error('Error fetching available weeks:', err);
            throw err;
        }
    }
};