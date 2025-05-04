const multer = require('multer');

// Configuration de multer pour stocker les fichiers en mémoire
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Extension de fichier non supportée. Veuillez télécharger un fichier JPG, JPEG ou PNG.'), false);
    }
};

const uploadService = multer({ storage, fileFilter });
const uploadProfile = multer({ storage, fileFilter });


module.exports = { uploadService, uploadProfile };