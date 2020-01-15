var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var QueueSchema = new mongoose.Schema({
    isValidated : false,
    name : String,
    password : String,
    username: { type: String, lowercase: true },
    phone   : String,
    profilePicture : {type:String},
    created : String,
    _type : {type: Boolean}
});
QueueSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Queue", QueueSchema);