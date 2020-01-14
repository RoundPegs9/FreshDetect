const express = require("express"),
      passport = require("passport"),
      jwt       = require("jsonwebtoken"),
      methodOverride   = require("method-override"),
      mailingSystem = require("../middleware/mailingSystemFunctions"),
      router  = express.Router(),
      moment  = require("moment"),
      multer  = require("multer"),
      middlewareObj = require("../middleware/index"),
      path    = require("path"),
      cryptoRandomString = require("crypto-random-string"),
      cloudinary = require("cloudinary"),
      Marketplace = require("../models/Bid"),
      User = require("../models/User"),
      fs      = require("fs");

router.get("/", (req, res)=>{
    Marketplace.find({},(err, bids)=>{
        if(err)
        {
            throw new Error(err.message);
        }
        return res.render("Marketplace/index",{data : bids});
    });
});

router.get("/:id",(req, res)=>{
    const id = req.params.id;
    Marketplace.findById(id, (err, foundBid)=>{
        if(err || !foundBid)
        {
            req.flash("error", "Produce not found| Make sure you have the right Produce ID.");
            return res.redirect("/marketplace");
        }
        return res.render("Marketplace/show", {data : foundBid});
    });
});

router.post(":/show/bid", middlewareObj.isUserRegistered, (req, res)=>{
    const id = req.params.show;
    Marketplace.findById(id, (err, foundBid)=>{
        if(err || !foundBid)
        {
            req.flash("error", "Produce not found| Make sure you have the right Produce ID.");
            return res.redirect("/marketplace");
        }
        if(req.user._id != foundBid.Owner.user_id)
        {
            const price = req.body.bidding_price;
            var bid_info = 
            {
                user_id : req.user._id,
                bidding_price : price,
                profilePicture : req.user.profilePicture,
                name : req.user.name,
                email : req.user.email
            };
            foundBid.Bids.push(bid_info);
            foundBid.save();
        }
        else
        {
            req.flash("error", "Can't place a bid on your own items.");
            return res.redirect(req.get('referrer'));
        }
    });
});

router.post(":/show/cancelbid", middlewareObj.isUserRegistered, (req, res)=>{
    const id = req.params.show;
    Marketplace.findById(id, (err, foundBid)=>{
        if(err || !foundBid)
        {
            req.flash("error", "Produce not found| Make sure you have the right Produce ID.");
            return res.redirect("/marketplace");
        }
        if(req.user._id != foundBid.Owner.user_id)
        {
            for(var i = 0; i < foundBid.Bids.length; i++)
            {
                if(foundBid.Bids[i].user_id == req.user._id)
                {
                    foundBid.Bids.splice(i, 1);
                }
            }
            foundBid.save();
        }
        else
        {
            req.flash("error", "Can't cancel a bid on your own items.");
            return res.redirect(req.get('referrer'));
        }
    });
});

router.post(":/show/edit", middlewareObj.isUserRegistered, upload.single('produce_picture'), (req, res)=>{
    const id = req.params.show;
    Marketplace.findById(id, (err, foundBid)=>{
        if(err || !foundBid)
        {
            req.flash("error", "Produce not found| Make sure you have the right Produce ID.");
            return res.redirect("/marketplace");
        }
        if(req.user._id == foundBid.Owner.user_id)
        {
            var edited_data = 
            {
                produce : req.body.produce, // name of the item
                description : req.body.description, //description of the produce
                quantity : req.body.quantity, //number of items of produce
                bidding_price : req.body.bidding_price, //current (default = minimum) bidding price per unit.
                // image : req.b, //image of the produce
            }
            
        }
        else
        {
            req.flash("error", "You don't have enough permissions.");
            return res.redirect("back");
        }
    });
});

module.exports = router;