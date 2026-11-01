
const countrySelect = document.getElementById("countrySelect");
const stateSelect = document.getElementById("stateSelect");
const citySelect = document.getElementById("citySelect");
const exploreButton = document.getElementById("exploreButton");
const message = document.getElementById("message");
const weatherSection = document.getElementById("weatherSection");
const districtValue = document.getElementById("districtValue");

const COUNTRIES_API = "https://countriesnow.space/api/v0.1/countries";
const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

let selectedPlace = null;

const weatherTypes = {
    0: ["Clear sky", "☀️"],
    1: ["Mainly clear", "🌤️"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Foggy", "🌫️"],
    48: ["Rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Heavy drizzle", "🌧️"],
    56: ["Freezing drizzle", "🌧️"],
    57: ["Freezing drizzle", "🌧️"],
    61: ["Light rain", "🌦️"],
    63: ["Rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    66: ["Freezing rain", "🌧️"],
    67: ["Heavy freezing rain", "🌧️"],
    71: ["Light snowfall", "🌨️"],
    73: ["Snowfall", "❄️"],
    75: ["Heavy snowfall", "❄️"],
    77: ["Snow grains", "🌨️"],
    80: ["Rain showers", "🌦️"],
    81: ["Rain showers", "🌧️"],
    82: ["Heavy rain showers", "⛈️"],
    85: ["Snow showers", "🌨️"],
    86: ["Heavy snow showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with hail", "⛈️"],
    99: ["Severe thunderstorm", "⛈️"]
};

function getWeatherInfo(code) {
    return weatherTypes[code] || ["Unknown conditions", "🌍"];
}

function setMessage(text) {
    message.textContent = text;
}

function setOptions(select, values, placeholder) {
    select.innerHTML = "";

    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    select.appendChild(first);

    values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

async function loadCountries() {
    try {
        setMessage("Loading worldwide locations...");

        const response = await fetch(COUNTRIES_API);

        if (!response.ok) {
            throw new Error("Could not load countries.");
        }

        const result = await response.json();

        if (!result.data) {
            throw new Error("Country data is unavailable.");
        }

        const countries = result.data
            .map(item => item.country)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        setOptions(countrySelect, countries, "Select a country");
        countrySelect.disabled = false;
        setMessage("Choose a country to begin exploring.");

    } catch (error) {
        setMessage(error.message + " Please refresh the page.");
        console.error(error);
    }
}

async function loadStates(country) {
    stateSelect.disabled = true;
    citySelect.disabled = true;
    exploreButton.disabled = true;

    setOptions(stateSelect, [], "Loading regions...");
    setOptions(citySelect, [], "Choose a region first");
    districtValue.textContent = "Select a city to detect its area";
    selectedPlace = null;

    try {
        const response = await fetch(
            `${COUNTRIES_API}/states`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ country })
            }
        );

        if (!response.ok) {
            throw new Error("Could not load regions.");
        }

        const result = await response.json();
        const states = (result.data?.states || [])
            .map(item => item.name)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        if (!states.length) {
            setMessage("No regions were listed for this country.");
            return;
        }

        setOptions(stateSelect, states, "Select a state or region");
        stateSelect.disabled = false;
        setMessage("Now choose a state or region.");

    } catch (error) {
        setMessage(error.message);
        console.error(error);
    }
}

async function loadCities(country, state) {
    citySelect.disabled = true;
    exploreButton.disabled = true;
    selectedPlace = null;
    districtValue.textContent = "Select a city to detect its area";
    setOptions(citySelect, [], "Loading cities...");

    try {
        const response = await fetch(
            `${COUNTRIES_API}/state/cities`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ country, state })
            }
        );

        if (!response.ok) {
            throw new Error("Could not load cities.");
        }

        const result = await response.json();

        const cities = [...new Set(result.data || [])]
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        if (!cities.length) {
            setOptions(citySelect, [], "No cities listed");
            setMessage("No cities were found for this region.");
            return;
        }

        setOptions(citySelect, cities, "Select a city");
        citySelect.disabled = false;
        setMessage(`${cities.length} cities and towns available. Choose one.`);

    } catch (error) {
        setMessage(error.message);
        console.error(error);
    }
}

