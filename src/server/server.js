const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const smsResponsesHandler = require("./sms-responses-handler");
const smsSaveResponseHandler = require("./sms-save-handler");
app.get("/", (req, res) => res.send("Hello World!"));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

app.post("/api/saveAllResponses", (req, res) => {

  var myData = JSON.stringify(req.body, null, 2);
  console.log("=========================" + myData);

  const result = smsSaveResponseHandler.saveAllResponses(myData);

  result.then((result) => {
    if (!result) {
      res.status(400).send("Ooops");
    } else {
      res.status(200).json({ result });
    }
  });
  });



app.get("/api/getAllResponses", (req, res) => {
  const result = smsResponsesHandler.getAllResponses();

  result.then((result) => {
    if (!result) {
      res.status(400).send("Ooops");
    } else {
      res.status(200).json({ result });
    }
  });
});

app.listen(port);
