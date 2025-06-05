import React from 'react';

function MyButton() {
  const handleClick = () => {
    alert('Button clicked!');
  };

  return (
    <button onClick={handleClick}>
      Camera
    </button>
  );
}


export default MyButton;