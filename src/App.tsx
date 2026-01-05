import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Databases from './pages/Databases';
import Backups from './pages/Backups';
import History from './pages/History';
import Schedules from './pages/Schedules';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import { authToken } from './services/api';

function App() {
  const isAuthenticated = !!authToken.get();

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
        />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/databases" element={<Databases />} />
                  <Route path="/backups" element={<Backups />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/schedules" element={<Schedules />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

