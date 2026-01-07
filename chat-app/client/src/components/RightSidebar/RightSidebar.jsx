import React, { useContext, useEffect, useState } from 'react';
import './RightSidebar.css';
import assets from '../../assets/assets';
import { AppContext } from '../../context/AppContext';

const SERVER_BASE_URL = 'http://localhost:5000'; // adjust if deploying elsewhere

const RightSidebar = () => {
  const { chatUser, messages } = useContext(AppContext);
  const [msgImages, setMsgImages] = useState([]);

  useEffect(() => {
    const images = messages.filter(msg => msg.image).map(msg => msg.image);
    setMsgImages(images);
  }, [messages]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return assets.profile_img;
    if (avatar.startsWith('/uploads')) {
      return `${SERVER_BASE_URL}${avatar}`;
    }
    return avatar;
  };

  return chatUser ? (
    <div className="rs">
      <div className="rs-profile">
        <img
          src={getAvatarUrl(chatUser.userData.avatar)}
          alt="Profile"
          onError={(e) => (e.target.src = assets.profile_img)}
        />
        <h3>
          {Date.now() - chatUser.userData.lastSeen <= 70000 && (
            <img className="dot" src={assets.green_dot} alt="Online" />
          )}
        <p style={{ fontSize: "1.5rem", fontWeight: "400"}}>{chatUser?.title || chatUser?.userData?.name || "User"}</p>
        </h3>
        <p>{chatUser.userData.bio}</p>
      </div>
      <hr />
      <div className="rs-media">
        <p>Media</p>
        <div>
          {msgImages.map((url, index) => (
            <img
              key={index}
              src={url.startsWith('/uploads') ? `${SERVER_BASE_URL}${url}` : url}
              alt={`media-${index}`}
              onClick={() => window.open(url.startsWith('/uploads') ? `${SERVER_BASE_URL}${url}` : url, '_blank')}
            />
          ))}
        </div>
      </div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  ) : (
    <div className="rs">
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default RightSidebar;
