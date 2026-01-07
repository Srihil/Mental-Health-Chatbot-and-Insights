import React, { useContext, useEffect, useState } from 'react';
import './ProfileUpdate.css';
import assets from '../../assets/assets';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from '../../config/api';

const ProfileUpdate = () => {
  const [image, setImage] = useState(null);
  const [prevImage, setPrevImage] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [uid, setUid] = useState('');
  const navigate = useNavigate();
  const { setUserData } = useContext(AppContext);
  const token = localStorage.getItem('token');

  const profileUpdate = async (e) => {
    e.preventDefault();

    if (!prevImage && !image) {
      toast.error('Upload profile picture');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      if (image) {
        formData.append('avatar', image);
      }

      const res = await axios.put(`/auth/profile/${uid}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setUserData(res.data.user);
      navigate('/chat');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = res.data;
        setUid(user._id);
        setName(user.name || '');
        setBio(user.bio || '');
        setPrevImage(user.avatar ? `http://localhost:5000${user.avatar}` : '');
      } catch (error) {
        console.error(error);
        navigate('/');
      }
    };
  
    fetchUser();
  }, []);
  

  return (
    <div className="profile">
      <div className="profile-container">
        <form onSubmit={profileUpdate}>
          <h3>Profile details</h3>
          <label htmlFor="avatar">
            <input
              onChange={(e) => setImage(e.target.files[0])}
              id="avatar"
              type="file"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <img
              src={
                image
                  ? URL.createObjectURL(image)
                  : prevImage
                  ? prevImage
                  : assets.avatar_icon
              }
              alt=""
            />
            upload profile image
          </label>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            placeholder="Your name"
            type="text"
            required
          />
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            required
          />
          <button type="submit">Save</button>
        </form>
        <img
          className="profile-pic"
          src={
            image
              ? URL.createObjectURL(image)
              : prevImage
              ? prevImage
              : assets.logo_icon
          }
          alt=""
        />
      </div>
    </div>
  );
};

export default ProfileUpdate;
