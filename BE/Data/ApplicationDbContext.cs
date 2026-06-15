using Microsoft.EntityFrameworkCore;
using WebsiteServiceEcommerce.API.Models;

namespace WebsiteServiceEcommerce.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<UserAddress> UserAddresses { get; set; }
        public DbSet<Provider> Providers { get; set; }
        public DbSet<Package> Packages { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }
        public DbSet<InventoryTransaction> InventoryTransactions { get; set; }
        public DbSet<InventoryAdjustmentRequest> InventoryAdjustmentRequests { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<ProjectDelivery> ProjectDeliveries { get; set; }
        public DbSet<ServiceCategory> ServiceCategories { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<SupportRequest> SupportRequests { get; set; }
        public DbSet<AdminAuditLog> AdminAuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.Address).HasMaxLength(500);
                entity.Property(e => e.Role).HasMaxLength(50);
            });

            modelBuilder.Entity<UserAddress>(entity =>
            {
                entity.ToTable("UserAddresses");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.User)
                    .WithMany(u => u.Addresses)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.Property(e => e.Label).HasMaxLength(80);
                entity.Property(e => e.RecipientName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(50);
                entity.Property(e => e.AddressLine).IsRequired().HasMaxLength(500);
            });

            // Provider configuration
            modelBuilder.Entity<Provider>(entity =>
            {
                entity.ToTable("Suppliers");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CompanyName).HasColumnName("SupplierName");
                entity.Property(e => e.Skills).HasColumnName("CapabilitiesJson");
                entity.Property(e => e.CompletedProjects).HasColumnName("CompletedOrders");
                entity.Property(e => e.IsVerified).HasColumnName("IsVerifiedSupplier");
                entity.HasOne(e => e.User)
                    .WithOne(u => u.Provider)
                    .HasForeignKey<Provider>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.Property(e => e.CompanyName).HasMaxLength(255);
                entity.Property(e => e.Rating).HasColumnType("decimal(3,2)");
            });

            // Package configuration
            modelBuilder.Entity<Package>(entity =>
            {
                entity.ToTable("Products");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ProviderId).HasColumnName("SupplierId");
                entity.Property(e => e.Revisions).HasColumnName("MinOrderQuantity");
                entity.Property(e => e.Features).HasColumnName("SpecificationsJson");
                entity.Property(e => e.IsApproved).HasColumnName("IsPublished");
                entity.HasOne(e => e.Provider)
                    .WithMany(p => p.Packages)
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Category).HasMaxLength(100);
                entity.Property(e => e.Sku).HasMaxLength(80);
                entity.Property(e => e.Unit).HasMaxLength(80);
                entity.Property(e => e.ShortDescription).HasMaxLength(500);
                entity.Property(e => e.ImageUrl).HasMaxLength(500);
            });

            modelBuilder.Entity<ProductImage>(entity =>
            {
                entity.ToTable("ProductImages");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ProductId).HasColumnName("ProductId");
                entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(500);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
                entity.HasOne(e => e.Product)
                    .WithMany(p => p.Images)
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Order configuration
            modelBuilder.Entity<Order>(entity =>
            {
                entity.ToTable("Orders");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ProviderId).HasColumnName("SupplierId");
                entity.Property(e => e.PackageId).HasColumnName("PrimaryProductId");
                entity.HasOne(e => e.Customer)
                    .WithMany(u => u.Orders)
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Provider)
                    .WithMany(p => p.Orders)
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Package)
                    .WithMany(p => p.Orders)
                    .HasForeignKey(e => e.PackageId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.ShippingName).HasMaxLength(255);
                entity.Property(e => e.ShippingPhone).HasMaxLength(50);
                entity.Property(e => e.ShippingAddress).HasMaxLength(500);
                entity.Property(e => e.DeliveryMethod).HasMaxLength(80);
                entity.Property(e => e.AssignedStaffName).HasMaxLength(255);
                entity.Property(e => e.DeliveryRoute).HasMaxLength(120);
                entity.Property(e => e.TrackingCode).HasMaxLength(120);
                entity.Property(e => e.DeliveryNote).HasMaxLength(500);
                entity.Property(e => e.DeliveryProofImageUrl).HasMaxLength(500);
                entity.Property(e => e.DeliveryFailureReason).HasMaxLength(500);
                entity.Property(e => e.ClientOrderKey).HasMaxLength(120);
                entity.HasIndex(e => new { e.CustomerId, e.ClientOrderKey })
                    .IsUnique()
                    .HasFilter("[ClientOrderKey] IS NOT NULL AND [ClientOrderKey] <> ''");
            });

            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.ToTable("OrderItems");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PackageId).HasColumnName("ProductId");
                entity.HasOne(e => e.Order)
                    .WithMany(o => o.OrderItems)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Package)
                    .WithMany()
                    .HasForeignKey(e => e.PackageId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.LineTotal).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<OrderStatusHistory>(entity =>
            {
                entity.ToTable("OrderStatusHistories");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Order)
                    .WithMany(o => o.StatusHistories)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.ChangedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.ChangedByUserId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.Property(e => e.FromStatus).HasMaxLength(50);
                entity.Property(e => e.ToStatus).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ChangedByRole).HasMaxLength(50);
                entity.Property(e => e.Note).HasMaxLength(500);
            });

            modelBuilder.Entity<InventoryTransaction>(entity =>
            {
                entity.ToTable("InventoryTransactions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ProductId).HasColumnName("ProductId");
                entity.HasOne(e => e.Product)
                    .WithMany(p => p.InventoryTransactions)
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Order)
                    .WithMany(o => o.InventoryTransactions)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(e => e.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.Property(e => e.TransactionType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Reason).HasMaxLength(500);
                entity.Property(e => e.CreatedByRole).HasMaxLength(50);
            });

            modelBuilder.Entity<InventoryAdjustmentRequest>(entity =>
            {
                entity.ToTable("InventoryAdjustmentRequests");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Product)
                    .WithMany()
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Provider)
                    .WithMany()
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.RequestedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.RequestedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.ReviewedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.ReviewedByUserId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.Property(e => e.MovementType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Reason).HasMaxLength(500);
                entity.Property(e => e.AdminSignature).HasMaxLength(255);
                entity.Property(e => e.AdminNote).HasMaxLength(500);
            });

            // Payment configuration
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.ToTable("Payments");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Order)
                    .WithMany()
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PaymentMethod).HasMaxLength(100);
                entity.Property(e => e.PaymentStatus).HasMaxLength(50);
                entity.Property(e => e.TransferReference).HasMaxLength(120);
                entity.Property(e => e.PaymentNote).HasMaxLength(500);
                entity.HasOne(e => e.ConfirmedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.ConfirmedByUserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Review configuration
            modelBuilder.Entity<Review>(entity =>
            {
                entity.ToTable("Reviews");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ProviderId).HasColumnName("SupplierId");
                entity.HasOne(e => e.Order)
                    .WithOne(o => o.Review)
                    .HasForeignKey<Review>(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Customer)
                    .WithMany(u => u.Reviews)
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Provider)
                    .WithMany(p => p.Reviews)
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.Property(e => e.Rating).IsRequired();
            });

            // ProjectDelivery configuration
            modelBuilder.Entity<ProjectDelivery>(entity =>
            {
                entity.ToTable("ShipmentUpdates");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PreviewLink).HasColumnName("TrackingCode");
                entity.Property(e => e.SourceFiles).HasColumnName("AttachmentsJson");
                entity.HasOne(e => e.Order)
                    .WithMany(o => o.ProjectDeliveries)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.Property(e => e.Status).HasMaxLength(50);
            });

            // ServiceCategory configuration
            modelBuilder.Entity<ServiceCategory>(entity =>
            {
                entity.ToTable("ProductCategories");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CategoryName).HasColumnName("Name");
                entity.Property(e => e.CategoryName).IsRequired().HasMaxLength(120);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Icon).HasMaxLength(100);
            });

            // Message configuration
            modelBuilder.Entity<Message>(entity =>
            {
                entity.ToTable("OrderMessages");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Order)
                    .WithMany()
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Sender)
                    .WithMany()
                    .HasForeignKey(e => e.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.Property(e => e.Content).IsRequired();
            });

            // Notification configuration
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.ToTable("Notifications");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(180);
                entity.Property(e => e.Content).IsRequired();
            });

            modelBuilder.Entity<SupportRequest>(entity =>
            {
                entity.ToTable("SupportRequests");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Order)
                    .WithMany(o => o.SupportRequests)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Customer)
                    .WithMany(u => u.SupportRequests)
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.Property(e => e.RequestType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Reason).IsRequired().HasMaxLength(500);
                entity.Property(e => e.RequestedResolution).HasMaxLength(500);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.AdminNote).HasMaxLength(500);
            });

            modelBuilder.Entity<AdminAuditLog>(entity =>
            {
                entity.ToTable("AdminAuditLogs");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.AdminUser)
                    .WithMany()
                    .HasForeignKey(e => e.AdminUserId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.Property(e => e.AdminName).HasMaxLength(255);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(120);
                entity.Property(e => e.EntityType).IsRequired().HasMaxLength(120);
                entity.Property(e => e.Summary).HasMaxLength(500);
            });
        }
    }
}
