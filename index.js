const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config();

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_CALLBACK;

const app = express();
app.use(cookieParser());

app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "ejs");

const stateKey = "spotify_auth_state";

const generateRandomString = function (length) {
  return crypto.randomBytes(length).toString("hex");
};

async function getRecentlyPlayedTracks(accessToken) {
  const recentlyPlayedOptions = {
    url: "https://api.spotify.com/v1/me/player/recently-played",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  };

  try {
    const recentlyPlayedResponse = await axios(recentlyPlayedOptions);
    return recentlyPlayedResponse.data.items;
  } catch (error) {
    console.error("Error fetching recently played tracks", error);
    throw error;
  }
}

async function getUserProfile(accessToken) {
  const profileOptions = {
    url: "https://api.spotify.com/v1/me",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  };

  try {
    const profileResponse = await axios(profileOptions);
    return profileResponse.data.display_name;
  } catch (error) {
    console.error("Error fetching user profile", error);
    throw error;
  }
}

async function fetchGeminiRoast({ userProfile, trackArtistPairs }) {
  const formattedTracks = trackArtistPairs
    .map((pair) => `${pair.trackName} by ${pair.artistName}`)
    .join(", ");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `roast profile spotify dengan nama ${userProfile} berdasarkan listening history secara langsung tanpa newline sebanyak 2 paragraf dalam bahasa indonesia gaul: ${formattedTracks}`;

  try {
    const result = await model.generateContent(prompt);

    if (result.response.candidates.length === 0) {
      throw new Error("No response from model");
    }

    return result.response.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error(
      "Error fetching roast",
      error.response ? error.response.data : error.message
    );
  }
}

app.get("/login", (req, res) => {
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
});

app.get("/callback", async (req, res) => {
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

      res.redirect("/");
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
});

app.get("/roast", async (req, res) => {
  const access_token = req.cookies.spotify_access_token;

  if (!access_token) {
    return res.redirect("/login");
  }

  try {
    const result = await getRecentlyPlayedTracks(access_token);

    const trackArtistPairs = result.map((track) => ({
      trackName: track.track.name,
      artistName: track.track.artists[0].name,
    }));
    const userProfile = await getUserProfile(access_token);

    const roast = await fetchGeminiRoast({ userProfile, trackArtistPairs });

    // TODO: remove this line
    console.log(roast);

    res.render("roast", { roast });
  } catch (error) {
    console.error("Error roasting your spotify profile:", error);
    res.send("Error roasting your spotify profile. Try to refresh the page");
  }
});

app.get("/", (req, res) => {
  res.render("index");
});

app.listen(8888, () => {
  console.log("Server is running on port 8888");
});
