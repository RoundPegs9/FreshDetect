const express = require("express"),
      bodyParser = require("body-parser"),
      flash   = require("connect-flash"),
      moment  = require("moment"),
      compression = require('compression');
      passport = require("passport"),
      LocalStrategy = require("passport-local"),
      methodOverride    = require("method-override"),
      cookieSession     = require("cookie-session"),
      dotenv        = require("dotenv"),
      expressSanitizer = require('express-sanitizer'),
      app = express();

    
dotenv.config();
app.use(compression());
app.use(expressSanitizer());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.engine('ejs', require('ejs').__express);

app.use(express.static('./public'));

var redirectToHTTPS = require('express-http-to-https').redirectToHTTPS
app.use(redirectToHTTPS([/localhost:(\d{4})/], [/\/insecure/], 301));

app.use(methodOverride("_method"));

app.use(cookieSession({
    maxAge : 360*3600*1000,
    keys   : ['mynameisqasimwaniandihavenoideawhatimdoingwithmylife.todayis14jan2020,330am.']
}));

//initialize passport
// app.use(passport.initialize());
// app.use(passport.session());

var MemoryStore = require("memorystore")(require('express-session'));

app.use(require("express-session")({
   secret : "mynameisqasimwaniandikindahavenoideawhatimdoingwithmylife.todayis14jan2020,330am.",
   store: new MemoryStore({
    checkPeriod: 86400000 // prune expires entries every 24h
  }),
   resave : false,
   saveUninitialized : false
}));

// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

//using flash for messages and better user interface
app.use(flash());  

// passport.serializeUser((user, done) =>{
//   done(null, user.id);  
// });
// passport.deserializeUser((id, done) =>{
//   User.findById(id).then((user)=>
//   {
//     done(null, user);  
//   }); 
// });


app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.warning = req.flash("warning");
  res.locals.info = req.flash("info");
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

// const marketplaceRoutes = require("./routes/marketplace")

app.get("/", function(req, res){
    return res.render("partials/landing/index");
});

app.get("*",(req, res)=>{
  return res.render("partials/error");
});

app.listen(process.env.PORT || 1729, process.env.IP,()=>{
    console.log("FreshDetect Server Connected");
});
