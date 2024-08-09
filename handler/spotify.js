const express = require("express");
const router = express.Router();

const { login, callback } = require("../controller/spotify");

router.get("/login", (req, res) => {
    login(req, res);
});

router.get("/callback", (req, res) => {
    callback(req, res);
});

module.exports = router;
