import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (file, userId) => {
  const key = `videos/${userId}/${Date.now()}_${file.name}`;

  const command = new PutObjectCommand({
    Bucket: import.meta.env.VITE_AWS_BUCKET_NAME,
    Key: key,
    Body: await file.arrayBuffer(),
    ContentType: file.type,
  });

  try {
    const response = await s3.send(command);
    console.log("✅ S3 Upload Success:", response);
    return key;
  } catch (error) {
    console.error("❌ S3 Upload Error:", error.name, error.message, error);
    throw error;
  }
};
