var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    isValidated : false,
    name : String,
    password : String,
    username: { type: String, lowercase: true },
    phone   : String,
    profilePicture : {type:String, default : "https://cdn150.picsart.com/upscale-245339439045212.png?r1024x1024"},
    created : String
});
UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);