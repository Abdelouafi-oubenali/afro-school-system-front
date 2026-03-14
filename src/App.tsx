import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Eleves from './pages/admin/Eleves.tsx';
import Enseignents from './pages/admin/Enseignents.tsx';
import Admins from './pages/admin/Admins.tsx';
import Parents from './pages/admin/Parents.tsx';
import Classes from './pages/admin/Classes.tsx';
import Matieres from './pages/admin/Matieres.tsx';
import Seances from './pages/admin/Seances.tsx';
import Absences from './pages/admin/Absences.tsx';
import Notes from './pages/admin/Notes.tsx';
import EnseignantDashboard from './pages/enseignant/Dashboard';
import ChatPage from './pages/shared/Chat';
import { useAuth } from './context/AuthContext';
import './App.css';

const isTeacherRole = (role?: string) => {
  const normalized = (role || '').toLowerCase();
  return normalized.includes('enseign');
};

function App() {
  const { user } = useAuth();
  const teacherHome = '/enseignant';
  const defaultHome = user && isTeacherRole(user.role) ? teacherHome : '/dashboard';

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to={defaultHome} replace /> : <Login />} 
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
          path="/seances"
          element={user ? <Seances /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/absences"
          element={user ? <Absences /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/notes"
          element={user ? <Notes /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/chat"
          element={user ? <ChatPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/enseignant"
          element={
            user
              ? (isTeacherRole(user.role) ? <EnseignantDashboard /> : <Navigate to="/dashboard" replace />)
              : <Navigate to="/login" replace />
          }
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? defaultHome : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
