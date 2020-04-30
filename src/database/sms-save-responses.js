var configuration = require("../configuration");
var Cursor = require("pg-cursor");
var pg = require("pg");
var logger = require("../logger");

   async function saveAllResponses (chunkCallBack, chunkSize) {
    return new Promise(function (resolve, reject) {

      var pool = new pg.Pool(configuration.PG_CONFIG);

      // connection using created pool
      pool.connect(function (err, client, done) {
        if (err) {
          done();
          logger.error("smsResponse.getAllUsers", "DB connect error", err);
          reject(err);
        }

        var queryText = "INSERT INTO sms_responses values (default, 1, '{}')";

        var cursor = client.query(new Cursor(queryText));

console.log("+++++++++++++++++++++++" +req);

        // Start cursor recursion
        getNextChunk(resolve, reject, cursor, done, chunkSize, chunkCallBack);
      });

      // pool shutdown
      pool.end();
      
    });
  };

  // Recursive loop through the users cursor to get all users
  function getNextChunk(
    resolve,
    reject,
    cursor,
    done,
    chunkSize,
    chunkCallBack
  ) {
    cursor.read(chunkSize, function (err, rows) {
      if (err) {
        logger.error("smsresponse.getNextChunk", "Error", err);
        done(err);
        reject(err);
      }

      // Will be empty after all rows are read so we can return
      if (!rows.length) {
        done();
        resolve(true);
      } else {
        chunkCallBack(rows, function () {
          getNextChunk(resolve, reject, cursor, done, chunkSize, chunkCallBack);
        });
      }
    });
  }
exports.saveAllSMSResponses = saveAllResponses