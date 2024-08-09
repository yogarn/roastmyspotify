const crypto = require("crypto");
const axios = require("axios");

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

const generateRandomString = function (length) {
  return crypto.randomBytes(length).toString("hex");
};

module.exports = {
  getRecentlyPlayedTracks,
  getUserProfile,
  generateRandomString
};
