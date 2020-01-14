
const User = require("../models/User"),
    fs = require("fs");

var middlewareObj = {};
middlewareObj.isUserRegistered = (req,res,next)=>{
    if(!req.isAuthenticated())
    {
        console.log("User not logged in!");
        req.flash("error","Authentication Error|You need to be logged in to access that feature.<br> <strong><a href='/logs/signin'>Login/SignUp now!</a></strong>");
        res.redirect("/logs/signin");
    }
    else
    {
        User.find({username : req.user.username}, function(err, foundUserProfile){
        
            if(err || !foundUserProfile)
            {
                console.log("Middleware error");
                req.flash("error","Whoops!|Something went wrong. Please try again later.");
    
                return res.redirect("back");
            }
            else
            {
                if(foundUserProfile[0].isValidated == true)
                {
                    return next();
                }
                else
                {
                    console.log("User not validated");
                    req.flash("error","Authentication Error|You do not have the right validations to access the requested page.<br> <strong>Sorry for any inconvenience.</strong>");
                    // Flash the bitch!
                    return res.redirect("back");
                }
            }
        });
    }
}

module.exports = middlewareObj;