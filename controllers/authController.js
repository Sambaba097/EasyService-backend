const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Inscription
exports.register = async (req, res) => {

  try {
    const { nom, prenom, email, password, role } = req.body;

    console.log(req.body);
    // Vérifier que le mot de passe est bien fourni
    if (!password) {
        return res.status(400).json({ message: 'Le mot de passe est requis' });
    }
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Créer un nouvel utilisateur
    const user = new User({ nom, prenom, email, password, role });
    await user.save();

    // Générer un token JWT
    const token = jwt.sign({ userId: user._id, role: user.role, email: user.email, prenom: user.prenom}, process.env.JWT_SECRET , { expiresIn: '1h' });

    res.status(201).json({ message: 'Utilisateur créé avec succès', token, 
        user:{
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
        }
     });
  } catch (err) {
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Données invalides: Erreur lors de la création de l\'utilisateur', error: err.message });
    }
    res.status(500).json({ message: 'Erreur lors de l\'inscription.' });
  }
};

// Connexion
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifier que email et password sont fournis
    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
    }
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    // Générer un token JWT
    const token = jwt.sign({ userId: user._id, role: user.role, email: user.email, prenom: user.prenom }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // Renvoyer également les informations de l'utilisateur
    res.status(200).json({message: 'Connexion reussi!', token, 

        user: {
            email: user.email,
            prenom: user.prenom,
            role: user.role,
        }
     });

     // Redirection en fonction du rôle
    const redirectUrl = '';
    switch (user.role) {
      case 'technicien':
        redirectUrl = '/dashboard/technicien';
        break;
      case 'client':
        redirectUrl = '/dashboard/client';
        break;
      case 'admin':
        redirectUrl = '/dashboard/admin';
        break;
      default:
        return res.status(400).json({ message: 'Rôle non reconnu' });
    }

    // Renvoyer le token et l'URL de redirection
    res.status(200).json({ message: 'Connexion réussie!', token, redirectUrl });

  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la connexion.' });
  }
};