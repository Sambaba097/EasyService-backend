const cloudinary = require('cloudinary').v2;
require('dotenv').config();


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Fonction utilitaire pour envoyer une image sur Cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder,
                transformation: [
                    { crop: 'fill', gravity: 'auto' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        ).end(fileBuffer);
    });
};

// Fonction pour récupèrer l'id de l'image
const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    
    // Exemple d'URL: https://res.cloudinary.com/demo/image/upload/v1621234567/folder/image.jpg
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
    
    return matches ? matches[1] : null;
};


const deleteFromCloudinary = async (publicId) => {
    if (!publicId) {
        console.error("public_id invalide !");
        return { error: "public_id invalide" };
    }
    
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            invalidate: true // Invalide le cache CDN
        });
        
        if (result.result !== 'ok') {
            console.error("Échec suppression Cloudinary:", result);
            return { error: result.result };
        }
        
        console.log("Image supprimée:", publicId);
        return { success: true };
    } catch (error) {
        console.error("Erreur suppression Cloudinary:", error);
        return { error: error.message };
    }
};


module.exports = { uploadToCloudinary ,deleteFromCloudinary, getPublicIdFromUrl };