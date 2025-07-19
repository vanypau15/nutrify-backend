const mongoose = require('mongoose');

const foodSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    protein:{
        type:Number,
        required:true
    },
    carbohydrates:{
        type:Number,
        required:true
    },
    fat:{
        type:Number,
        required:true
    },
    fiber:{
        type:Number,
        required:true
    },
},{timestamps:true})

const foodModel = mongoose.model("foods",foodSchema)

module.exports = foodModel;