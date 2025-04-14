import { Link } from 'react-router-dom';

function Navigation() {
    return (
        <nav className="navigation">
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/teams">Teams</Link></li>
                <li><Link to="/courses">Courses</Link></li>
                <li><Link to="/leagues">Leagues</Link></li>
                <li><Link to="/standings">Standings</Link></li>
                <li><Link to="/scores">Scores</Link></li>
            </ul>
        </nav>
    );
}

export default Navigation;