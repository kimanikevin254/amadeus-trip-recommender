// Function to debounce API calls to avoid overwhelming the API with each keystroke
function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
}

// Function to fetch autocomplete suggestions based on user input
function fetchAutocomplete(query, type) {
    const suggestionsDiv = document.getElementById(type + "Suggestions");
    if (query.length < 3) {
        suggestionsDiv.innerHTML = ""; // Clear suggestions if query is less than 3 chars
        return;
    }

    // Display loading message while fetching suggestions
    suggestionsDiv.innerHTML = '<div class="loading">Loading...</div>';

    // Fetch autocomplete suggestions
    fetch(`/autocomplete?query=${query}`)
        .then((response) => response.json())
        .then((data) => {
            suggestionsDiv.innerHTML = ""; // Clear previous suggestions
            if (data && data.length > 0) {
                data.forEach((item) => {
                    const suggestionDiv = document.createElement("div");
                    suggestionDiv.textContent = `${item.detailedName} (${
                        item.iataCode
                    }) - ${item.subType === "CITY" ? "City" : "Airport"}`;
                    suggestionDiv.onclick = () => {
                        document.getElementById(
                            type
                        ).value = `${item.detailedName} (${item.iataCode})`;
                        document.getElementById(
                            type.replace("Display", "")
                        ).value = item.iataCode;
                        if (type === "originDisplay") {
                            document.getElementById(
                                type.replace("Display", "CityCode")
                            ).value = item.cityCode;
                        }
                        document.getElementById(
                            type.replace("Display", "CountryCode")
                        ).value = item.countryCode;
                        suggestionsDiv.innerHTML = ""; // Clear suggestions after selection
                    };
                    suggestionsDiv.appendChild(suggestionDiv);
                });
            } else {
                suggestionsDiv.innerHTML = "<div>No results found</div>"; // Handle empty response
            }
        })
        .catch((error) => {
            suggestionsDiv.innerHTML = "<div>Error fetching suggestions</div>";
        });
}

// Attach debounced autocomplete handler to inputs
const originInput = document.getElementById("originDisplay");
const destinationInput = document.getElementById("destinationDisplay");

originInput.addEventListener(
    "input",
    debounce((event) => {
        fetchAutocomplete(event.target.value, "originDisplay");
    }, 300)
);

destinationInput.addEventListener(
    "input",
    debounce((event) => {
        fetchAutocomplete(event.target.value, "destinationDisplay");
    }, 300)
);

// Show the instructions
document.getElementById("instructions").style.display = "block";

