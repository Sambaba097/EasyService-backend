const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { createOdooContact } = require("../utils/odoo"); // Assurez-vous que le chemin est correct
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

// Inscription
exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, password, role } = req.body;

    console.log(req.body);

    if (!password) {
      return res.status(400).json({ message: "Le mot de passe est requis" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Créer un nouvel utilisateur
    const user = new User({ nom, prenom, email, password, role });
    await user.save();

    // 👉 Appel à Odoo pour créer un contact
    const odooId = await createOdooContact(user);
    user.odooId = odooId;
    await user.save();

    // Générer un token JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        prenom: user.prenom,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: {
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        odooId: user.odooId,
      },
    });

  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message:
          "Données invalides: Erreur lors de la création de l'utilisateur",
        error: err.message,
      });
    }
    console.error("Erreur dans register :", err);
    res.status(500).json({ message: "Erreur lors de l'inscription." });
  }
};

// Connexion
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifier que email et password sont fournis
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // Générer un token JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        prenom: user.prenom,
        nom: user.nom,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    // Renvoyer également les informations de l'utilisateur
    res.status(200).json({
      message: "Connexion reussi!",
      token,
      user: {
        id: user._id,
        email: user.email,
        prenom: user.prenom,
        nom: user.nom,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err); // Log l'erreur
    res
      .status(500)
      .json({ message: "Erreur lors de la connexion.", error: err.message });
  }
};

// Récupérer tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    // Récupérer tous les utilisateurs depuis la base de données
    const users = await User.find({});

    // Renvoyer la liste des utilisateurs
    res
      .status(200)
      .json({ message: "Liste des utilisateurs récupérée avec succès", users });
  } catch (err) {
    console.error("Erreur lors de la récupération des utilisateurs :", err);
    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs.",
      error: err.message,
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    const user = await User.findById(req.params.id).select("-password"); // Exclut le mot de passe

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur lors de la récupération de l'utilisateur",
      error: err.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    // Vérifier que l'ID est bien une chaîne valide
    if (!req.params.id || typeof req.params.id !== "string") {
      return res.status(400).json({ message: "ID de user invalide" });
    }

    // Vérifier le format de l'ID (24 caractères hexadécimaux)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Format d'ID de user invalide" });
    }

    const user = await User.findById(id);

    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json("Mise à jours réussis");
  } catch {
    res.status(500).json({
      message: "Erreur lors de la mise à jour des informations de l'utilisateur",
      error: err.message,
    });
  }
};

const transporter = require('../config/email');
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet email." });
    }

    // 2. Générer un token JWT (expire dans 1h)
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Sauvegarder le token dans la base de données
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    // 4. Envoyer l'email
    const resetUrl = `https://easyservice-29e5.onrender.com/?newPassToken=${resetToken}`;

    await transporter.sendMail({
      from: '"EASY SERVICE" <baelhadjisamba40@gmail.com>',
      to: user.email,
      subject: "Réinitialisation de mot de passe",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <p>Bonjour <span style="font-weight: bold;">${user.prenom}</span>,</p>
          <p>Cliquez <a style="text-decoration: underline; color:#f97316" href="${resetUrl}">sur ce lien</a> pour réinitialiser votre mot de passe.</p>
          <p>Ce lien expire dans <span style="font-weight:bold;">1 heure</span>.</p>
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        
          <p>Si vous ne parvenez pas à cliquer sur le lien, copiez et collez l'URL suivante dans votre navigateur :</p>
           <p>${resetUrl}</p>

          <p>Ce message a été envoyé automatiquement, ne répondez pas.</p>
          <p>Merci,</p>
          <p>L'équipe <a href="https://easyservice-29e5.onrender.com" style="font-weight:bold; color:#f97316;">EASY SERVICE</a></p>
          <img src="https://res.cloudinary.com/ds5zfxlhf/image/upload/v1745237611/Logo-EasyService.png" alt="Logo" style="margin-top: 10px;" />
          
        </div>
      `,
    });

    res.status(200).json({ message: "Un email de réinitialisation a été envoyé." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// réinitialisation du mot de passe
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // 1. Vérifier et décoder le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Vérifier si le token est toujours valide en base
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré." });
    }

    // 3. Mettre à jour le mot de passe
    user.password = newPassword;
    user.resetPasswordToken = undefined;  // Invalider le token
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error(error);
    if (error.name === 'TokenExpiredError') {
      res.status(400).json({ message: "Le lien a expiré." });
    } else if (error.name === 'JsonWebTokenError') {
      res.status(400).json({ message: "Token invalide." });
    } else {
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
};

// Mettre à jour la photo de profil de l'utilisateur
exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id; // récupéré après authentification 
    const file = req.file; // image envoyée depuis un formulaire (Multer doit être utilisé)

    if (!file) {
      return res.status(400).json({ message: 'Aucune image envoyée.' });
    }

    // Trouver l'utilisateur
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Si l'utilisateur a déjà une image, on supprime l'ancienne sur Cloudinary
    if (user.image && user.image.publicId) {
      await deleteFromCloudinary(user.image.publicId);
    }

    // Upload la nouvelle image
    const uploadedResponse = await uploadToCloudinary(req.file.buffer, 'profiles');

    // Extraire le publicId
    const newPublicId = getPublicIdFromUrl(uploadedResponse);

    // Mise à jour du modèle User
    user.image = {
      url: uploadedResponse,
      publicId: newPublicId,
    };

    await user.save();

    res.status(200).json({ message: 'Photo de profil mise à jour avec succès.', image: user.image });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la photo de profil:', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
