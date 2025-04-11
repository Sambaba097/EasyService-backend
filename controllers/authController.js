const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// Inscription
exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, password, role } = req.body;

    console.log(req.body);
    // Vérifier que le mot de passe est bien fourni
    if (!password) {
      return res.status(400).json({ message: "Le mot de passe est requis" });
    }
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Créer un nouvel utilisateur
    const user = new User({ nom, prenom, email, password, role });
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
      token,
      user: {
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
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
    // Redirection en fonction du rôle
    let redirectUrl = "";
    switch (user.role) {
      case "technicien":
        redirectUrl = "/dashboard/technicien";
        break;
      case "client":
        redirectUrl = "/dashboard/client";
        break;
      case "admin":
        redirectUrl = "/dashboard/admin";
        break;
      default:
        return res.status(400).json({ message: "Rôle non reconnu" });
    }
    // Renvoyer également les informations de l'utilisateur
    res.status(200).json({
      message: "Connexion reussi!",
      token,
      redirectUrl,
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
