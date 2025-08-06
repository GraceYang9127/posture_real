import React, { useState } from 'react';
import './App.css';
import Nav from './components/nav/Nav.jsx';
import Home from './pages/home.jsx';
import SignIn from './pages/SignIn.jsx';
import Camera from './pages/camera.jsx';
import ChatPage from './pages/ChatPage.jsx';   
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <div id="navBar">
      <Router>
        <Nav />
        <Routes>
          <Route path="/" element={<Navigate to="/SignIn" />} />
          <Route path="/SignIn" element={<SignIn />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/Camera" element={<Camera />} />
          <Route path="/Chat" element={<ChatPage />} />  
        </Routes>
      </Router>
    </div>
  );
}

export default App;
