import { createContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
export const AuthContext = createContext({});
export function AuthProvider({ children }) {
  const [userData, setUserData] = useState(() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } });
  const navigate = useNavigate();
  const handleRegister = async (name, username, password) => (await api.post('/auth/register', { name, username, password })).data.message;
  const handleLogin = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUserData(data.user); navigate('/home');
  };
  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } finally {
      ['token','refreshToken','user'].forEach(key => localStorage.removeItem(key));
      setUserData({}); navigate('/auth');
    }
  };
  const getHistoryOfUser = async () => (await api.get('/users/get_all_activity')).data;
  const addToUserHistory = async meetingCode => api.post('/users/add_to_activity', { meeting_code: meetingCode });
  return <AuthContext.Provider value={{ userData, setUserData, handleRegister, handleLogin, handleLogout, getHistoryOfUser, addToUserHistory }}>{children}</AuthContext.Provider>;
}
