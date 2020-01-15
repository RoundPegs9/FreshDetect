const request = require("request"),
    Marketplace = require("../models/Bid"),
    express = require("express"),
    path = require("path"),
    spawn = require("child_process").spawn,
    router = express(),
    mailingSystemFunction = require("../middleware/mailingSystemFunctions"),
    Queue = require("../models/Queue"),
    link = "https://eastus2.api.cognitive.microsoft.com/customvision/v3.0/Prediction/b0edd4db-a0fc-4395-80ce-0a19d78a0e56/classify/iterations/Iteration2/url";
 

router.get("/endpoint/:product_id", (req, res)=>{
    const id = req.params.product_id;
    const image_url = req.query.image_link;
    const temp_scr = req.query.temp_scr, 
        hum_scr = req.query.hum_scr, 
        voc_scr = req.query.voc_scr;

    const times_left = parseInt(req.query.times_left);
    const options = {
        url: link,
        headers: {
          'Prediction-Key': '41990733aeee4304893d7dda4979a30f',
          'Content-Type' : "application/json"
        },
        body: JSON.stringify(
        {
            "Url" : image_url
        })
      };
      
    Marketplace.findById(id, (err, foundElem)=>{
        if(err || !foundElem)
        {
            var error = {"code": 404, "status": "Invalid Product ID", "message" : "Make sure you have the right product id attached to your image"};
            return res.send(error);
        }
        request.post(options, (error, response, body)=>{
            body = JSON.parse(body);
            body = body.predictions;
            var green = 0,
                ripe = 0,
                overripe = 0;
            if(body[0].tagName == "green")
            {
                green = parseFloat(body[0].probability);
            }
            else if(body[0].tagName == "ripe")
            {
                ripe = parseFloat(body[0].probability);
            }
            else if(body[0].tagname == "overripe")
            {
                overripe = parseFloat(body[0].probability);
            }

            if(body[1].tagName == "green")
            {
                green = parseFloat(body[1].probability);
            }
            else if(body[1].tagName == "ripe")
            {
                ripe = parseFloat(body[1].probability);
            }
            else if(body[1].tagname == "overripe")
            {
                overripe = parseFloat(body[1].probability);
            }

            if(body[2].tagName == "green")
            {
                green = parseFloat(body[2].probability);
            }
            else if(body[2].tagName == "ripe")
            {
                ripe = parseFloat(body[2].probability);
            }
            else if(body[2].tagname == "overripe")
            {
                overripe = parseFloat(body[2].probability);
            }

            var data = [ripe, green, overripe, parseFloat(temp_scr), parseFloat(hum_scr), parseFloat(voc_scr)];
            const process = spawn('python', [
                "-u",
                path.join(__dirname,"../middleware/endpoint.py"),
                data
             ]);
             var some_data = "";
             process.stderr.on('data', async(data) => {
                console.log(`error: ${data}`);
                var error = {"code": 403, "status": "File Not read properly"};
                return res.send(error);
             });
             process.stdout.on('data',async(data)=>{
                console.log(`data: ${data}`);
                some_data += data;
                some_data = parseFloat(some_data);
                if(times_left == 0)
                {
                    Marketplace.findByIdAndDelete(id, (err, deletedAuction)=>{
                        if(err || !deletedAuction)
                        {
                            throw new Error(err.message);
                        }
                        console.log("Auction Deleted.");
                        var final_result = 
                            {
                                status : 203,
                                status_message : 'Deleted Product',
                                image_url : image_url,
                                freshness_score : some_data,
                                bidding_data : foundElem.Bids,
                                product_id : foundElem._id,
                                times_left : times_left,
                                DB_update : true
                            };
                            return res.send(final_result);
                    });
                }
                else
                {
                    Marketplace.findByIdAndUpdate(id, {live_image : image_url, ripeness_percentage : some_data, times_left : times_left}).exec((err, updatedBid)=>{
                        if(err)
                        {
                            var final_result = 
                            {
                                status : 205,
                                status_message : 'Error',
                                image_url : image_url,
                                freshness_score : some_data,
                                bidding_data : foundElem.Bids,
                                product_id : foundElem._id,
                                times_left : times_left,
                                DB_update : false
                            };
                            return res.send(final_result);
                        }
                        var final_result = 
                        {
                            status : 200,
                            status_message : 'OK',
                            image_url : image_url,
                            freshness_score : some_data,
                            bidding_data : foundElem.Bids,
                            product_id : foundElem._id,
                            times_left : times_left,
                            DB_update : true
                        };
                        console.log("Database Updated.", updatedBid.Owner.name);
                        return res.send(final_result);
                    });
                }
            });
            process.stderr.on('close', async() => {
                console.log("Closed");
                var error = {"code": 402, "status": "File close read buffer type error."};
                return res.send(error);
             });
        });
    });
});

router.post("/updateweb/:productID", (req, res)=>{
    const id = req.params.productID;
    Marketplace.findById(id, (err, foundAuction)=>{
        if(err || !foundAuction)
        {
            let error = 
            {
                status : 404,
                message : "product id not found",
                DB_update : false
            };
            console.log("Error reported when trying to update cron job queue.");
            return res.send(error);
        }
        // see whose user_id falls below the threshold marging. type = array.
        var elem = foundAuction.Bids;
    });
});
module.exports = router;