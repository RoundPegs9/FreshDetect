var nodemailer = require("nodemailer");
var mailingObj = {};

 mailingObj.signUpConfirmationEmail = function(token, emailAddress, name){

    nodemailer.createTestAccount(function(err, account){
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth:
            {
                user : process.env.GmailUser,
                pass : process.env.GmailPass
            }
        });
        var confirmationLink = process.env.emailConfirmationLink+'/activate/email/freshdetect/qw3600/'+token;
        let mailOptions = {
            from : process.env.GmailUser,
            to  :  emailAddress,
            subject : 'FreshDetect: Registration Confirmation Email',
            html : `<h4>Hey ${name}, </h4>`+
            `<p>Use the button below to confirm your email and get started on using FreshDetect to track your produce!</p>`+
            `<form method="GET" action="${confirmationLink}"><button style="background: rgb(28, 184, 65);border-radius:10px;">Click to get started</button></form>`+
            `<p>Button does not work? <a href="${confirmationLink}" style="font-size:1.1em;">Click me.</a></p>`+
            `<hr><h3 style='color:black;'><strong>Freshdetect</strong>,<br> Tackling Supply chain inefficiencies one step at a time. </h3>`
        }
    
        transporter.sendMail(mailOptions, function(err, info){
            if(err)
            {
                console.log(err);
            }
            else
            {
                console.log('Message sent successfully', info.messageId);
                console.log("**************");
                console.log(info);
            }
        });
    });

};

mailingObj.welcomeEmail = function(name, emailAddress)
{
    
    nodemailer.createTestAccount(function(err, account){
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth:
            {
                user : process.env.GmailUser,
                pass : process.env.GmailPass
            }
        });
        var marketPlace = process.env.emailConfirmationLink + '/marketplace'
        let mailOptions = {
            from : process.env.GmailUser,
            to  :  emailAddress,
            subject : 'Welcome to the FreshDetect Community',
            html : `<h1>Track your produce in real time anywhere in the world!</h1>`+
            `<h4>${name}, Thanks for joining FreshDetect.</h4>`+
            `<h4>Start Placing your produce on the FreshDetect Marketplace or start bidding now.</h4>`+
            `<form method="GET" action="${marketPlace}"><button style="background: rgb(28, 184, 65);border-radius:10px;">Use FreshDetect</button></form>`+
            `<p>Button does not work? <a href="${marketPlace}" style="font-size:1.1em;">Click me.</a></p>`+
            `<hr><h3 style='color:black;'><strong>Freshdetect</strong>,<br> Tackling Supply chain inefficiencies one step at a time. </h3>`
        }
    
        transporter.sendMail(mailOptions, function(err, info){
            if(err)
            {
                console.log(err);
            }
            else
            {
                console.log('Message sent successfully', info.messageId);
                console.log("**************");
                console.log(info);
            }
        });
    });
};