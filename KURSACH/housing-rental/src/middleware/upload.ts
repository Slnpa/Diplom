import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'images') {
      cb(null, 'uploads/images');
    } else if (file.fieldname === 'documents') {
      cb(null, 'uploads/documents');
    } else {
      cb(null, 'uploads/others');
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

export const upload = multer({ storage });

export const multiUpload = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'documents', maxCount: 10 },
]);
