import React from 'react';
import VideoButton from '../components/videoButton.jsx';
import LivePose from '../components/LivePose.jsx';

const Camera = () => {
  return <div>
    <h1>Camera</h1>
    <LivePose />
    <VideoButton />
    </div>;
};

export default Camera;
