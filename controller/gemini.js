const { getRecentlyPlayedTracks, getUserProfile } = require("../service/spotify");
const { fetchGeminiRoast } = require("../service/gemini");

async function roast(req, res) {
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

    let roast = await fetchGeminiRoast({ userProfile, trackArtistPairs });

    while (roast === undefined) {
      roast = await fetchGeminiRoast({ userProfile, trackArtistPairs });
    }

    res.render("roast", { roast });
  } catch (error) {
    console.error("Error roasting your spotify profile:", error);
    res.send("Error roasting your spotify profile. Try to refresh the page");
  }
}

module.exports = {
  roast,
};
