require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { default: helmet } = require("helmet");
const compression = require("compression");
const app = express();

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "logs/access.log"),
  { flags: "a" }
);

// init middlewares
app.use(cors());
app.use(morgan("combined", { stream: accessLogStream }));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// init db
require("./dbs/init.mongodb");

// init routes
app.use("", require("./routes"));
app.get("/hello", (req, res) => {
  res.send("Hello");
});

// handling error
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  const statusCode = error.status || 500;

  if (error.status === 400) {
    return res.status(statusCode).json({
      code: statusCode,
      message: error.message,
      error: error.data,
    });
  }
  return res.status(statusCode).json({
    code: statusCode,
    error: statusCode !== 500 ? error.message : "Internal Server Error",
  });
});

module.exports = app;
