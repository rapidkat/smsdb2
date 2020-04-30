const smsresponses = require("../database/sms-responses");
const logger = require("../logger");

var responseArr = [];
var chunkSize = 1000;
var processedRecords = 0;

async function getAllResponses() {
  logger.info("smsResponsesHandler", "running task", "");

  let promise = new Promise((resolve, reject) => {
    var dbResult = smsresponses.getAllSMSResponses(
      processResponseChunk,
      chunkSize
    );

    // Iterate through the users
    dbResult
      .then(function (val) {
        logger.info(
          "sms-response-handler.getAllResponses",
          " Finished Task - Processed " + processedRecords + " records.",
          ""
        );
        resolve(responseArr);
      })
      .catch(function (err) {
        logger.error(
          "sms-response-handler.getAllResponses",
          " Finished Task - Error ",
          err
        );
        resolve(null);
      });
  });

  return await promise;
}

function processResponseChunk(responseRows, nextChunkCallback) {
  for (var i = 0; i < responseRows.length; i++) {
    responseArr.push({
      id: responseRows[i].Id,
      surveyId: responseRows[i].SurveyId,
      response: responseRows[i].Response,
    });
    processedRecords++;
  }

  nextChunkCallback();
}

exports.getAllResponses = getAllResponses;
