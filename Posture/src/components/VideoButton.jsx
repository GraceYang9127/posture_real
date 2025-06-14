import React, { useRef, useState } from 'react';

function VideoButton() {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    };

    return (
        <div>
            <button onClick={handleButtonClick}>Upload Video</button>
            <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*,video/*"
            />
            {selectedFile && <p>Selected file: {selectedFile.name}</p>}
        </div>
    );
}

export default VideoButton;
