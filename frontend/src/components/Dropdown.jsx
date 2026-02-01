import React, { useState } from 'react';

const Dropdown = ({ selected, setSelected }) => { 
  const [isOpen, setIsOpen] = useState(false);

  const options = ['Violin', 'Piano', 'Guitar', 'Flute', 'Drums', 'Saxophone'];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setIsOpen(!isOpen)}>
        {selected} ▼
      </button>

      {isOpen && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: '10px',
            border: '1px solid #ffffff',
            backgroundColor: 'white',
            position: 'absolute',
            width: '100%',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
            zIndex: 999,
          }}
        >
          {options.map((option) => (
            <li
              key={option}
              onClick={() => {
                setSelected(option);
                setIsOpen(false);
              }}
              style={{ padding: '5px 10px', cursor: 'pointer' }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
