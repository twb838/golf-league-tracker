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
    }
};