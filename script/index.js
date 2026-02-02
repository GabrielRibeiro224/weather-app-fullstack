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
let currentCityData = null;
let lastSearchLat, lastSearchLon;
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
    currentCityData = {
      name: name,
      country: country,
      latitude: latitude,
      longitude: longitude,
    };
    lastSearchLat = latitude;
    lastSearchLon = longitude;

    // Chamada para sua API C#
    const response = await fetch(
      `${API_BASE_URL}/city?lat=${latitude}&lon=${longitude}`,
    );

    if (!response.ok) {
      throw new Error(`Erro na API C#: ${response.status}`);
    }

    const data = await response.json();

    // Só prossegue se 'data' tiver o que precisamos
    if (data && data.current) {
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
  const feelsLikeEl = document.getElementById("feelsLike");
  const rainEl = document.getElementById("rainProbability");

  if (cityNameEl) cityNameEl.innerText = `${name}, ${country}`;

  // 1. Processa o bloco 'current' (Dados em tempo real do C#)
  if (data && data.current) {
    if (tempMainEl)
      tempMainEl.innerText = `${Math.round(data.current.temperature_2m)}°`;
    if (windEl) windEl.innerText = `${data.current.wind_speed_10m} km/h`;

    if (feelsLikeEl && data.current.apparent_temperature !== undefined) {
      feelsLikeEl.innerText = `${Math.round(data.current.apparent_temperature)}°`;
    }

    // LÓGICA DA PRECIPITAÇÃO CORRIGIDA
    if (rainEl) {
      if (data.current.precipitation !== undefined) {
        // Prioridade: Valor real em mm do bloco current
        rainEl.innerText = `${data.current.precipitation} mm`;
      } else if (
        data.hourly &&
        data.hourly.precipitation_probability !== undefined
      ) {
        // Fallback: Probabilidade em % do bloco hourly
        rainEl.innerText = `${data.hourly.precipitation_probability[0]}%`;
      } else {
        rainEl.innerText = "0 mm";
      }
    }
  }

  // 2. Processa o bloco 'hourly' (Umidade) - INDEPENDENTE DO BLOCO CURRENT
  if (data && data.hourly && data.hourly.relative_humidity_2m?.length > 0) {
    if (humidityEl) {
      humidityEl.innerText = `${data.hourly.relative_humidity_2m[0]}%`;
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

async function favoriteCurrentCity() {
  if (!currentCityData) return alert("Busque uma cidade antes de favoritar!");
  const cityName = document
    .getElementById("cityName")
    ?.innerText.split(",")[0]
    .trim();
  const country = document
    .getElementById("cityName")
    ?.innerText.split(",")[1]
    ?.trim();

  const favoriteData = {
    Name: cityName,
    Latitude: lastSearchLat,
    Longitude: lastSearchLon,
  };
  try {
    const response = await fetch(`${API_BASE_URL}/favoritos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentCityData),
    });

    if (response.ok) {
      const result = await response.json();

      const cidadeSalva =
        result.Name || result.name || (result.data && result.data.name) || "";

      alert(`Sucesso! A cidade ${cidadeSalva} foi salva no banco de dados.`);
      await loadFavorites();
    } else {
      alert("Erro ao salvar nos favoritos.");
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
  }
}

async function loadFavorites() {
  try {
    const response = await fetch(`${API_BASE_URL}/favoritos`);
    const favorites = await response.json();

    // 1. OLHE ISSO NO CONSOLE (F12)
    console.log("LISTA QUE VEIO DO BANCO:", favorites);

    if (Array.isArray(favorites)) {
      renderFavorites(favorites);
    } else {
      console.error("A API não devolveu uma lista!");
    }
  } catch (error) {
    console.error("Erro ao carregar cidades favoritas:", error);
  }
}

async function deleteCity(id) {
  if (!confirm("Tem certeza que deseja remover esta cidade?")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/favoritos/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      // Recarrega a lista automaticamente após excluir
      await loadFavorites();
    } else {
      alert("Erro ao excluir a cidade do banco de dados.");
    }
  } catch (error) {
    console.error("Erro na requisição de exclusão:", error);
  }
}

function renderFavorites(favorites) {
  const container = document.getElementById("favoritesList");
  if (!container) return;

  // Se não houver nada no banco, mostra uma mensagem amigável
  if (!favorites || favorites.length === 0) {
    container.innerHTML =
      '<p class="text-gray-500 text-center col-span-full py-10">Sua lista de favoritos está vazia.</p>';
    return;
  }

  // Criamos o HTML para cada cidade favoritada
  container.innerHTML = favorites
    .map((city) => {
      // Garantimos que pegamos o nome correto, seja 'name' ou 'Name'
      const nomeCidade = city.name || city.Name || "Cidade sem nome";

      return `
        <div class="bg-[#1B1B3A]/60 border border-white/10 p-5 rounded-3xl flex items-center justify-between group hover:border-blue-500/50 transition-all duration-300">
            <div class="flex flex-col gap-1">
                <span class="text-white font-bold text-lg leading-tight">${nomeCidade}</span>
                <span class="text-gray-400 text-xs uppercase tracking-wider font-semibold">Favorito #${city.id}</span>
            </div>
            
            <div class="flex items-center gap-2">
                <button onclick="searchSavedCity(${city.latitude}, ${city.longitude}, '${nomeCidade}')" 
                        class="p-2.5 bg-blue-500/10 hover:bg-blue-500 rounded-xl transition-colors group-hover:scale-110"
                        title="Ver clima agora">
                    <i data-lucide="search" class="w-5 h-5 text-blue-400 group-hover:text-white"></i>
                </button>

                <button onclick="deleteCity(${city.id})" 
                        class="p-2.5 bg-red-500/10 hover:bg-red-500 rounded-xl transition-colors group-hover:scale-110"
                        title="Remover dos favoritos">
                    <i data-lucide="trash-2" class="w-5 h-5 text-red-400 group-hover:text-white"></i>
                </button>
            </div>
        </div>
        `;
    })
    .join("");

  // Comando essencial para carregar os ícones do Lucide nos novos botões
  if (window.lucide) lucide.createIcons();
}

async function searchSavedCity(lat, lon, name) {
  try {
    const response = await fetch(`${API_BASE_URL}/city?lat=${lat}&lon=${lon}`);
    const data = await response.json();
    updateMainWeather(data, name, "");
  } catch (error) {
    alert("Erro ao carregar clima da cidade favorita.");
  }
}

document.addEventListener("DOMContentLoaded", loadFavorites);
