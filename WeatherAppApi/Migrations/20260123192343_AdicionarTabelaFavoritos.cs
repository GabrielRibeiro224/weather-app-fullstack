using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WheaterAppApi.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarTabelaFavoritos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_FavoriteCities",
                table: "FavoriteCities");

            migrationBuilder.RenameTable(
                name: "FavoriteCities",
                newName: "FavoriteCity");

            migrationBuilder.AddPrimaryKey(
                name: "PK_FavoriteCity",
                table: "FavoriteCity",
                column: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_FavoriteCity",
                table: "FavoriteCity");

            migrationBuilder.RenameTable(
                name: "FavoriteCity",
                newName: "FavoriteCities");

            migrationBuilder.AddPrimaryKey(
                name: "PK_FavoriteCities",
                table: "FavoriteCities",
                column: "Id");
        }
    }
}
