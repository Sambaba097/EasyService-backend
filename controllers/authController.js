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

    // Vérifier si l'utilisateur est bloqué
    if (user.bloque) {
      return res.status(403).json({ 
        message: "Votre compte a été bloqué. Contactez l'administrateur." 
      });
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
    const users = await User.find({}).select("-password");

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

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({
      message: "Utilisateur connecté récupéré avec succès",
      user,
    });
  } catch (err) {
    console.error("Erreur dans getCurrentUser :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};



// const Demande = require("../models/Demande");
// const Avis = require("../models/Avis");

// exports.updateUser = async (req, res) => {
//   console.log(req.body);
//   try {
//     const { id } = req.params;
//     const updateData = { ...req.body };

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "ID utilisateur invalide" });
//     }

//     const existingUser = await User.findById(id);
//     if (!existingUser) {
//       return res.status(404).json({ message: "Utilisateur non trouvé" });
//     }

//     const roleChanged = existingUser.role !== updateData.role;

//     if (roleChanged && updateData !== "" && updateData.role !== "" && updateData !== null) {
//       const { prenom, nom, email, image } = existingUser;

//       // 1. Supprimer les demandes et avis liés à l'utilisateur
//       await Demande.deleteMany({ utilisateur: existingUser._id });
//       await Avis.deleteMany({ utilisateur: existingUser._id });

//       // 2. Supprimer l'utilisateur
//       await User.findByIdAndDelete(id);

//       // 3. Créer un nouvel utilisateur avec les nouvelles infos
//       const newUser = new User({
//         ...updateData,
//         prenom,
//         nom,
//         email,
//         password: "passer",
//         image
//       });

//       await newUser.save();

//       // 4. Créer un nouveau contact Odoo
//       const odooId = await createOdooContact(newUser);
//       newUser.odooId = odooId;
//       await newUser.save();

//       return res.status(200).json({
//         message: "Rôle modifié. Nouvel utilisateur créé avec contact Odoo.",
//         user: {
//           _id: newUser._id,
//           email: newUser.email,
//           role: newUser.role,
//           prenom: newUser.prenom,
//           nom: newUser.nom,
//           odooId: newUser.odooId,
//         }
//       });
//     }

//     // Mise à jour classique si pas de changement de rôle
//     const updatedUser = await User.findByIdAndUpdate(id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({
//       message: "Utilisateur mis à jour avec succès",
//       user: updatedUser.select("-password")
//     });

//   } catch (err) {
//     console.error("Erreur updateUser:", err);
//     res.status(500).json({
//       message: "Erreur lors de la mise à jour",
//       error: err.message
//     });
//   }
// };

// Mise à jour normale du profil
const multer = require('multer');
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // Pour les champs texte
    const file = req.file; // Pour le fichier image

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    // Si un fichier image est envoyé
    if (file) {
      // Upload vers Cloudinary ou stockage local
      const imageUrl = await uploadToCloudinary(file.buffer, "Profiles");
      updateData.image = { url: imageUrl };
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      message: "Profil mis à jour",
      user: updatedUser
    });

  } catch (err) {
    console.error("Erreur updateUserProfile:", err);
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour",
      error: err.message
    });
  }
};

const Avis = require("../models/Avis");
// Changement de rôle spécial
exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { newRole } = req.body;
    console.log(req.body);

    // Validation
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // 1. Sauvegarder les données nécessaires
    const { prenom, nom, email, image } = existingUser;

    // 2. Supprimer les dépendances
    if(Demande.find({ utilisateur: id }).length > 0 || Avis.find({ utilisateur: id }).length > 0) {
      await Demande.deleteMany({ utilisateur: id });
      await Avis.deleteMany({ utilisateur: id });
    }

    // 3. Supprimer l'ancien utilisateur
    await User.findByIdAndDelete(id);

    // 4. Créer le nouvel utilisateur
    const newUser = new User({
      prenom,
      nom,
      email,
      password: "passer",
      image,
      role: newRole
    });

    await newUser.save();

    // 5. Recréer le contact Odoo si nécessaire
    const odooId = await createOdooContact(newUser);
    newUser.odooId = odooId;
    await newUser.save();

    res.status(200).json({
      message: "Rôle changé avec succès. Nouvel utilisateur créé.",
      user: {
        _id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        prenom: newUser.prenom,
        nom: newUser.nom,
        odooId: newUser.odooId,
      }
    });

  } catch (err) {
    console.error("Erreur changeUserRole:", err);
    res.status(500).json({
      message: "Erreur lors du changement de rôle",
      error: err.message
    });
  }
};


