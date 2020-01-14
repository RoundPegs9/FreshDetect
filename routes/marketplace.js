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

function toTimestamp(strDate){
    var localDateString = strDate;
    var localDateStringFormat = 'MMMM DD, YYYY, h:mm  a';
    var utcMoment = moment.utc(moment(localDateString, localDateStringFormat ).utc().format('YYYY-MM-DD HH:mm:ssZ'))
    var x = utcMoment._d;
    var utc_offset = moment_tz.tz.zone('America/New_York').utcOffset(x);    
    var dateUTC = Math.floor(parseInt((x.getTime() + x.getTimezoneOffset()*60*1000)/1000));
    var dateEST = dateUTC - utc_offset*60; 
    return dateEST;   
}
function nowTime()
{
    var newDate = new Date();
    return Math.floor(newDate/1000);
}
function deleteFile(req){
    if(req.file != undefined)
    {
        fs.unlink(req.file.path, (err) => {
            if (err) throw err;
            console.log('successfully deleted the L O C A L file');
            });
    }
    else
    {
        console.log("No image found");
    }

}

// Configuration of Cloudinary...
cloudinary.config({ 
    cloud_name: process.env.cloudinaryCloudName, 
    api_key: process.env.cloudinaryAPIkey,
    api_secret: process.env.cloudinaryAPIsecret
});

// Multer configuration
const storage = multer.diskStorage({
    destination : './public/uploads',
    filename : function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + '-' + cryptoRandomString(({length: 29, characters: '1234567890'})) + path.extname(file.originalname));
    } 
});

const upload = multer({
    storage : storage,
    limits: { fileSize: 1024*1024*10},
    fileFilter: async function(req, file, cb){
        checkFileType(file, cb);
    }
});

function checkFileType(file, cb){
    // Allowed ext
    const filetypes = /jpeg|jpg|png/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);
    console.log("Form the function", mimetype, extname);
    if(mimetype && extname){
      return cb(null,true);
    } else {
      console.log("In here...");
      return cb('File type not supported. File should be an image with .jpg, .png, or .jpeg extension');
    }
  }


