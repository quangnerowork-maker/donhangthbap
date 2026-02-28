import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { seedIfEmpty } from './lib/seed';

// Seed on first load
seedIfEmpty();

function App() {
  return (
    <BrowserRouter>
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
                <AuthGuard adminOnly>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route path="orders" element={<Orders />} />
            <Route
              path="create"
              element={
                <AuthGuard floristDisallowed>
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
    </BrowserRouter>
  );
}

export default App;
