const days = [
  { day: "Tue", tempMax: 20, tempMin: 14, icon: "nuvem-chuva" },
  { day: "Wed", tempMax: 21, tempMin: 15, icon: "nuvem-raio" },
  { day: "Thu", tempMax: 24, tempMin: 14, icon: "sol" },
  { day: "Fri", tempMax: 25, tempMin: 13, icon: "nuvem-sol" },
  { day: "Sat", tempMax: 21, tempMin: 15, icon: "nuvem-chuva" },
  { day: "Sun", tempMax: 25, tempMin: 16, icon: "sol" },
  { day: "Mon", tempMax: 24, tempMin: 15, icon: "nuvem" },
];

const hourlyData = [
  { time: "09:00", temp: 18, icon: "sol" },
  { time: "12:00", temp: 22, icon: "nuvem-sol" },
  { time: "15:00", temp: 24, icon: "sol" },
  { time: "18:00", temp: 20, icon: "nuvem" },
  { time: "21:00", temp: 17, icon: "lua" },
];

const API_BASE_URL = "http://localhost:5257/api/weather"; // Verifique a sua porta no C#

async function searchWeather() {
  const cityInput = document.getElementById("cityInput").value;
  if (!cityInput) return alert("Digite o nome de uma cidade!");

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${cityInput}&count=1&language=pt`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results) return alert("Cidade não encontrada!");
    const { latitude, longitude, name, country } = geoData.results[0];

    // Chamada para sua API C#
    const response = await fetch(
      `${API_BASE_URL}/city?lat=${latitude}&lon=${longitude}`,
    );

    if (!response.ok) {
      throw new Error(`Erro na API C#: ${response.status}`);
    }

    const data = await response.json();
    console.log("DADOS QUE CHEGARAM DO C#:", data); // Olhe isso no console (F12)

    // Só prossegue se 'data' tiver o que precisamos
    if (data && data.current_weather) {
      updateMainWeather(data, name, country);

      // Verificamos se 'daily' e 'hourly' existem antes de chamar as funções
      if (data.daily && data.daily.time) {
        renderDailyForecast(data.daily);
      } else {
        console.warn("Aviso: Dados 'daily' não vieram do C#");
      }

      if (data.hourly && data.hourly.time) {
        renderHourlyForecast(data.hourly);
      } else {
        console.warn("Aviso: Dados 'hourly' não vieram do C#");
      }
    }
  } catch (error) {
    console.error("ERRO DETALHADO NO FLUXO:", error);
    alert("Erro ao buscar dados. Verifique o console (F12).");
  }
}

function updateMainWeather(data, name, country) {
  const cityNameEl = document.getElementById("cityName");
  const tempMainEl = document.getElementById("tempMain");
  const humidityEl = document.getElementById("humidity");
  const windEl = document.getElementById("windSpeed");
  const feelsLikeEl = document.getElementById("feelsLike"); // Você já tem esta linha!

  if (cityNameEl) cityNameEl.innerText = `${name}, ${country}`;

  if (data && data.current_weather) {
    // 1. GARANTE A TEMPERATURA REAL
    if (tempMainEl)
      tempMainEl.innerText = `${Math.round(data.current_weather.temperature)}°`;
    if (windEl) windEl.innerText = `${data.current_weather.windspeed} km/h`;
  }

  if (data && data.hourly) {
    // 2. ALTERAÇÃO DO FEELS LIKE (SENSAÇÃO TÉRMICA)
    // Buscamos a 'apparent_temperature' que vem no array hourly
    if (
      feelsLikeEl &&
      data.hourly.apparent_temperature &&
      data.hourly.apparent_temperature.length > 0
    ) {
      feelsLikeEl.innerText = `${Math.round(data.hourly.apparent_temperature[0])}°`;
    } else if (feelsLikeEl && data.current_weather) {
      // Plano B: Se não houver sensação térmica, usa a temperatura real
      feelsLikeEl.innerText = `${Math.round(data.current_weather.temperature)}°`;
    }

    // Trecho da Humidade (que você já tinha)
    if (
      humidityEl &&
      data.hourly.relative_humidity_2m &&
      data.hourly.relative_humidity_2m.length > 0
    ) {
      humidityEl.innerText = `${data.hourly.relative_humidity_2m[0]}%`;
    }

    const rainEl = document.getElementById("rainProbability");
    if (
      rainEl &&
      data.hourly.precipitation_probability &&
      data.hourly.precipitation_probability.length > 0
    ) {
      rainEl.innerText = `${data.hourly.precipitation_probability[0]}%`;
    }
  }
}

function renderDailyForecast(dailyData) {
  const container = document.getElementById("dailyForecast");
  if (!container) return;

  if (!dailyData) {
    container.innerHTML =
      '<p class="text-gray-500">Pesquise uma cidade para ver a previsão.</p>';
    return;
  }

  container.innerHTML = "";

  dailyData.time.forEach((date, index) => {
    console.log("Renderizando cards");
    const card = document.createElement("div");
    // Adicionamos "flex-shrink-0" para o card não esmagar
    // e "w-32" para definir uma largura fixa para cada um
    card.className =
      "flex-none w-[110px] bg-[#1B1B3A]/40 border border-white/5 rounded-2xl p-4 w-32 flex-shrink-0 flex flex-col items-center gap-3";
    const dayName = new Date(date).toLocaleDateString("pt-BR", {
      weekday: "short",
    });

    card.innerHTML = `
            <p class="text-gray-400 font-medium">${dayName}</p>
            <i data-lucide="cloud" class="w-10 h-10 text-blue-400"></i>
            <div class="flex flex-col items-center">
                <span class="text-lg font-bold">${Math.round(dailyData.temperature_2m_max[index])}°</span>
                <span class="text-xs text-gray-500 font-semibold">${Math.round(dailyData.temperature_2m_max[index])}°</span>
            </div>
        `;
    container.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}
renderDailyForecast();

function renderHourlyForecast(hourlyData) {
  const container = document.getElementById("hourlyList");
  if (!container || !hourlyData || !hourlyData.time) return;

  container.innerHTML = "";

  // Exibe as próximas 6 horas
  for (let i = 0; i < 6; i++) {
    const row = document.createElement("div");
    row.className =
      "flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors";

    // Extrai apenas a hora do formato 2026-01-19T20:00
    const time = hourlyData.time[i].split("T")[1];

    row.innerHTML = `
            <span class="text-gray-400 font-medium w-12">${time}</span>
            <i data-lucide="clock" class="w-6 h-6 text-blue-400"></i>
            <span class="font-bold text-lg w-8 text-right">${Math.round(hourlyData.temperature_2m[i])}°</span>
        `;
    container.appendChild(row);
  }
  if (window.lucide) lucide.createIcons();
}

if (typeof days !== "undefined") {
  renderDailyForecast(null);
}
