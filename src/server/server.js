const express = require("express");
const app = express();
const port = 3000;
const smsResponsesHandler = require("./sms-responses-handler");
const smsSaveResponseHandler = require("./sms-save-handler");
app.get("/", (req, res) => res.send("Hello World!"));

app.post("/api/saveAllResponses", (req, res) => {
  //req.body
    console.log("=========================" + req.body);

  const result = smsSaveResponseHandler.saveAllResponses();

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
