const apiKey = 'd1b2c11d31cca0d6ea48d1c0370fb232';
const apiUrl = 'https://api.openweathermap.org/data/2.5';

const cityInput = document.getElementById('cityInput');
const fetchWeatherBtn = document.getElementById('fetchWeatherBtn');
const fetchLocationBtn = document.getElementById('fetchLocationBtn');
const weatherResult = document.getElementById('weatherResult');
const forecast = document.getElementById('forecast');
const dropdown = document.getElementById('cityDropdown');

cityInput.addEventListener('input', function() {
    const query = cityInput.value.trim();
    if (query.length > 0) {
        const recentCitiesList = JSON.parse(localStorage.getItem('recentCities')) || [];
        const filteredCities = recentCitiesList.filter(city => city.toLowerCase().includes(query.toLowerCase()));
        updateDropdown(filteredCities);
    } else {
        dropdown.classList.add('hidden');
    }
});

dropdown.addEventListener('click', function(e) {
    if (e.target.tagName === 'DIV') {
        cityInput.value = e.target.textContent;
        fetchWeatherBtn.click();
        dropdown.classList.add('hidden');
    }
});

document.addEventListener('click', function(e) {
    if (!dropdown.contains(e.target) && e.target !== cityInput) {
        dropdown.classList.add('hidden');
    }
});

fetchWeatherBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim();
    if (city) {
        try {
            const weatherData = await fetchWeatherData(city);
            displayWeatherData(weatherData);
            addRecentCity(city);
            const forecastData = await fetchForecastData(city);
            displayForecastData(forecastData);
        } catch (error) {
            weatherResult.textContent = `Error: ${error.message}`;
            weatherResult.classList.add('text-red-500');
        }
    } else {
        weatherResult.textContent = 'Please enter a city name';
        weatherResult.classList.add('text-red-500');
    }
});

fetchLocationBtn.addEventListener('click', async () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const weatherData = await fetchWeatherDataByCoords(latitude, longitude);
                displayWeatherData(weatherData);
                const forecastData = await fetchForecastData(weatherData.name);
                displayForecastData(forecastData);
            } catch (error) {
                weatherResult.textContent = `Error: ${error.message}`;
                weatherResult.classList.add('text-red-500');
            }
        }, (error) => {
            weatherResult.textContent = `Error: ${error.message}`;
            weatherResult.classList.add('text-red-500');
        });
    } else {
        weatherResult.textContent = 'Geolocation is not supported by this browser.';
        weatherResult.classList.add('text-red-500');
    }
});

async function fetchWeatherData(city) {
    const response = await fetch(`${apiUrl}/weather?q=${city}&appid=${apiKey}&units=metric`);
    if (!response.ok) throw new Error('City not found');
    return await response.json();
}

async function fetchWeatherDataByCoords(lat, lon) {
    const response = await fetch(`${apiUrl}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    if (!response.ok) throw new Error('Weather data not found');
    return await response.json();
}

async function fetchForecastData(city) {
    const response = await fetch(`${apiUrl}/forecast?q=${city}&appid=${apiKey}&units=metric`);
    if (!response.ok) throw new Error('Forecast data not found');
    return await response.json();
}

function displayWeatherData(data) {
    weatherResult.innerHTML = `
        <h2 class="text-2xl font-semibold">${data.name}</h2>
        <p>Temperature: ${data.main.temp}°C</p>
        <p>Weather: ${data.weather[0].description}</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind Speed: ${data.wind.speed} m/s</p>
    `;
}

function displayForecastData(data) {
    forecast.innerHTML = data.list.map(item => `
        <div class="bg-gray-50 p-4 rounded-lg shadow">
            <p class="font-bold">${new Date(item.dt * 1000).toLocaleDateString()}</p>
            <p>Temperature: ${item.main.temp}°C</p>
            <p>Weather: ${item.weather[0].description}</p>
            <p>Humidity: ${item.main.humidity}%</p>
            <p>Wind Speed: ${item.wind.speed} m/s</p>
        </div>
    `).join('');
}

function addRecentCity(city) {
    const recentCitiesList = JSON.parse(localStorage.getItem('recentCities')) || [];
    if (!recentCitiesList.includes(city)) {
        recentCitiesList.push(city);
        localStorage.setItem('recentCities', JSON.stringify(recentCitiesList));
        updateDropdown(recentCitiesList);
    }
}

function updateDropdown(cities) {
    dropdown.innerHTML = cities.map(city => `<div>${city}</div>`).join('');
    dropdown.classList.remove('hidden');
}

