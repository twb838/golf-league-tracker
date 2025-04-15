import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="nav-container">
            <div className="nav-header">
                <Link to="/" className="nav-logo">
                    Golf League
                </Link>
                <button 
                    className={`hamburger ${isOpen ? 'active' : ''}`}
                    onClick={toggleMenu}
                    aria-label="Toggle navigation menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
            <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
                <li>
                    <Link to="/" onClick={toggleMenu}>Home</Link>
                </li>
                <li>
                    <Link to="/leagues" onClick={toggleMenu}>Leagues</Link>
                </li>
                <li>
                    <Link to="/teams" onClick={toggleMenu}>Teams</Link>
                </li>
                <li>
                    <Link to="/courses" onClick={toggleMenu}>Courses</Link>
                </li>
            </ul>
        </nav>
    );
}

export default Navigation;