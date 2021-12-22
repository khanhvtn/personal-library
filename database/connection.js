require("dotenv").config();
const { MongoClient } = require("mongodb");

module.exports = async function (callback) {
  const client = new MongoClient(process.env.DB);
  try {
    await client.connect();
    return client.db("freeCodeCamp");
  } catch (error) {
    console.log(error.message);
    throw new Error("Unable to connect to database");
  }
};
