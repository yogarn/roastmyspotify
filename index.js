const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { router } = require("./handler/handler");

const app = express();
app.use(cookieParser());

app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "ejs");

app.use(router);

app.listen(8888, () => {
  console.log("Server is running on port 8888");
});
