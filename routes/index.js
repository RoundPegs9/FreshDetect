const express = require("express"),
      passport = require("passport"),
      jwt       = require("jsonwebtoken"),
      methodOverride   = require("method-override"),
      mailingSystem = require("../middleware/mailingSystemFunctions"),
      router  = express.Router(),
      moment  = require("moment"),
      User = require("../models/User"),
      multer  = require("multer"),
      request = require("request"), 
      middlewareObj = require("../middleware/index"),
      path    = require("path"),
      cryptoRandomString = require("crypto-random-string"),
      cloudinary = require("cloudinary"),
      fs      = require("fs");

const secretKey = "scrkeyoiash389wh31207891ios=iqasimwani&jda08124sadjas.todayis14jan2020,330am.";
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


router.get("/about",(req, res)=>{
    return res.render("./partials/landing/about");
});
router.get("/start", (req, res)=>{
    if(!req.user)
    {
        return res.render("./partials/auth");    
    }
    else
    {
        req.flash("warning", "You're already logged in.");
        return res.redirect("/marketplace");
    }
});

router.get("/startnew", (req, res)=>{
    if(!req.user)
    {
        console.log("IN HERE...");
        return res.render("./partials/newauth");    
    }
    else
    {
        req.flash("warning", "You're already logged in.");
        return res.redirect("/marketplace");
    }
});


//Authentication Routes
router.post("/register/newUser/base-none", function(req,res){
    if(!req.user){
        if(!req.body.email && !req.body.name)
        {
            console.log("In here", req.body);
            req.flash("error", "Missing Credentials.|Please fill out the form as requested.");
            return res.redirect("/");
        }
        else
        {
            var e = req.body.email.split("@")[1];
            if(req.body.name.trim().split(" ").length <= 1)
            {
                console.log("full name not entered.");
                req.flash("info","Full name not entered.|Please enter your full name.<br>Example : Nikola Tesla");
                return res.redirect("/start");
            }   
            console.log(e);
            var user = {
                email : req.body.email.toLowerCase(),
                name  : req.body.name.trim(),
                isValidated : false
            };
            console.log(user.name);
            User.findOne({username:user.email}, function(err, foundUser){
                if(err)
                {
                    console.log("Error. From signup page");
                    req.flash("warning","Ouch!|Something went wrong. Please be patient and try again later. <br><strong>Please leave us a feedback so we can solve your problem</strong>, if it persists.");
                    return res.redirect(req.get("referer"));
                }
                else if(foundUser && foundUser.isValidated === true)
                {
                    // flash for claiming user account exists!
                    console.log(foundUser.isValidated, " heck yeah!");
                    req.flash("warning","Account Exists!|Sorry, but this email address is already registered. <br>Please create a new account or log in with the entered email address.");
                    return res.redirect("/start");
                }
                else
                {
                    console.log("This is indeed a potentially new User");
                    var token = jwt.sign(user,secretKey, { expiresIn: '1h' });
                    mailingSystem.signUpConfirmationEmail(token, user.email, user.name);
                    let mail = user.email;
                    return res.redirect(`/check-your-email/${mail}/for-confirmation-link/${token}`); 
                }   
            });
        }    
    }
    else
    {
        req.flash("warning","Already Logged in| Seems like you are already logged in.");
        return res.redirect("/marketplace");
    }
});

router.get("/activate/email/freshdetect/qw", function(req, res){
    var token = req.query.token;
    jwt.verify(token, secretKey, function(err, decoded){
        if(err && err.message === 'jwt expired')
        {
            // add flash indicating link expired
            console.log('Link Expired');
            return res.send("Sorry! Authentication link has expired. Timeout after 1 hour. Sign up again at root link<br><a href='/start'>Take me there!</a>");
        }
        else if(!err)
        {
            User.findOne({username:decoded.email}, function(err, foundUser){
                if(err)
                {
                    console.log(err.message);
                    req.flash("NOOooo!|Something just went wrong. We all feel the pain. Please try again later.");
                    res.redirect("/start");
                }
                else if(foundUser && foundUser.isValidated === true)
                {
                    // flash for declaring "You have already created an account"
                    req.flash("error","Account Exists!|That account exists. Sign up instead?");
                    return res.redirect("/start");
                }
                else
                {
                    console.log("In here.");
                    return res.render("./partials/signupPage", {token:token});
                }
            });
        }
        else
        {
            // general error --> Add Flash
            req.flash("error","$#!T|That wasn't supposed to happen. Please try again later.");
            return res.redirect("/start");
        }
        
    });
});

passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser((id, done) => {
    User.findById(id).then(user => done(null, user));
  });
  
  