router.get("/", (req, res)=>{
    Marketplace.find({"Meta.expired" : {"$gt" : nowTime()}}).sort({'Meta.created':-1}).exec((err, bids)=>{
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

router.post("/:show/bid", middlewareObj.isUserRegistered, (req, res)=>{
    const id = req.params.show;
    Marketplace.findById(id, (err, foundBid)=>{
        if(err || !foundBid)
        {
            req.flash("error", "Produce not found| Make sure you have the right Produce ID.");
            return res.redirect("/marketplace");
        }
        if(req.user._id != foundBid.Owner.user_id)
        {
            const price = parseFloat(req.body.bidding_price);
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
            mailingSystem.sendBidEmail(req.user.name, foundBid.Owner.name, foundBid.Owner.email, foundBid.Meta.produce, foundBid._id, foundBid.Meta.bidding_price);
            req.flash("success", "Bid Placed on " + foundBid.Meta.produce + " successfully| Notification sent.");
            return res.redirect("/marketplace/" + id);
        }
        else
        {
            req.flash("error", "Can't place a bid on your own items.");
            return res.redirect(req.get('referrer'));
        }
    });
});

router.post("/:show/cancelbid", middlewareObj.isUserRegistered, (req, res)=>{
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
            req.flash("success", "Bid Cancelled successful");
            return res.redirect("/marketplace/" + id);
        }
        else
        {
            req.flash("error", "Can't cancel a bid on your own items.");
            return res.redirect(req.get('referrer'));
        }
    });
});

router.get("/:show/edit", middlewareObj.isUserRegistered, (req, res)=>{
    const id = req.params.id;
    Marketplace.findById(id, (err, foundBid)=>{
        if(err || !foundBid)
        {
            req.flash("error", "Produce not found| Make sure you have the right Produce ID.");
            return res.redirect("/marketplace");
        }
        if (foundBid.Owner.user_id == req.user._id) 
        {
            console.log("Taking to edit route...");
            return res.redirect("Marketplace/edit", {data : foundBid});
        }
        else
        {
            req.flash("error", "You don't have enough permissions.");
            return res.redirect("back");
        }
    });
});

router.post("/:show/edit", middlewareObj.isUserRegistered, upload.single('produce_picture'), (req, res)=>{
    const id = req.params.show;
    Marketplace.findById(id, (err, foundBid)=>{
        if(err || !foundBid)
        {
            req.flash("error", "Produce not found| Make sure you have the right Produce ID.");
            return res.redirect("/marketplace");
        }
        if(req.user._id == foundBid.Owner.user_id)
        {
            if (req.file != undefined) 
            {
                var cloudinaryLink = "./" + req.file.path;
                console.log(cloudinaryLink);
                cloudinary.v2.uploader.upload(cloudinaryLink, {"crop":"limit","tags":[username, name, 'produce', 'updated produce'], folder: `produce/${username.toLowerCase().split("@")[0]} - ${name}`,use_filename: false}, function(error, result) {
                    if(error)
                    {
                        console.log(error);
                        // flash for cloudinary Upload problem...
                        deleteFile(req);
                        req.flash("error","Image Upload error|Something went wrong while trying to upload your Produce picture onto our server.<br>Possible error: "+error);
                        return res.redirect(req.get('referer'));
                    }
                    console.log(profilePicture);
                    deleteFile(req);
                    var edited_data = 
                    {
                        produce : req.body.produce, // name of the item
                        description : req.body.description, //description of the produce
                        quantity : req.body.quantity, //number of items of produce
                        bidding_price : req.body.bidding_price, //current (default = minimum) bidding price per unit.
                        image : result.secure_url,
                        created : foundBid.Meta.created,
                        live_image : foundBid.Meta.live_image,
                        expired : toTimestamp(req.body.expired),
                        ripeness_percentage : foundBid.Meta.ripeness_percentage,
                    }
                    Marketplace.findByIdAndUpdate(id, {Meta : edited_data}, (err, updatedAuction)=>{
                        if(err)
                        {
                            throw new Error(err.message);
                        }
                        console.log("Item Updated.");
                        return res.redirect("/marketplace/" + id);
                    });
                });  
            }
            else
            {
                var edited_data = 
                {
                    produce : req.body.produce, // name of the item
                    description : req.body.description, //description of the produce
                    quantity : req.body.quantity, //number of items of produce
                    bidding_price : req.body.bidding_price, //current (default = minimum) bidding price per unit.
                    image : foundBid.Meta.image,
                    created : foundBid.Meta.created,
                    expired : toTimestamp(req.body.expired)
                }
                Marketplace.findByIdAndUpdate(id, {Meta : edited_data}, (err, updatedAuction)=>{
                    if(err)
                    {
                        throw new Error(err.message);
                    }
                    console.log("Item Updated.");
                    return res.redirect("/marketplace/" + id);
                }); 
            }
        }
        else
        {
            req.flash("error", "You don't have enough permissions.");
            return res.redirect("back");
        }
    });
});

router.post("/:show/delete", middlewareObj.isUserRegistered, (req, res)=>{
    const id = req.params.show;
    Marketplace.findById(id, (err, foundBid)=>{
        if(err || ! foundBid)
        {
            req.flash("error", "Somehting went wrong| Make sure you have the proper crediential and/or correct Product ID.");
            return res.redirect("back");
        }
        if(req.user._id == foundBid.Owner.user_id)
        {
            Marketplace.findByIdAndDelete(id, (err, deletedBid)=>{
                if (err) {
                    throw new Error(err.message);
                }
                console.log("Deleted product with Name : ", deletedBid.Meta.produce);
                req.flash("success", "Deleted " + foundBid.Meta.produce + "|");
                return res.redirect("/marketplace");
            });
        }
        else
        {
            req.flash("error", "You don't have enough permissions.");
            return res.redirect("back");
        }
    });
});

router.post("/new", middlewareObj.isUserRegistered, upload.single("produce_picture"), (req, res)=>{
    if(req.file != undefined)
    {
        var cloudinaryLink = "./" + req.file.path;
        cloudinary.v2.uploader.upload(cloudinaryLink, {"crop":"limit","tags":[username, name, 'produce', 'updated produce'], folder: `produce/${username.toLowerCase().split("@")[0]} - ${name}`,use_filename: false}, function(error, result) {
            if(error)
            {
                console.log(error);
                // flash for cloudinary Upload problem...
                deleteFile(req);
                req.flash("error","Image Upload error|Something went wrong while trying to upload your Produce picture onto our server.<br>Possible error: "+error);
                return res.redirect(req.get('referer'));
            }
            var data = 
            {
                Meta : 
                {
                    produce : req.body.produce, // name of the item
                    description : req.body.description, //description of the produce
                    quantity : req.body.quantity, //number of items of produce
                    bidding_price : (req.body.bidding_price), // original bidding price set by the owner.
                    image : result.secure_url, //image of the produce
                    expiry : toTimestamp(req.body.expired),
                    created : nowTime(),
                    live_image : "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimage.freepik.com%2Ffree-icon%2Fempty-set-mathematical-symbol_318-59301.jpg&f=1&nofb=1"
                },
                Bids : [],
                Owner : 
                {
                    user_id : req.user._id,
                    name : req.user.name,
                    email : req.user.username,
                    profilePicture : req.user.profilePicture,
                }
            }
            function createProduct(product_information) {
                Marketplace.create(product_information, (err, createdProduct)=>{
                    if(err)
                    {
                        if (err.code === 11000) {
                            //mongo duplicate index error
                            Marketplace.collection.dropIndex('username_1', (err, indexDropped)=>{
                                if(err)
                                {
                                    throw new Error(err.message);
                                }
                                else
                                {
                                    createProduct(product_information);
                                }
                            });
                        }
                        else
                        {
                            console.log("Some other general error ~ 326.");
                            throw new Error(err.message);
                        }
                    }
                    else
                    {
                        console.log("New Product created.");
                    }
                });
            }
            createProduct(data);
            req.flash("success", "Product Added|Your product has been added.");
            return res.redirect("/marketplace");
        });
    }
    else
    {
        req.flash("warning", "Missing Produce Picture|Please select an image for your product.");
        return res.redirect(req.get('referrer'));
    }
    
    
});

router.get("/new", middlewareObj.isUserRegistered, (req, res)=>{
    return res.render("Marketplace/new");
});

module.exports = router;