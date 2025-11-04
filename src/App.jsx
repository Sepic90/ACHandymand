import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './utils/notificationUtils.jsx';
import ToastContainer from './components/notifications/ToastContainer';
import ConfirmDialog from './components/notifications/ConfirmDialog';
import Login from './pages/Login';
import Timeregistrering from './pages/Timeregistrering';
import Indstillinger from './pages/Indstillinger';
import Sager from './pages/Sager';
import SagDetails from './pages/SagDetails';
import Materialer from './pages/Materialer';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <NotificationProvider>
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
            <Route index element={<Navigate to="/sager" replace />} />
            <Route path="sager" element={<Sager />} />
            <Route path="sager/:id" element={<SagDetails />} />
            <Route path="materialer" element={<Materialer />} />
            <Route path="timeregistrering" element={<Timeregistrering />} />
            <Route path="indstillinger" element={<Indstillinger />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      
      <ToastContainer />
      <ConfirmDialog />
    </NotificationProvider>
  );
}

export default App;