import React, { useState } from 'react';
import { LoginCredentials } from '@basketball-stats/shared';
import { useAuthStore } from '../../hooks/useAuthStore';
import '../../Auth.css';

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
}

export default function LoginForm({ onSwitchToSignup, onSwitchToForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      return;
    }

    try {
      clearError();
      const credentials: LoginCredentials = {
        email: email.trim().toLowerCase(),
        password,
      };
      
      await login(credentials);
      // Navigation will be handled by the auth state change
    } catch (error) {
      console.error('Login error:', error);
      // Error is already handled by the store
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="basketball-icon">🏀</span>
          </div>
          <h2 className="auth-title">
            Sign in to your account
          </h2>
          <p className="auth-subtitle">
            Or{' '}
            <button
              onClick={onSwitchToSignup}
              className="auth-link"
            >
              create a new account
            </button>
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-input-container">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="auth-link"
            >
              Forgot your password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim()}
            className="submit-button"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}