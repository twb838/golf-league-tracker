const API_BASE_URL = 'http://localhost:8000';

export const leagueService = {
    async createLeague(league) {
        const response = await fetch(`${API_BASE_URL}/leagues/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(league)
        });
        if (!response.ok) throw new Error('Failed to create league');
        return response.json();
    },

    async getLeagues() {
        const response = await fetch(`${API_BASE_URL}/leagues/`);
        if (!response.ok) throw new Error('Failed to fetch leagues');
        return response.json();
    },

    async getLeague(id) {
        try {
            // Fetch league data
            const response = await fetch(`${API_BASE_URL}/leagues/${id}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to fetch league');
            }
            
            const leagueData = await response.json();
            console.log('Raw league data:', leagueData);

            // Validate league data structure
            if (!leagueData) {
                throw new Error('No league data received');
            }

            // Initialize teams array if missing
            if (!leagueData.teams) {
                leagueData.teams = [];
            }

            // Initialize team_ids from teams if available
            if (leagueData.teams.length > 0 && !leagueData.team_ids) {
                leagueData.team_ids = leagueData.teams.map(team => team.id);
            } else if (!leagueData.team_ids) {
                leagueData.team_ids = [];
            }

            console.log('Processed league data:', {
                ...leagueData,
                teamCount: leagueData.teams.length,
                teamIdCount: leagueData.team_ids.length
            });

            return leagueData;
        } catch (err) {
            console.error('Error fetching league:', err);
            throw err;
        }
    },

    async deleteLeague(id) {
        const response = await fetch(`${API_BASE_URL}/leagues/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete league');
        return response.json();
    },

    async updateLeague(id, league) {
        const response = await fetch(`${API_BASE_URL}/leagues/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(league)
        });
        if (!response.ok) throw new Error('Failed to update league');
        return response.json();
    },

    /**
     * Creates multiple matches for a league
     * @param {number} leagueId - The ID of the league
     * @param {Array<Object>} matches - Array of match objects to create
     * @returns {Promise<Array>} The created matches
     */
    async createMatches(leagueId, matches) {
        try {
            console.log('Creating matches:', { leagueId, matches });
            
            const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/matches/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ matches })
            });

            const responseData = await response.json();
            console.log('Server response:', responseData);

            if (!response.ok) {
                throw new Error(responseData.detail || `HTTP error! status: ${response.status}`);
            }

            return responseData;
        } catch (err) {
            console.error('Error creating matches:', {
                error: err.message,
                leagueId,
                matchCount: matches?.length
            });
            throw new Error(`Failed to create matches: ${err.message}`);
        }
    },

    async getLeagueMatches(leagueId) {
        try {
            const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/matches`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch league matches');
            }

            const matches = await response.json();
            console.log('League matches:', matches);
            return matches;
        } catch (err) {
            console.error('Error fetching league matches:', err);
            throw err;
        }
    }
};