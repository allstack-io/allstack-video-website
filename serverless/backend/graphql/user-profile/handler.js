const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1"
});
const dynamodb = new AWS.DynamoDB({
  apiVersion: "2012-08-10"
});
/*const docClient = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10"
});*/
module.exports.fondashV2AutomationsRuns = function (event, context, callback) {
  // "{\"arguments\":{\"runDate\":\"Aug 21, 2018\",\"tableName\":\"Insprint_Automation_Runs\"}}"}
  /*const params = {
    TableName: event.arguments.tableName,
    KeyConditionExpression: "#runDate = :runDate",
    ExpressionAttributeNames: {
      "#runDate": "runDate"
    },
    ExpressionAttributeValues: {
      ":runDate": event.arguments.runDate
    }
  };
  console.log('12');
  docClient.query(params, function(err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.");
        callback(null, data)
    }
});*/
  dynamodb.scan({
    TableName: event.arguments.tableName,
    FilterExpression: "contains (runDate, :a)", // FilterExpression: "runDate = :a",
    ExpressionAttributeValues: {
      ":a": {
        S: event.arguments.runDate
      }
    }
    // Limit : 100
  }, (err, data) => {
    if (err) {
      console.log(err);
    }
    callback(null, data)
  });
}