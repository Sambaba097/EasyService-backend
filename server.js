const express =require('express');
const app = express();
const mongoose =require('mongoose');
const factureRoutes = require("./routes/factureRoutes");
const demandeRoutes = require("./routes/demandeRoutes");
const MONGODB_URI="mongodb+srv://Fatima:easyservice@cluster0.6xoab.mongodb.net/EasyService?retryWrites=true&w=majority&appName=Cluster";

app.use(express.json());
mongoose.connect(MONGODB_URI).then(()=> {
    console.log("Connexion a la base de donnee reussie")
})
.catch((error) => {
    console.log("Connexion echouee");
})

app.use("/api/demandes", demandeRoutes);
app.use("/api/factures",factureRoutes)

app.listen(5000,()=>{
    console.log('serveur sur http://localhost:5000');
});