
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