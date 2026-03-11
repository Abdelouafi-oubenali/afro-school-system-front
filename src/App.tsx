import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Eleves from './pages/admin/Eleves.tsx';
import Enseignents from './pages/admin/Enseignents.tsx';
import Admins from './pages/admin/Admins.tsx';
import Parents from './pages/admin/Parents.tsx';
import Classes from './pages/admin/Classes.tsx';
import Matieres from './pages/admin/Matieres.tsx';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route
          path="/eleves"
          element={user ? <Eleves /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/enseignents"
          element={user ? <Enseignents /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admins"
          element={user ? <Admins /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/parents"
          element={user ? <Parents /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/classes"
          element={user ? <Classes /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/matieres"
          element={user ? <Matieres /> : <Navigate to="/login" replace />}
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
