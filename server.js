
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const refresh_token = process.env.REFRESH_TOKEN;

let access_token = "";

async function refreshAccessToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refresh_token);
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
  };

  const response = await axios.post("https://accounts.spotify.com/api/token", params, { headers });
  access_token = response.data.access_token;
}

app.get("/now-playing", async (req, res) => {
  try {
    if (!access_token) await refreshAccessToken();

    const result = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: "Bearer " + access_token },
    });

    if (result.status === 204 || !result.data) {
      return res.json({ isPlaying: false });
    }

    const item = result.data.item;
    const title = item.name;
    const artist = item.artists.map((_artist) => _artist.name).join(", ");
    const albumImageUrl = item.album.images[0].url;

    res.json({ isPlaying: true, title, artist, albumImageUrl });
  } catch (err) {
    access_token = "";
    res.status(500).json({ error: "Failed to fetch now playing", details: err.message });
  }
});

app.listen(PORT, () => console.log("Server running on port", PORT));
