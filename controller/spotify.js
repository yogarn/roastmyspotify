const querystring = require("querystring");
const axios = require("axios");

const { generateRandomString } = require("../service/spotify");

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_CALLBACK;

const stateKey = "spotify_auth_state";

async function login(req, res) {
  const state = generateRandomString(8);
  res.cookie(stateKey, state);

  const scope = "user-read-recently-played";

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: spotify_client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
}

async function callback(req, res) {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    res.clearCookie(stateKey);
    const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      method: "post",
      params: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      },
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(spotify_client_id + ":" + spotify_client_secret).toString(
            "base64"
          ),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };

    try {
      const response = await axios(authOptions);
      const access_token = response.data.access_token;

      res.cookie("spotify_access_token", access_token);

      res.redirect("/roast");
    } catch (error) {
      console.error(
        "Error fetching access token or recently played tracks",
        error
      );
      res.redirect(
        "/#" +
          querystring.stringify({
            error: "invalid_token",
          })
      );
    }
  }
}

module.exports = {
  login,
  callback,
};
