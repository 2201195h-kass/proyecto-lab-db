import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configurar AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

export const uploadToS3 = async (file, folder = 'productos') => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    // Si no hay configuración de AWS, guardar localmente
    return null;
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${folder}/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('Error al subir a S3:', error);
    throw error;
  }
};

export const deleteFromS3 = async (url) => {
  if (!url || !process.env.AWS_ACCESS_KEY_ID) {
    return;
  }

  try {
    const key = url.split('.com/')[1];
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error al eliminar de S3:', error);
  }
};

export default s3;

