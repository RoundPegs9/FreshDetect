const express = require("express"),
      passport = require("passport"),
      jwt       = require("jsonwebtoken"),
      methodOverride   = require("method-override"),
      mailingSystem = require("../middleware/mailingSystemFunctions");
      router  = express.Router(),
      moment  = require("moment"),
      multer  = require("multer"),
      middlewareObj = require("../middleware/index"),
      path    = require("path"),
      cryptoRandomString = require("crypto-random-string"),
      cloudinary = require("cloudinary"),
      fs      = require("fs");


const secretKey = "";

router.get("/about",(req, res)=>{
    return res.render("./partials/landing/about");
});
router.get("/start", (req, res)=>{
    return res.render("./partials/auth");
});


module.exports = router;