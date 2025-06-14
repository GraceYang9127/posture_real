import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import MyButton from './components/button';
import Dropdown from './components/Dropdown.jsx'; 
import VideoButton from './components/videoButton.jsx';
import React from 'react';
import Nav from './components/nav/Nav.jsx';
import Home from './pages/home.jsx';
import SignIn from './pages/SignIn.jsx';
import Camera from './pages/camera.jsx';
import {BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div id="navBar">
      <Router>
        <Nav/>
        <Routes>
          <Route path="/Home" element={<Home />}/>
          <Route path="/Camera" element={<Camera />}/>
          <Route path="/SignIn" element={<SignIn />}/>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
