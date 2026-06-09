using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebsiteServiceEcommerce.API.Migrations
{
    [Migration("20260607143000_AddOrderStatusHistoryAndPaymentAudit")]
    public partial class AddOrderStatusHistoryAndPaymentAudit : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ConfirmedByUserId",
                table: "Payments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ConfirmedAt",
                table: "Payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentNote",
                table: "Payments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TransferReference",
                table: "Payments",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "OrderStatusHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    FromStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ToStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ChangedByUserId = table.Column<int>(type: "int", nullable: true),
                    ChangedByRole = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStatusHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderStatusHistories_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderStatusHistories_Users_ChangedByUserId",
                        column: x => x.ChangedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ConfirmedByUserId",
                table: "Payments",
                column: "ConfirmedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_ChangedByUserId",
                table: "OrderStatusHistories",
                column: "ChangedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_OrderId",
                table: "OrderStatusHistories",
                column: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Users_ConfirmedByUserId",
                table: "Payments",
                column: "ConfirmedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Users_ConfirmedByUserId",
                table: "Payments");

            migrationBuilder.DropTable(
                name: "OrderStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_Payments_ConfirmedByUserId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ConfirmedAt",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ConfirmedByUserId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaymentNote",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "TransferReference",
                table: "Payments");
        }
    }
}
