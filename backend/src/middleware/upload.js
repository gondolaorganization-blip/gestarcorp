import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_BASE = path.join(__dirname, '..', '..', 'uploads');

function crearStorage(carpeta) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(UPLOAD_BASE, carpeta));
    },
    filename: (req, file, cb) => {
      const hash = crypto.randomBytes(8).toString('hex');
      const ext  = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${hash}${ext}`);
    },
  });
}

function filtroDocumentos(req, file, cb) {
  const permitidos = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (permitidos.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten PDF, JPG, PNG o WEBP.'));
  }
}

const MAX_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10 MB

export const uploadIdentidad = multer({
  storage:  crearStorage('identidades'),
  fileFilter: filtroDocumentos,
  limits: { fileSize: MAX_SIZE },
}).single('documento');

export const uploadComprobante = multer({
  storage:  crearStorage('documentos'),
  fileFilter: filtroDocumentos,
  limits: { fileSize: MAX_SIZE },
}).single('comprobante');

// Middleware que maneja errores de multer de forma limpia
export function handleUpload(uploadFn) {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Error de carga: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
}
