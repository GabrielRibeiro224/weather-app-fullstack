using Microsoft.AspNetCore.Mvc;
using WeatherAppApi.Models;
using WeatherAppApi.Data; // Vamos criar esta pasta no próximo passo para o Banco de Dados

namespace WeatherAppApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeatherController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly AppDbContext _context;

        public WeatherController(HttpClient httpClient, AppDbContext context)
        {
            _httpClient = httpClient;
            _context = context;
        }

        // Este método busca o clima atual na Open-Meteo
        [HttpGet("city")]
        public async Task<IActionResult> GetWeather(double lat, double lon)
        {
            try
            {
                // 1. Primeiro criamos as variáveis (Isso resolve o erro CS0103)
                var culture = System.Globalization.CultureInfo.InvariantCulture;
                string latStr = lat.ToString(culture);
                string lonStr = lon.ToString(culture);

                // 2. Agora usamos elas na URL
                var url = $"https://api.open-meteo.com/v1/forecast?latitude={latStr}&longitude={lonStr}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto";

                var response = await _httpClient.GetStringAsync(url);
                return Content(response, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Este método salva uma cidade nos favoritos (Parte do seu CRUD)
        [HttpPost("favorite")]
        public async Task<IActionResult> AddFavorite(FavoriteCity city)
        {
            _context.FavoriteCities.Add(city);
            await _context.SaveChangesAsync();
            return Ok(city);
        }

        // DICA: Depois podemos adicionar o GET, PUT e DELETE para completar o CRUD
    }
}