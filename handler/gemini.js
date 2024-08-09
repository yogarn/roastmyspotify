const express = require("express");
const router = express.Router();

const { roast } = require("../controller/gemini");

router.get("/roast", (req, res) => {
  roast(req, res);
});

module.exports = router;
