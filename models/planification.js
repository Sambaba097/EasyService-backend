const User = require("./users"); 

const planificationSchema = new mongoose.Schema({
    datePlanifiee: { type: Date, required: true },
    technicienAssigne: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
    demande: { type: mongoose.Schema.Types.ObjectId, ref: "Demande", required: true },
});


const Planification = mongoose.models.Planification || mongoose.model("Planification", planificationSchema);
    module.exports = Planification;