// Handle form submission for trip purpose prediction
document
    .getElementById("travelForm")
    .addEventListener("submit", function (event) {
        event.preventDefault();

        // Get input values from the form
        const origin = document.getElementById("origin").value;
        const destination = document.getElementById("destination").value;
        const departureDate = document.getElementById("departureDate").value;
        const returnDate = document.getElementById("returnDate").value;

        // Create an object containing the trip data
        const tripData = {
            origin,
            destination,
            departureDate,
            returnDate,
        };

        // Send trip data to backend to predict trip purpose
        fetch("/predict-trip-purpose", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(tripData),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.tripPurpose) {
                    // Collapse the form and show the results section
                    const formCollapse = new bootstrap.Collapse(
                        document.getElementById("collapseForm"),
                        { toggle: false }
                    );
                    formCollapse.hide();

                    const resultsCollapse = new bootstrap.Collapse(
                        document.getElementById("collapseResults"),
                        { toggle: false }
                    );
                    resultsCollapse.show();

                    // Hide the instructions if they are displayed
                    if (document.getElementById("instructions")) {
                        document.getElementById("instructions").style.display =
                            "none";
                    }

                    const resultsContainer =
                        document.getElementById("resultsContainer");

                    // Clear previous results
                    resultsContainer.innerHTML = "";

                    // Display the predicted trip purpose
                    resultsContainer.innerHTML += `<p>Predicted Trip Purpose: ${data.tripPurpose.result}</p>`;

                    // Prepare request body based on the trip purpose
                    let body;

                    if (data.tripPurpose.result === "LEISURE") {
                        body = {
                            tripPurpose: data.tripPurpose.result,
                            cityCodes:
                                document.getElementById("originCityCode").value,
                            travelerCountryCode:
                                document.getElementById("originCountryCode")
                                    .value,
                            destinationCountryCodes: document.getElementById(
                                "destinationCountryCode"
                            ).value,
                        };
                    } else if (data.tripPurpose.result === "BUSINESS") {
                        body = {
                            tripPurpose: data.tripPurpose.result,
                            originLocationCode: origin,
                            destinationLocationCode: destination,
                            departureDate: departureDate,
                            returnDate: returnDate,
                            adults: document.getElementById("numAdults").value,
                            children: document.getElementById("numKids").value,
                            travelClass:
                                document.getElementById("travelClass").value,
                        };
                    } else return;

                    // Show loading message while fetching flight offers or recommended locations
                    resultsContainer.innerHTML += `<p class="loading" id="loadingMessage">Loading...</p>`;

                    // Send request to search for trips based on the trip purpose
                    fetch("/search-trips", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(body),
                    })
                        .then((response) => response.json())
                        .then((flightData) => {
                            document.getElementById(
                                "loadingMessage"
                            ).style.display = "none";
                            if (flightData.recommendedLocations) {
                                // Handle empty response
                                if (
                                    flightData.recommendedLocations.length === 0
                                ) {
                                    return (resultsContainer.innerHTML += `
                            <p id="empty-list">No locations to recommend</p>
                        `);
                                }

                                // Display recommended locations
                                resultsContainer.innerHTML += `
                    <div id="recommended-locations">
                        <h4>Recommended Locations</h4>
                        <ul class="list-group">
                            ${flightData.recommendedLocations
                                .map(
                                    (location) =>
                                        `<li class="list-group-item">${location.name} - ${location.subtype}</li>`
                                )
                                .join("")}
                        </ul>
                    </div>
                    `;
                            } else if (flightData.flightOffers) {
                                // Handle empty response
                                if (flightData.flightOffers.length === 0) {
                                    return (resultsContainer.innerHTML += `
                            <p id="empty-list">No flight offers available</p>
                        `);
                                }

                                // Helper function to format flight duration
                                const formatDuration = (iso) =>
                                    `${iso.match(/(\d+)H/)?.[1] || 0}H ${
                                        iso.match(/(\d+)M/)?.[1] || 0
                                    }M`;

                                // Display available flight offers
                                resultsContainer.innerHTML += `
                        <h4 class="mb-4">Flight Offers</h4>
                    `;

                                flightData.flightOffers.forEach((offer) => {
                                    const {
                                        itineraries,
                                        price,
                                        oneWay,
                                        numberOfBookableSeats,
                                        travelerPricings,
                                    } = offer;
                                    const { total, base, currency } = price;

                                    resultsContainer.innerHTML += `
                            <div class="flight-offer-card id="flight-offers">
                                <h5>Flight Offer ${offer.id} 
                                    ${
                                        oneWay
                                            ? '<span class="badge bg-warning text-dark">One-Way</span>'
                                            : '<span class="badge bg-info">Round-Trip</span>'
                                    }
                                </h5>
                                <p><strong>Total Price:</strong> ${currency} ${total}</p>
                                <p><strong>Number of Bookable Seats:</strong> ${numberOfBookableSeats}</p>
                                <hr />
                                <div class="itinerary-section">
                                <h6>Itineraries:</h6>
                        `;

                                    // Display flight itinerary details
                                    itineraries.forEach((itinerary) => {
                                        const { segments, duration } =
                                            itinerary;
                                        const firstSegment = segments[0];
                                        const lastSegment =
                                            segments[segments.length - 1];

                                        resultsContainer.innerHTML += `
                                <div class="itinerary-details">
                                    <p><strong>Departure:</strong> ${
                                        firstSegment.departure.iataCode
                                    } (${
                                            firstSegment.departure.terminal ||
                                            "N/A"
                                        }) on ${new Date(
                                            firstSegment.departure.at
                                        ).toLocaleString()}</p>
                                    <p><strong>Arrival:</strong> ${
                                        lastSegment.arrival.iataCode
                                    } (${
                                            lastSegment.arrival.terminal ||
                                            "N/A"
                                        }) on ${new Date(
                                            lastSegment.arrival.at
                                        ).toLocaleString()}</p>
                                    <p><strong>Flight Duration:</strong> ${formatDuration(
                                        duration
                                    )}</p>
                                    <p><strong>Carrier:</strong> ${
                                        firstSegment.carrierCode
                                    } ${firstSegment.number}</p>
                                    <p><strong>Aircraft:</strong> ${
                                        firstSegment.aircraft.code
                                    }</p>
                                    <p><strong>Stops:</strong> ${
                                        firstSegment.numberOfStops
                                    }</p>
                                    <hr />
                                </div>
                            `;
                                    });

                                    resultsContainer.innerHTML += `</div><hr />`; // End of flight-offer-card
                                });
                            } else return;
                        })
                        .catch((error) => {
                            console.error("Error fetching flights:", error);
                            resultsContainer.innerHTML = `<p>Something went wrong. Please try again.</p>`;
                        });
                } else {
                    alert("Error predicting trip purpose");
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                alert("An error occurred while predicting the trip purpose.");
            });
    });