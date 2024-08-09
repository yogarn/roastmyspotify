const { GoogleGenerativeAI } = require("@google/generative-ai");

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

module.exports = {
  fetchGeminiRoast,
};
