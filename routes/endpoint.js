const request = require("request"),
    Marketplace = require("../models/Bid"),
    express = require("express"),
    spawn = require("child_process").spawn,
    router = express(),
    link = "https://eastus2.api.cognitive.microsoft.com/customvision/v3.0/Prediction/b0edd4db-a0fc-4395-80ce-0a19d78a0e56/classify/iterations/Iteration2/url";
 

//ripe = 0
//green = 1
//overripe = 2
router.get("/endpoint/:product_id", (req, res)=>{

    const id = req.params.product_id;
    const image_url = req.query.image_link;
    const temp_scr = req.query.temp_scr, 
        hum_scr = req.query.hum_scr, 
        voc_scr = req.query.voc_scr;
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
            var data = [float(body.predictions[0].probability), float(body.predictions[1].probability), float(body.predictions[2].probability), float(temp_scr), float(hum_scr), float(voc_scr)];
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
                some_data = float(some_data);
                Marketplace.findByIdAndUpdate(id, {live_image : image_url, ripeness_percentage : some_data}).exec((err, updatedBid)=>{
                    if(err)
                    {
                        var final_result = 
                        {
                            status : 205,
                            status_message : 'Error',
                            image_url : image_url,
                            freshness_score : some_data,
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
                        DB_update : true
                    };
                    console.log("Database Updated.", updatedBid.Owner.name);
                    return res.send(final_result);
                });
            });
            process.stderr.on('close', async() => {
                console.log("Closed");
                var error = {"code": 402, "status": "File close read buffer type error."};
                return res.send(error);
             });
        });
    });
});
module.exports = router;