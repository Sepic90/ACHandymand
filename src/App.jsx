import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Timeregistrering from './pages/Timeregistrering';
import Indstillinger from './pages/Indstillinger';
import Sager from './pages/Sager';
import SagDetails from './pages/SagDetails';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/timeregistrering" replace />} />
          <Route path="timeregistrering" element={<Timeregistrering />} />
          <Route path="sager" element={<Sager />} />
          <Route path="sager/:id" element={<SagDetails />} />
          <Route path="indstillinger" element={<Indstillinger />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;