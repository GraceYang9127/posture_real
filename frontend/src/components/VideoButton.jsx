import React, { useRef, useState } from "react";
import { uploadToS3 } from "../utils/uploadS3"; 
import { auth } from "../firebase";

function VideoButton() {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadStatus("Uploading...");

    try {
      const userId = auth.currentUser?.uid || "anonymous"; 
      const s3Key = await uploadToS3(file, userId);
      setUploadStatus("Upload complete");
    } catch (error) {
      setUploadStatus("Upload failed");
    }
  };

  return (
    <div>
      <button onClick={handleButtonClick}>Upload Video</button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="video/*"
      />
      {selectedFile && <p>Selected file: {selectedFile.name}</p>}
      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
}

export default VideoButton;
