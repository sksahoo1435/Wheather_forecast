const apiKey = 'd1b2c11d31cca0d6ea48d1c0370fb232'; // OpenWeatherMap API key
const apiUrl = 'https://api.openweathermap.org/data/2.5'; // Base URL for the weather API

// DOM elements
const cityInput = document.getElementById('cityInput');
const fetchWeatherBtn = document.getElementById('fetchWeatherBtn');
const fetchLocationBtn = document.getElementById('fetchLocationBtn');
const weatherResult = document.getElementById('weatherResult');
const forecast = document.getElementById('forecast');
const dropdown = document.getElementById('cityDropdown');

// Event listener for input changes in the city input field
cityInput.addEventListener('input', function () {
    const query = cityInput.value.trim(); // Get user input and remove extra spaces
    if (query.length > 0) {
        // Retrieve recent cities from local storage and filter based on input
        const recentCitiesList = JSON.parse(localStorage.getItem('recentCities')) || [];
        const filteredCities = recentCitiesList.filter(city => city.toLowerCase().includes(query.toLowerCase()));
        updateDropdown(filteredCities); // Update the dropdown with filtered cities
    } else {
        dropdown.classList.add('hidden'); // Hide dropdown if input is empty
    }
});

// Event listener for selecting a city from the dropdown
dropdown.addEventListener('click', function (e) {
    if (e.target.tagName === 'DIV') {
        cityInput.value = e.target.textContent; // Set the selected city in the input field
        fetchWeatherBtn.click(); // Trigger weather fetch after city selection
        dropdown.classList.add('hidden'); // Hide dropdown after selection
    }
});

// Hide the dropdown when clicking outside of it
document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target) && e.target !== cityInput) {
        dropdown.classList.add('hidden'); // Hide dropdown if clicked outside
    }
});

// Event listener for fetching weather data based on city input
fetchWeatherBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim(); // Get city name from input
    if (city) {
        try {
            // Clear previous error or success messages
            weatherResult.classList.remove('text-red-500');
            weatherResult.classList.remove('bg-red-100', 'border-red-400', 'text-red-700', 'p-4');
            forecast.innerHTML = ''; // Clear the forecast on new search

            // Fetch weather data and display it
            const weatherData = await fetchWeatherData(city);
            displayWeatherData(weatherData);

            // Add city to recent searches and update the forecast
            addRecentCity(city);
            const forecastData = await fetchForecastData(city);
            displayForecastData(forecastData);
        } catch (error) {
            // Display enhanced error message
            displayErrorMessage(`Error: ${error.message}`);
        }
    } else {
        // Show an error if no city name is provided
        displayErrorMessage('Please enter a city name');
    }
});

// Event listener for fetching weather based on user's current location
fetchLocationBtn.addEventListener('click', async () => {
    if (navigator.geolocation) {
        // Get user's current location
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                // Clear previous error or success messages
                weatherResult.classList.remove('text-red-500');
                weatherResult.classList.remove('bg-red-100', 'border-red-400', 'text-red-700', 'p-4');
                forecast.innerHTML = ''; // Clear forecast on new search

                // Fetch weather data based on location
                const weatherData = await fetchWeatherDataByCoords(latitude, longitude);
                displayWeatherData(weatherData);

                // Fetch and display forecast data for the location
                const forecastData = await fetchForecastData(weatherData.name);
                displayForecastData(forecastData);
            } catch (error) {
                displayErrorMessage(`Error: ${error.message}`);
            }
        }, (error) => {
            displayErrorMessage(`Error: ${error.message}`);
        });
    } else {
        displayErrorMessage('Geolocation is not supported by this browser.');
    }
});

// Fetch weather data for a specific city
async function fetchWeatherData(city) {
    const response = await fetch(`${apiUrl}/weather?q=${city}&appid=${apiKey}&units=metric`);
    if (!response.ok) throw new Error('City not found'); // Error handling if city is not found
    return await response.json(); // Parse and return JSON data
}

// Fetch weather data using coordinates (latitude and longitude)
async function fetchWeatherDataByCoords(lat, lon) {
    const response = await fetch(`${apiUrl}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    if (!response.ok) throw new Error('Weather data not found'); // Error handling if weather data is not found
    return await response.json(); // Parse and return JSON data
}

// Fetch forecast data for a specific city
async function fetchForecastData(city) {
    const response = await fetch(`${apiUrl}/forecast?q=${city}&appid=${apiKey}&units=metric`);
    if (!response.ok) throw new Error('Forecast data not found'); // Error handling if forecast data is not found
    return await response.json(); // Parse and return JSON data
}

// Display current weather data
function displayWeatherData(data) {
    weatherResult.innerHTML = `
        <h2 class="text-2xl font-semibold">${data.name} (${new Date().toLocaleDateString()})</h2>
        <p>Temperature: ${data.main.temp}°C</p>
        <p>Weather: ${data.weather[0].description}</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind Speed: ${data.wind.speed} m/s</p>
    `;
}

// Display forecast data for upcoming days, excluding current day
function displayForecastData(data) {
    const currentDate = new Date().toLocaleDateString(); // Get the current date string

    // Create an object to store one forecast entry per day, excluding the current date
    const forecastByDay = {};

    // Loop through forecast list and select only one entry per day
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString(); // Get the date string
        if (date !== currentDate && !forecastByDay[date]) {
            forecastByDay[date] = item; // Save first entry for each day, excluding the current day
        }
    });

    // Display filtered forecast data
    forecast.innerHTML = Object.values(forecastByDay).map(item => `
        <div class="bg-gray-200 p-2 rounded-lg shadow border border-indigo-600">
            <p class="font-bold">${new Date(item.dt * 1000).toLocaleDateString()}</p>
            <p>Temperature: ${item.main.temp}°C</p>
            <p>Weather: ${item.weather[0].description}</p>
            <p>Humidity: ${item.main.humidity}%</p>
            <p>Wind Speed: ${item.wind.speed} m/s</p>
        </div>
    `).join(''); // Join the results into a single HTML string
}

// Display an enhanced error message and clear the forecast
function displayErrorMessage(message) {
    weatherResult.innerHTML = `
        <div style="color: #dc2626;" class="bg-red-100 border border-red-400 p-4 rounded relative" role="alert">
            <span class="block sm:inline">${message}</span>
        </div>`;
    forecast.innerHTML = ''; // Clear forecast section when error occurs
}

// Add a city to the recent searches list and store in localStorage
function addRecentCity(city) {
    const recentCitiesList = JSON.parse(localStorage.getItem('recentCities')) || [];
    if (!recentCitiesList.includes(city)) {
        recentCitiesList.push(city); // Add the city if it's not already in the list
        localStorage.setItem('recentCities', JSON.stringify(recentCitiesList)); // Save updated list to localStorage
        updateDropdown(recentCitiesList); // Update the dropdown with the recent cities
    }
}

// Update the dropdown with the list of filtered cities
function updateDropdown(cities) {
    dropdown.innerHTML = cities.map(city => `<div>${city}</div>`).join(''); // Display each city in the dropdown
    dropdown.classList.remove('hidden'); // Show the dropdown
}
