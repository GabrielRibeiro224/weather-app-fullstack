using Microsoft.AspNetCore.Mvc;
using WeatherAppApi.Models;
using WeatherAppApi.Data;
using Microsoft.EntityFrameworkCore;

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


                var url = $"https://api.open-meteo.com/v1/forecast?latitude={latStr}&longitude={lonStr}&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto";

                var response = await _httpClient.GetStringAsync(url);
                return Content(response, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Este método salva uma cidade nos favoritos (Parte do seu CRUD)
        [HttpPost("favoritos")]
        public async Task<IActionResult> AddFavorite([FromBody] FavoriteCity city) // Use o nome exato da sua classe
        {
            if (city == null) return BadRequest("Dados da cidade não recebidos.");

            // Certifique-se que '_context.Favoritos' é o nome no seu DbContext
            _context.Favoritos.Add(city);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Adicionado com sucesso!", data = city });
        }

        [HttpGet("favoritos")] // Verifique se o nome aqui é igual ao do JS
        public async Task<IActionResult> GetFavorites()
        {
            // O ToListAsync() busca tudo o que está no seu weather.db
            var lista = await _context.FavoriteCities.ToListAsync();
            return Ok(lista);
        }

        [HttpDelete("favoritos/{id}")]
        public async Task<IActionResult> DeleteFavorite(int id)
        {
            var city = await _context.FavoriteCities.FindAsync(id);
            if (city == null) return NotFound();

            _context.FavoriteCities.Remove(city);
            await _context.SaveChangesAsync();
            return NoContent();
        }


    }
}