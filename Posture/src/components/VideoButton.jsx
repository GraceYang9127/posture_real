import React, { useRef, useState } from 'react';
import { uploadToS3 } from '../utils/uploadS3';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function VideoButton() {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

const handleFileChange = async (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);

    const user = getAuth().currentUser;
    if (!user) {
        alert("You must be logged in to upload.");
        return;
    }

    try {
        const s3Key = await uploadToS3(file, user.uid);

        await addDoc(collection(db, 'videos'), {
            userId: user.uid,
            s3Key,
            originalFilename: file.name,
            timestamp: Date.now(),
        });

        alert("Upload successful!");
    } catch (err) {
        console.error("Error uploading:", err);
        alert("Upload failed.");
    }
};

    return (
        <div>
            <button onClick={handleButtonClick}>Upload Video</button>
            <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="video/*"
            />
            {selectedFile && <p>Selected file: {selectedFile.name}</p>}
        </div>
    );
}

export default VideoButton;
