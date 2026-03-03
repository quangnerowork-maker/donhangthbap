import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Employees from './pages/Employees';
import CreateOrder from './pages/CreateOrder';
import Settings from './pages/Settings';
import Login from './pages/Login';
// Firebase initialization is handled by imports in db.ts
// seedIfEmpty() is no longer needed for local storage


function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            <Route
              index
              element={
                <AuthGuard adminOrLeadOnly>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route path="orders" element={<Orders />} />
            <Route
              path="create"
              element={
                <AuthGuard adminOrLeadOnly>
                  <CreateOrder />
                </AuthGuard>
              }
            />
            <Route
              path="employees"
              element={
                <AuthGuard adminOnly>
                  <Employees />
                </AuthGuard>
              }
            />
            <Route
              path="settings"
              element={
                <AuthGuard adminOnly>
                  <Settings />
                </AuthGuard>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
