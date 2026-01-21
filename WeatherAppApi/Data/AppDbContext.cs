using Microsoft.EntityFrameworkCore;
using WeatherAppApi.Models;

namespace WeatherAppApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<FavoriteCity> FavoriteCities { get; set; }
}