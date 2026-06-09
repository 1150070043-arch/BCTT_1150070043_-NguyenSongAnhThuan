using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebsiteServiceEcommerce.API.Migrations
{
    public partial class AddOrderClientOrderKey : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ClientOrderKey",
                table: "Orders",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CustomerId_ClientOrderKey",
                table: "Orders",
                columns: new[] { "CustomerId", "ClientOrderKey" },
                unique: true,
                filter: "[ClientOrderKey] IS NOT NULL AND [ClientOrderKey] <> ''");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_CustomerId_ClientOrderKey",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ClientOrderKey",
                table: "Orders");
        }
    }
}
