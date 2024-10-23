const express = require("express");
const path = require("path");
require("dotenv").config();

const { amadeus } = require("./lib/amadeus");

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use("/", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Autocomplete route for fetching cities/airports
app.get("/autocomplete", async (req, res) => {
    const query = req.query.query;

    try {
        const response = await amadeus.referenceData.locations.get({
            keyword: query,
            subType: "AIRPORT,CITY",
        });

        const locations = response.data.map((location) => ({
            name: location.name,
            detailedName: location.detailedName,
            iataCode: location.iataCode,
            subType: location.subType,
            countryCode: location.address.countryCode,
            cityCode: location.address.cityCode,
        }));

        res.json(locations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch locations" });
    }
});

// Predict the purpose of a user's trip
app.post("/predict-trip-purpose", async (req, res) => {
    try {
        const { origin, destination, departureDate, returnDate } = req.body;

        const response = await amadeus.travel.predictions.tripPurpose.get({
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate,
            returnDate,
        });

        res.json({ tripPurpose: response.data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to predict trip purpose" });
    }
});

// Search trips
app.post("/search-trips", async (req, res) => {
    try {
        const {
            // General
            tripPurpose,

            // LEISURE
            cityCodes,
            travelerCountryCode,
            destinationCountryCodes,

            // BUSINESS
            originLocationCode,
            destinationLocationCode,
            departureDate,
            returnDate,
            adults,
            children,
            travelClass,
        } = req.body;

        if (tripPurpose === "LEISURE") {
            const response =
                await amadeus.referenceData.recommendedLocations.get({
                    cityCodes,
                    travelerCountryCode,
                    destinationCountryCodes,
                });

            res.json({ recommendedLocations: response.data });
        } else if (tripPurpose === "BUSINESS") {
            const response = await amadeus.shopping.flightOffersSearch.get({
                originLocationCode,
                destinationLocationCode,
                departureDate,
                returnDate,
                adults,
                children,
                travelClass,
                max: 5,
            });

            res.json({ flightOffers: response.data });
        } else {
            return res.status(403).json({ error: "Invalid trip purpose" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch flights" });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});