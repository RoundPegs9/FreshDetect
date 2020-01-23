var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var QueueSchema = new mongoose.Schema({
    product_id : String,
    time_Started : Number,
});
QueueSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Queue", QueueSchema); 