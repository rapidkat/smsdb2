

var error = function (method, message, object) {
    console.error("[smsdb_error] :" + method + " : " + message + " : " + JSON.stringify(object));
    //logRollbarError(object);
};

var info = function (method, message, object) {
    console.log("[smsdb_info] :" + method + " : " + message + " : " + JSON.stringify(object));
};



exports.error = error;
exports.info = info;