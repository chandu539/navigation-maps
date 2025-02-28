const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); 


app.get("/geocode", async (req, res) => {
  try {
    const address = req.query.address;
    if (!address) {
      return res.status(400).json({ error: "Address query parameter is required" });
    }

    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
      { headers: { "User-Agent": "your-app-name" } }
    );

    if (response.data.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    const { lat, lon } = response.data[0];
    res.json({ lat, lng: lon });
  } catch (error) {
    console.error("Error fetching geolocation:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Server Setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