function normalize(value) {
    return (value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

async function findSelectedPlace(city, state, country) {
    const url = `${GEOCODING_API}?name=${encodeURIComponent(city)}&count=100&language=en&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Location search is temporarily unavailable.");
    }

    const result = await response.json();
    const places = result.results || [];

    const matchingCountry = places.filter(place =>
        normalize(place.country) === normalize(country)
    );

    const matchingState = matchingCountry.filter(place =>
        normalize(place.admin1) === normalize(state)
    );

    return matchingState[0] || matchingCountry[0] || places[0] || null;
}

async function selectCity() {
    const city = citySelect.value;
    const state = stateSelect.value;
    const country = countrySelect.value;

    selectedPlace = null;
    exploreButton.disabled = true;

    if (!city) {
        districtValue.textContent = "Select a city to detect its area";
        return;
    }

    try {
        setMessage("Identifying the exact location...");

        const place = await findSelectedPlace(city, state, country);

        if (!place) {
            throw new Error("Exact coordinates could not be found for this city.");
        }

        selectedPlace = place;

        const district =
            place.admin2 ||
            place.admin3 ||
            place.admin4 ||
            "Not available in location database";

        districtValue.textContent = district;
        exploreButton.disabled = false;
        setMessage(`Location identified: ${place.name}, ${place.country}.`);

    } catch (error) {
        selectedPlace = null;
        districtValue.textContent = "Area could not be identified";
        setMessage(error.message);
        console.error(error);
    }
}

function getInsight(temp, humidity, wind, code) {
    if (code >= 95) {
        return {
            title: "Storm alert in the atmosphere",
            text: "Thunderstorm conditions are reported. Consider moving indoors and avoiding exposed outdoor areas."
        };
    }

    if (code >= 51 && code <= 82) {
        return {
            title: "A rainy day ahead",
            text: "Rain or showers are reported. Carry an umbrella and allow extra time for outdoor travel."
        };
    }

    if (temp >= 35) {
        return {
            title: "The heat is building",
            text: "Temperatures are high. Stay hydrated, seek shade and limit strenuous outdoor activity during the hottest hours."
        };
    }

    if (humidity >= 80) {
        return {
            title: "Moisture in the air",
            text: "Humidity is high, so the air may feel warmer and more uncomfortable than the temperature suggests."
        };
    }

    if (wind >= 30) {
        return {
            title: "A breezy atmosphere",
            text: "Wind speeds are elevated. Take care around exposed areas and lightweight outdoor objects."
        };
    }

    if (temp <= 10) {
        return {
            title: "A cooler atmosphere",
            text: "Temperatures are low. Consider an extra layer if you're planning to spend time outdoors."
        };
    }

    return {
        title: "A relatively comfortable day",
        text: "Current conditions look fairly moderate. Check the forecast again before making outdoor plans."
    };
}

function updateBackground(code) {
    const visual = document.getElementById("weatherVisual");

    if (code >= 95) {
        visual.style.background = "linear-gradient(145deg, #344052, #596779)";
    } else if (code >= 51 && code <= 82) {
        visual.style.background = "linear-gradient(145deg, #526c78, #82969c)";
    } else if (code === 45 || code === 48) {
        visual.style.background = "linear-gradient(145deg, #8c9b9a, #bdc8c0)";
    } else if (code >= 1 && code <= 3) {
        visual.style.background = "linear-gradient(145deg, #a3b8b4, #d4c8a9)";
    } else {
        visual.style.background = "linear-gradient(145deg, #d7b99b, #a7b9ae 65%, #788f83)";
    }
}

function formatTime(value) {
    if (!value) return "--:--";

    const time = value.split("T")[1];
    if (!time) return "--:--";

    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

async function loadWeather() {
    if (!selectedPlace) return;

    exploreButton.disabled = true;
    setMessage("Exploring the atmosphere...");
    weatherSection.classList.add("hidden");

    try {
        const url =
            `${WEATHER_API}?latitude=${selectedPlace.latitude}` +
            `&longitude=${selectedPlace.longitude}` +
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,pressure_msl" +
            "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset" +
            "&timezone=auto&forecast_days=5";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Weather data is temporarily unavailable.");
        }

        const data = await response.json();

        displayWeather(selectedPlace, data);

        weatherSection.classList.remove("hidden");
        setMessage("Weather intelligence updated successfully.");

    } catch (error) {
        setMessage(error.message);
        console.error(error);
    } finally {
        exploreButton.disabled = false;
    }
}

function displayWeather(place, data) {
    const current = data.current;
    const daily = data.daily;
    const [description, icon] = getWeatherInfo(current.weather_code);

    document.getElementById("cityName").textContent =
        `${place.name}, ${place.country}`;

    document.getElementById("locationDetails").textContent =
        [place.admin1, place.admin2].filter(Boolean).join(" • ");

    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    document.getElementById("weatherIcon").textContent = icon;
    document.getElementById("temperature").textContent =
        `${Math.round(current.temperature_2m)}°`;

    document.getElementById("weatherDescription").textContent = description;

    document.getElementById("feelsLike").textContent =
        `${Math.round(current.apparent_temperature)}°`;

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    document.getElementById("wind").textContent =
        Math.round(current.wind_speed_10m);

    document.getElementById("pressure").textContent =
        Math.round(current.pressure_msl);

    document.getElementById("sunrise").textContent =
        formatTime(daily.sunrise?.[0]);

    document.getElementById("sunset").textContent =
        formatTime(daily.sunset?.[0]);

    const insight = getInsight(
        current.temperature_2m,
        current.relative_humidity_2m,
        current.wind_speed_10m,
        current.weather_code
    );

    document.getElementById("insightTitle").textContent = insight.title;
    document.getElementById("weatherInsight").textContent = insight.text;

    updateBackground(current.weather_code);

    const forecastGrid = document.getElementById("forecastGrid");
    forecastGrid.innerHTML = "";

    daily.time.forEach((date, index) => {
        const [dayDescription, dayIcon] =
            getWeatherInfo(daily.weather_code[index]);

        const dayName = new Date(date + "T12:00:00")
            .toLocaleDateString("en-IN", { weekday: "short" });

        const card = document.createElement("article");
        card.className = "forecast-card";

        const day = document.createElement("p");
        day.className = "day";
        day.textContent = index === 0 ? "TODAY" : dayName.toUpperCase();

        const iconElement = document.createElement("div");
        iconElement.className = "icon";
        iconElement.textContent = dayIcon;

        const high = document.createElement("h3");
        high.textContent = `${Math.round(daily.temperature_2m_max[index])}°`;

        const low = document.createElement("p");
        low.textContent = `Low ${Math.round(daily.temperature_2m_min[index])}°`;

        const condition = document.createElement("p");
        condition.textContent = dayDescription;

        const rain = document.createElement("p");
        rain.textContent = `Rain: ${daily.precipitation_probability_max[index] ?? 0}%`;

        card.append(day, iconElement, high, low, condition, rain);
        forecastGrid.appendChild(card);
    });
}

// Cascading location dropdowns
countrySelect.addEventListener("change", () => {
    if (countrySelect.value) {
        loadStates(countrySelect.value);
    }
});

stateSelect.addEventListener("change", () => {
    if (stateSelect.value) {
        loadCities(countrySelect.value, stateSelect.value);
    }
});

citySelect.addEventListener("change", selectCity);

exploreButton.addEventListener("click", loadWeather);

// Initialize country list
loadCountries();
