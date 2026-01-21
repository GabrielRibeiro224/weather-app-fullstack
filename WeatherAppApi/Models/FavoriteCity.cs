namespace WeatherAppApi.Models
{
    public class FavoriteCity
    {
        public int Id { get; set; } // Identificador único para o banco de dados
        public string Name { get; set; } = string.Empty; // Nome da cidade
        public double Latitude { get; set; } // Necessário para a API de Tempo
        public double Longitude { get; set; }
    }
}