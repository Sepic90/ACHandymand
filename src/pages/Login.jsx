import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/timeregistrering');
    } catch (err) {
      console.error('Login error:', err);
      
      // Translate Firebase errors to Danish
      let errorMessage = 'Der opstod en fejl ved login. Prøv igen.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Forkert brugernavn eller adgangskode.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Ugyldig e-mailadresse.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'For mange forsøg. Prøv igen senere.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <h1>AC Handymand</h1>
          <p>Timeregistrering System</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Brugernavn (E-mail)</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="din@email.dk"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Adgangskode</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Logger ind...' : 'Log ind'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
