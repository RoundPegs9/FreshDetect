var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var BidSchema = new mongoose.Schema({
    Meta : 
    {
        produce : String, // name of the item
        quantity : Number, //number of items of produce
        bidding_price : Number, // original bidding price set by the owner.
        image : String, //image of the produce
        expiry : Number,
        from : String, //new
        to : String, //new
        weight : Number, //new
        created : Number,
        live_image : String, // image taken from Fresh Detect IoT sensors.
        ripeness_percentage : {type : Number, default : 0.0}
    },
    
    Bids : // list of people who bid for the product.
    [
        {
            user_id : String, // id of the person who bid
            bidding_price : Number, // price the person bid with
            freshness_score : Number, // minimum freshness level.
            profilePicture : String, 
            name : String, // name of the bidder
            email : String, // contact information
        }
    ],
    Owner : 
    {
        user_id : String,
        name : String,
        email : String,
        profilePicture : String,
    },
});
BidSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Bid", BidSchema);