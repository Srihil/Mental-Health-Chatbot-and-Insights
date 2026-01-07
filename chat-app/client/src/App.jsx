import React, { useContext, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login/Login';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Chat from './pages/Chat/Chat';
import ProfileUpdate from './pages/ProfileUpdate/ProfileUpdate';
import { AppContext } from './context/AppContext';
import axios from 'axios';
import InsightsPage from "./pages/Insights1/InsightsPage";
import "./index.css"; // ✅ Make sure this is present


const App = () => {
  const navigate = useNavigate();
  const { loadUserData, setChatUser, setMessagesId } = useContext(AppContext);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          await loadUserData(); // ✅ correct
        } catch (err) {
          console.error('Token invalid or expired:', err);
          localStorage.removeItem('token');
          setChatUser(null);
          setMessagesId(null);
          navigate('/');
        }
      } else {
        setChatUser(null);
        setMessagesId(null);
        navigate('/');
      }
    };

    checkAuth();
  }, []);

  return (
    
    <>

      <ToastContainer />
      <Routes>
        <Route path="/chat" element={<Chat />} />
        <Route path="/" element={<Login />} />
        <Route path="/profile" element={<ProfileUpdate />} />
        <Route path="/insights" element={<InsightsPage />} />
      </Routes>
    </>
    
  );
};

export default App;
