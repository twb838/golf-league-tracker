const API_BASE_URL = 'http://localhost:8000'; // Adjust this to match your FastAPI server

export const teamService = {
    // Get all teams
    async getTeams() {
        const response = await fetch(`${API_BASE_URL}/teams/`);
        if (!response.ok) throw new Error('Failed to fetch teams');
        return response.json();
    },

    // Create a new team
    async createTeam(team) {
        // Ensure players array exists with at least one player
        const players = Array.isArray(team.players) ? team.players : [];
        
        const teamData = {
            name: team.name,
            players: players.map(player => ({
                first_name: player.first_name || '',
                last_name: player.last_name || ''
            }))
        };

        const response = await fetch(`${API_BASE_URL}/teams/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(teamData)
        });
        if (!response.ok) throw new Error('Failed to create team');
        return response.json();
    },

    // Get team details
    async getTeamDetails(teamId) {
        const response = await fetch(`${API_BASE_URL}/teams/${teamId}`);
        if (!response.ok) throw new Error('Failed to fetch team details');
        return response.json();
    },

    // Delete a team
    async deleteTeam(teamId) {
        const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete team');
        return response.json();
    },

    // Cleanup unassigned players
    async cleanupUnassignedPlayers() {
        const response = await fetch(`${API_BASE_URL}/teams/cleanup/unassigned-players`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to cleanup unassigned players');
        return response.json();
    },

    // Get team by ID
    async getTeam(id) {
        const response = await fetch(`${API_BASE_URL}/teams/${id}`);
        if (!response.ok) throw new Error('Failed to fetch team');
        return response.json();
    }
};