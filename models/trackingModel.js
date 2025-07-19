const mongoose = require('mongoose');
const trackingSchema = mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'users',
        required:true
    },
    food:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'foods',
        required:true
    },
    eatenDate:{
        type:String,
        default:new Date().toLocaleDateString()
    },
    quantity:{
        type:Number,
        min:1,
        required:true
    }

},{timestamps:true})

const trackingModel = mongoose.model("tracking",trackingSchema);

module.exports = trackingModel;