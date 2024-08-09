const express = require("express");
const router = express.Router();

const spotifyRoute = require("./spotify");
const geminiRoute = require("./gemini");

router.get("/", (req, res) => {
  res.render("index");
});

router.use("/", spotifyRoute);
router.use("/", geminiRoute);

module.exports = {
  router,
};
