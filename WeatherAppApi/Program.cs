using WeatherAppApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// --- CONFIGURAÇÃO DE SERVIÇOS ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=weather.db"));

builder.Services.AddHttpClient();
builder.Services.AddControllers();

// CORREÇÃO: Nome da política padronizado para "PermitirTudo"
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTudo", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

// --- CONFIGURAÇÃO DO PIPELINE (Middlewares) ---

// 1. CORREÇÃO: O nome aqui DEVE ser idêntico ao definido acima
app.UseCors("PermitirTudo");

// 2. Recomendado: Adicione isso se for usar autenticação no futuro
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection();

// 3. Mapeamento das rotas da sua API (onde estão seus favoritos)
app.MapControllers();

app.Run();

// Definição do record (Opcional se você não for usar o endpoint padrão)
record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}