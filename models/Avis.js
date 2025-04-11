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
    }
})

module.exports = mongoose.model("Avis",SchemaAvis);