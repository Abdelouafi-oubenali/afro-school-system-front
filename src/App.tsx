import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/home" replace /> : <Login />} 
        />
        <Route 
          path="/home" 
          element={user ? <Home /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/home" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
