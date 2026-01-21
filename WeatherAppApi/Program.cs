using WeatherAppApi.Data;
using WeatherAppApi.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// --- CONFIGURAÇÃO DE SERVIÇOS (Container) ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=weather.db"));

builder.Services.AddHttpClient(); // Adicionado apenas uma vez
builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

// --- CONFIGURAÇÃO DO PIPELINE (Middlewares) ---

// 1. Sempre configure o CORS antes do mapeamento dos controllers
app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// 2. Mapeamento das rotas
app.MapControllers();

// Você pode remover ou comentar esse MapGet padrão se não for usar
app.MapGet("/weatherforecast", () => { /* ... código original ... */ })
   .WithName("GetWeatherForecast");

// 3. O ÚNICO app.Run() deve estar no final de tudo
app.Run();

// Definição do record (deve ficar fora do fluxo principal)
record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}