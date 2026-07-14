import React, { createContext, useState, useContext, useEffect } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api';
const DEFAULT_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN || '';
const TIMEOUT_MS = 15000; // 15 seconds for all requests

const AuthContext = createContext();

// Helper: fetch with a built-in timeout + AbortController
function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

// Helper: safely parse JSON, return null on failure
async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [initializing, setInitializing] = useState(true);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // only for login / register actions
  const [error, setError] = useState(null);

  // On mount: validate the env token once, then stop initializing
  useEffect(() => {
    const init = async () => {
      if (!DEFAULT_TOKEN) {
        setInitializing(false);
        return;
      }
      try {
        const res = await fetchWithTimeout(`${API_URL}/feed?page=1`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${DEFAULT_TOKEN}`,
          },
        });
        if (res.ok) {
          setToken(DEFAULT_TOKEN);
          setUser({ id: 1, name: 'Maya', email: 'maya@guisedup.test' });
        }
      } catch (err) {
        // Swallow abort / network errors — user just sees Login screen
        if (err.name !== 'AbortError') {
          console.warn('Initial token check failed:', err.message);
        }
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await safeJson(response);

      if (!response.ok) {
        // Extract a human-readable message from Laravel's validation response
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(' ') : null) ||
          `Request failed (${response.status})`;
        throw new Error(msg);
      }

      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const msg = err.name === 'AbortError'
        ? 'Request timed out. Check your network connection.'
        : err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await safeJson(response);

      if (!response.ok) {
        // Extract a human-readable message from Laravel's validation response
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(' ') : null) ||
          `Request failed (${response.status})`;
        throw new Error(msg);
      }

      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const msg = err.name === 'AbortError'
        ? 'Request timed out. Check your network connection and that the backend is running.'
        : err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
  };

  // Authenticated fetch helper used by all screens
  const apiFetch = (path, options = {}) =>
    fetchWithTimeout(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        initializing,
        error,
        login,
        register,
        logout,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
