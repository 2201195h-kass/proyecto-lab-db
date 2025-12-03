import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Configuración de multer para almacenamiento en memoria (para S3)
const storage = multer.memoryStorage();

// Filtro de tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

export const uploadSingle = upload.single('imagen');
export const uploadMultiple = upload.array('imagenes', 5);

