"use strict";

const mongoose = require("mongoose");
const {
  db: { host, port, name },
} = require("../configs/mongodb.config");
const connectString =
  "mongodb+srv://phanhoangphuc0311:phuc1755@walletapp.mlbxa.mongodb.net/DoAnTotNghiep?retryWrites=true&w=majority&appName=WalletApp" ||
  `mongodb://${host}:${port}/${name}`;
const { countConnection } = require("../helpers/check.connect");
console.log("Connecting mongodb with uri::", connectString);
class Database {
  constructor() {
    this.connect();
  }
  // connect
  connect(type = "mongodb") {
    if (process.env.NODE_ENV === "dev") {
      mongoose.set("debug", true);
      mongoose.set("debug", { color: true });
    }

    mongoose
      .connect(connectString)
      .then((_) => {
        console.log(`Connected Mongodb Success`);
        // countConnection()
      })
      .catch((err) => console.log(`Error Connect!`));
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }
}

const instanceMongodb = Database.getInstance();
module.exports = instanceMongodb;
