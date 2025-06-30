const axios = require("axios");
let access_token = "";

async function refreshAccessToken() {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: process.env.REFRESH_TOKEN,
  });
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization:
      "Basic " +
      Buffer.from(
        process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
      ).toString("base64"),
  };
  const res = await axios.post("https://accounts.spotify.com/api/token", params, { headers });
  access_token = res.data.access_token;
}

module.exports = async (req, res) => {
  try {
    if (!access_token) await refreshAccessToken();
    const result = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: "Bearer " + access_token },
    });
    if (result.status === 204 || !result.data) {
      return res.json({ isPlaying: false });
    }
    const item = result.data.item;
    res.json({
      isPlaying: true,
      title: item.name,
      artist: item.artists.map((a) => a.name).join(", "),
      albumImageUrl: item.album.images[0].url,
    });
  } catch (err) {
    access_token = "";
    res.status(500).json({ error: "Failed to fetch now playing", details: err.message });
  }
};