router.post("/activate/confirm/email/:token/getStarted", upload.single('profilePicture'), function(req, res, next){
    var token = req.params.token;
    jwt.verify(token, secretKey, function(err, verify){
        if(err)
        {
            console.log("Error from post request of Signing up. Must be using postman! ", err);
            req.flash("error","Error reported|Something went wrong. Here's what we think might have happened:<br>"+err.message);
            res.redirect("/logs/signin");
        }
        else
        {
            // User profile information
            var username = verify.email.trim(),
                name = verify.name.trim(),
                isValidated = true,
                phone = req.body.phone,
                password  = req.body.password,
                _type = req.body.type,
                passwordConfirmation = req.body.passwordConfirmation,
                profilePicture = "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn150.picsart.com%2Fupscale-245339439045212.png%3Fr1024x1024&f=1&nofb=1";
            if (_type == "farmer") {
                _type = 0;
            }
            else
            {
                _type = 1;
            }
            User.findOne({username : username}, function(err, foundUser){
                if(err)
                {
                    console.log("Something went terribly wrong. ", err.message);
                    req.flash("warning","Ouch!|Errors hurt. Here's what we think went wrong: "+err.message+"<br>Please try again.");
                    res.redirect("/logs/signup");
                    deleteFile(req);
                }
                else if(foundUser && foundUser.isValidated === true)
                {
                    // flash for claiming User Found <not possible>
                    console.log("What!  ", foundUser.isValidated);
                    req.flash("error","Whoops.|Something just went wrong. <br>Don't worry. This rarely happens :D</br><strong>Please try again later</strong>");
                    res.redirect("/logs/signup");
                    deleteFile(req);
                }
                else
                {
                    if(passwordConfirmation !== password)
                    {
                        console.log("Password not equal");
                        deleteFile(req);
                        req.flash("error","Passwords not equal.|Make sure confirmation password is equal to your password.");
                        return res.redirect(req.get('referer'));
                    }
                    else if(req.file != undefined)
                    {
                        var cloudinaryLink = "./" + req.file.path;
                        console.log(cloudinaryLink);
                        cloudinary.v2.uploader.upload(cloudinaryLink, {"crop":"limit","tags":[username, name, 'user', 'init-image', 'default-profile-picture','profile-picture'], folder: `user/${username.toLowerCase().split("@")[0]} - ${name}`,use_filename: false}, function(error, result) {
                            if(error)
                            {
                                console.log(error);
                                // flash for cloudinary Upload problem...
                                deleteFile(req);
                                req.flash("error","Image Upload error|Something went wrong while trying to upload your profile picture onto our server.<br>Possible error: "+error);
                                return res.redirect(req.get('referer'));
                            }
                            profilePicture = result.secure_url;
                            console.log(profilePicture);
                            
                            deleteFile(req);
                            isValidated = true;
                            // create user.
                            User.register(new User({_type : _type, username:username, isValidated : isValidated,name:name, phone:phone, profilePicture:profilePicture, created: moment().format('MMMM Do YYYY, h:mm:ss a')}), password, function(err, userAccount){
                                if(err){
                                    console.log(err, " Whoops. Mah bad.");
                                    req.flash("error", "Whoops|Something went wrong.<br>"+err.message);
                                    res.redirect('/logs/signup');
                                }
                                else
                                {
                                    req.login(userAccount, function(err) {
                                        if (err) 
                                        { 
                                            return next(err); 
                                        }
                                        req.flash("success", "Thanks for joining the FreshDetect!");
                                        console.log("User created and logged...");
                                        mailingSystem.welcomeEmail(userAccount.name, userAccount.username);
                                        return res.redirect("/marketplace");
                                    });
                                }
                            });
                        });
                    }
                    else
                    {
                        // create user.
                        User.register(new User({_type : _type, username:username, isValidated : isValidated,name:name, phone:phone, profilePicture:profilePicture, created: moment().format('MMMM Do YYYY, h:mm:ss a')}), password, function(err, userAccount){
                            if(err){
                                console.log(err, " Whoops. Mah bad.");
                                req.flash("error", "Whoops|Something went wrong.<br>"+err.message);
                                res.redirect('/logs/signup');
                            }
                            else
                            {
                                req.login(userAccount, function(err) {
                                    if (err) 
                                    { 
                                        return next(err); 
                                    }
                                    req.flash("success", "Thanks for joining the FreshDetect!");
                                    console.log("User created and logged...");
                                    mailingSystem.welcomeEmail(userAccount.name, userAccount.username);
                                    return res.redirect("/marketplace");
                                });
                            }
                        });
                    }
                    
                }
            });
        }
    });
});

router.post("/logout", function(req, res){
    if(req.user)
    {
        req.logout();
        req.flash("success","Successfully Logged you out!|");
        console.log("User logged out!");
        return res.redirect("/");    
    }
    else
    {
        req.flash("info","No user found. 😉😎😉");
        return res.redirect("/start");
    }
    
});
router.post("/login", passport.authenticate("local", {
    successRedirect : "/marketplace",
    failureRedirect : "/start",
    failureFlash : "Wait a minute|Invalid username and/or password<br><strong>Please log in with your FreshDetect associated email address.</strong>",
 }), function(req, res) {
     console.log("A user just logged in!");
});
router.get("/check-your-email/:email/for-confirmation-link/:token", function(req, res){
    var mail = req.params.email,
        token = req.params.token;

    jwt.verify(token, secretKey, function(err, decoded){
        if(err && err.message === 'jwt expired')
        {
            // add flash indicating link expired
            console.log('Link Expired');
            return res.send("Link has expired.<br>You need to re-initialize your sign up procedure. <a href='/start'>Click to go back to sign up</a>.");
        }
        else if(!err)
        {
            res.render("partials/emailWait",{mail:mail});
        }
        else
        {
            // general error --> Add Flash
            req.flash("error","%U^C#K|Something went wrong. Please try again later if the problem persists.<br><strong>We apologize for any inconvenience</strong>");
            console.log("EHEHEH");
            return res.redirect("/start");
        }        
    });
});

module.exports = router;