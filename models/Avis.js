const mongoose = require('mongoose');


const SchemaAvis = new mongoose.Schema({
    note:{
        type:Number,
        required:true,
        min: 1,
        max: 5
    },
    commentaire:{
        type:String,
        required:true
    },
    dateSoumission:{
        type:Date,
        default:Date.now
    },
    client:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    service:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },
    technicien:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "technicien",
        required: true
    },
    demande:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Demande",
        required: true
    }
})

module.exports = mongoose.model("Avis",SchemaAvis);