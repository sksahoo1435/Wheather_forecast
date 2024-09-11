const apiKey = 'd1b2c11d31cca0d6ea48d1c0370fb232'; // OpenWeatherMap API key
const apiUrl = 'https://api.openweathermap.org/data/2.5'; // Base URL for the weather API

// DOM elements
const cityInput = document.getElementById('cityInput');
const fetchWeatherBtn = document.getElementById('fetchWeatherBtn');
const fetchLocationBtn = document.getElementById('fetchLocationBtn');
const weatherResult = document.getElementById('weatherResult');
const forecast = document.getElementById('forecast');
const dropdown = document.getElementById('cityDropdown');

// Check and display recent cities from local storage on page load
document.addEventListener('DOMContentLoaded', () => {
    const recentCitiesList = JSON.parse(localStorage.getItem('recentCities')) || [];
    if (recentCitiesList.length > 0) {
        updateDropdown(recentCitiesList);
        dropdown.classList.remove('hidden'); // Show dropdown if there are recent cities on load
    }
    weatherResult.innerHTML = `<p class="text-stone-50">Please select a city</p>`
});


// Event listener for input changes in the city input field
cityInput.addEventListener('input', function () {
    const query = cityInput.value.trim();
    const recentCitiesList = JSON.parse(localStorage.getItem('recentCities')) || [];
    
    if (query.length > 0) {
        const filteredCities = recentCitiesList.filter(city => city.toLowerCase().includes(query.toLowerCase()));
        updateDropdown(filteredCities); // Update dropdown with filtered results
    } else {
        updateDropdown(recentCitiesList); // If input is empty, show all recent cities
    }
});

// Function to update the dropdown with the list of recent cities
function updateDropdown(cities) {
    if (cities.length > 0) {
        dropdown.innerHTML = cities.map(city => `<div class="dropdown-item p-2 hover:bg-gray-200 cursor-pointer">${city}</div>`).join('');
        dropdown.classList.remove('hidden'); // Show dropdown when there are cities
    } else {
        dropdown.classList.add('hidden'); // Hide dropdown if no recent cities
    }
}


// Event listener for selecting a city from the dropdown
dropdown.addEventListener('click', function (e) {
    if (e.target && e.target.matches('.dropdown-item')) {
        cityInput.value = e.target.textContent; // Set the selected city in the input field
        fetchWeatherBtn.click(); // Trigger weather fetch after city selection
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

async function fetchWeatherData(city) {
    const response = await fetch(`${apiUrl}/weather?q=${city}&appid=${apiKey}&units=metric`);
    if (!response.ok) throw new Error('City not found'); 
    return await response.json(); 
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

// Display current weather data with icons
function displayWeatherData(data) {
    const iconCode = data.weather[0].icon; // Get weather icon code
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`; // Build icon URL

    weatherResult.innerHTML = `
        <div class="relative flex flex-row gap-2 h-10">
            <h2 class="text-2xl font-semibold">${data.name} (${new Date().toLocaleDateString()})</h2>
            <div class="relative h-7 w-7 rounded-3xl bg-violet-100 m-1 flex items-center justify-center">
                <img src="${iconUrl}" alt="Weather Icon" class="w-6 h-6 mx-auto"/> 
            </div>
        </div>
        <p>Temperature: ${data.main.temp}°C</p>
        <p>Weather: ${data.weather[0].description}</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind Speed: ${data.wind.speed} m/s</p>
    `;
}


// Display forecast data for upcoming days, including weather icons
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

    // Display filtered forecast data, including weather icons
    forecast.innerHTML = Object.values(forecastByDay).map(item => {
        const iconCode = item.weather[0].icon; // Get the weather icon code
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`; // Build icon URL

        return `
            <div class="bg-gray-100 p-2 rounded-lg shadow border text-left border-indigo-600">
                <div class="relative flex flex-row gap-2 h-10">
                    <p class="font-bold">${new Date(item.dt * 1000).toLocaleDateString()}</p>
                    <div class="relative h-7 w-7 rounded-3xl bg-violet-300 flex items-center justify-center">
                        <img src="${iconUrl}" alt="Weather Icon" class="w-6 h-6 mx-auto"/> 
                    </div>
                </div>
                <div class="flex flex-col space-x">
                    <p>Temperature: ${item.main.temp}°C</p>
                    <p>Weather: ${item.weather[0].description}</p>
                    <p>Humidity: ${item.main.humidity}%</p>
                    <p>Wind Speed: ${item.wind.speed} m/s</p>
                </div>
            </div>
        `;
    }).join(''); // Join the results into a single HTML string
}


// Display an enhanced error message and clear the forecast
function displayErrorMessage(message) {
    weatherResult.innerHTML = `
        <div style="color: #dc2626;" class="bg-red-100 border border-red-400 p-4 rounded relative" role="alert">
            <span class="block sm:inline">${message}</span>
        </div>`;
    forecast.innerHTML = ''; // Clear forecast section when error occurs
}

// Function to add a city to the recent searches list
function addRecentCity(city) {
    let recentCitiesList = JSON.parse(localStorage.getItem('recentCities')) || [];
    if (!recentCitiesList.includes(city)) {
        recentCitiesList.push(city); // Add the city if not already in the list
        localStorage.setItem('recentCities', JSON.stringify(recentCitiesList));
        updateDropdown(recentCitiesList); // Update dropdown with new city
        dropdown.classList.remove('hidden'); // Ensure dropdown remains visible
    }
}

// Update the dropdown with the list of recent cities
function updateDropdown(cities) {
    if (cities.length > 0) {
        dropdown.innerHTML = cities.map(city => `<div class="dropdown-item">${city}</div>`).join('');
        dropdown.classList.remove('hidden'); // Show dropdown when there are cities
    } else {
        dropdown.classList.add('hidden'); // Hide dropdown if no recent cities
    }
}

// Hide dropdown only if there are no cities in local storage or input field is cleared
document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target) && e.target !== cityInput) {
        const recentCitiesList = JSON.parse(localStorage.getItem('recentCities')) || [];
        if (recentCitiesList.length === 0) {
            dropdown.classList.add('hidden'); // Hide dropdown if no recent cities
        }
    }
});