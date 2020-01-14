const request = require("request"),
    Marketplace = require("../models/Bid"),
    express = require("express"),
    router = express();
const link = "https://eastus2.api.cognitive.microsoft.com/customvision/v3.0/Prediction/b0edd4db-a0fc-4395-80ce-0a19d78a0e56/classify/iterations/Iteration2/url";

const image_test = "https://www.bbcgoodfood.com/sites/default/files/editor_files/2019/03/bananas-in-a-bowl.jpg";

var options = {
  url: link,
  headers: {
    'Prediction-Key': '41990733aeee4304893d7dda4979a30f',
    'Content-Type' : "application/json"
  },
  body: JSON.stringify(
  {
      "Url" : image_test
  })
};
 
request.post(options, (error, response, body)=>{
    body = JSON.parse(body);
    console.log(body.predictions);
});
//ripe = 0
//green = 1
//overripe = 2
router.get("/endpoint/:product_id", (req, res)=>{
    const id = req.params.product_id;
    const image_url = req.query.image_link;
});
module.exports = router;