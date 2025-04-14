import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './components/Home';
import Teams from './components/Teams';
import Courses from './components/Courses';
import Leagues from './components/Leagues';
import LeagueDetails from './components/LeagueDetails';
import ScoreEntry from './components/ScoreEntry';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/scores" element={<Scores />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/leagues/:id" element={<LeagueDetails />} />
          <Route path="/matches/:matchId/scores" element={<ScoreEntry />} />
        </Routes>
      </div>
    </Router>
  );
}

// These can be moved to their own component files as well
const Standings = () => <h2>Standings</h2>;
const Scores = () => <h2>Scores</h2>;

export default App;
