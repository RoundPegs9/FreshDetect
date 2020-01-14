const request = require("request"),
    Marketplace = require("../models/Bid"),
    express = require("express"),
    router = express();
const link = "https://eastus2.api.cognitive.microsoft.com/customvision/v3.0/Prediction/b0edd4db-a0fc-4395-80ce-0a19d78a0e56/classify/iterations/Banana_model_1/url";

let image_test = "https://www.bbcgoodfood.com/sites/default/files/editor_files/2019/03/bananas-in-a-bowl.jpg";

var options = {
  url: link,
  headers: {
    'Prediction-Key': '41990733aeee4304893d7dda4979a30f',
    'Content-Type' : "application/json"
  },
  json:true,
  body: 
  {
      "Url" : image_test
  }
};
 
request(options, (error, response, body)=>{
    console.log(body);
});

router.get("/", (req, res)=>{
    return res.send("Hey");
});
module.exports = router;