// Fonction pour ajouter un attribut "odooId" à tous les utilisateurs
// const addAttributeToAllUsers = async () => {
//   try {
//     const result = await User.updateMany(
//       { odooId: { $exists: false } }, // s'assure qu'on ne modifie pas ceux qui l'ont déjà
//       { $set: { odooId: false } }        // ou une autre valeur par défaut
//     );
//     console.log(${result.modifiedCount} utilisateurs mis à jour.);
//   } catch (err) {
//     console.error("Erreur de mise à jour :", err);
//   }
// };

// addAttributeToAllUsers();

// Fonction pour supprimer un attribut "odooId" à tous les utilisateurs
// const addAttributeToAllUsers = async () => {
//   try {
//     const result = await User.updateMany(
//       { odooId: { $exists: true } }, // s'assure qu'on ne modifie pas ceux qui l'ont déjà
//       { $unset: { odooId: "" } }        // ou une autre valeur par défaut
//     );
//     console.log(`${result.modifiedCount} utilisateurs mis à jour.`);
//   } catch (err) {
//     console.error("Erreur de mise à jour :", err);
//   }
// };

// addAttributeToAllUsers();


// Mettre à jours tous les odooId des Users
// const updateOdooIdsForAllUsers = async () => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
  
//   try {
//     const usersWithoutOdooId = await User.find(
//       { odooId: { $exists: false } },
//       null,
//       { session }
//     );

//     console.log(`Found ${usersWithoutOdooId.length} users without odooId`);

//     let successCount = 0;
//     let failCount = 0;
//     const failedEmails = [];

//     for (const user of usersWithoutOdooId) {
//       try {
//         const odooData = {
//           prenom: user.prenom,
//           nom: user.nom,
//           email: user.email,
//           role: user.role
//         };

//         // MODIFICATION CLÉ : Adaptation à la réponse réelle d'Odoo
//         const odooId = await createOdooContact(odooData);
        
//         if (odooId) { // Vérification simplifiée
//           await User.updateOne(
//             { _id: user._id },
//             { $set: { odooId: odooId } }, // Directement utiliser l'ID retourné
//             { session }
//           );
//           successCount++;
//           console.log(`Successfully updated ${user.email} with odooId: ${odooId}`);
//         } else {
//           throw new Error('Empty Odoo ID received');
//         }
//       } catch (err) {
//         failCount++;
//         failedEmails.push(user.email);
//         console.error(`Failed to update ${user.email}:`, err.message);
//       }
//     }

//     await session.commitTransaction();
    
//     console.log(`
//       Process completed:
//       - Success: ${successCount}
//       - Failed: ${failCount}
//       ${failCount > 0 ? `- Failed emails: ${failedEmails.join(', ')}` : ''}
//     `);

//     return {
//       total: usersWithoutOdooId.length,
//       success: successCount,
//       failed: failCount,
//       failedEmails
//     };

//   } catch (err) {
//     await session.abortTransaction();
//     console.error("Transaction aborted:", err);
//     throw err;
//   } finally {
//     session.endSession();
//   }
// };

// // Pour exécuter la fonction
// updateOdooIdsForAllUsers()
//   .then(result => console.log('Final result:', result))
//   .catch(err => console.error('Global error:', err));

// Bloquer un utilisateur
exports.blockUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { bloque: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({ 
      message: "Utilisateur bloqué avec succès",
      user 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur lors du blocage de l'utilisateur",
      error: err.message
    });
  }
};

// Débloquer un utilisateur
exports.unblockUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { bloque: false },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({ 
      message: "Utilisateur débloqué avec succès",
      user 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur lors du déblocage de l'utilisateur",
      error: err.message
    });
  }
};


const transporter = require('../config/email');
const Demande = require("../models/Demande");
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
    const resetUrl = `https://easyservice-zhmc.onrender.com/?newPassToken=${resetToken}`;

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
          <p>L'équipe <a href="https://easyservice-zhmc.onrender.com" style="font-weight:bold; color:#f97316;">EASY SERVICE</a></p>
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
