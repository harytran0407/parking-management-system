using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Models;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;

namespace ParkingManagement.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Booking> Bookings { get; set; }

    public virtual DbSet<FloorZone> FloorZones { get; set; }

    public virtual DbSet<IncidentLog> IncidentLogs { get; set; }

    public virtual DbSet<MonthlyPass> MonthlyPasses { get; set; }

    public virtual DbSet<ParkingBuilding> ParkingBuildings { get; set; }

    public virtual DbSet<ParkingSession> ParkingSessions { get; set; }

    public virtual DbSet<ParkingSlot> ParkingSlots { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<PricingPolicy> PricingPolicies { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Vehicle> Vehicles { get; set; }

    public virtual DbSet<VehicleType> VehicleTypes { get; set; }

    public virtual DbSet<SlotStatusLog> SlotStatusLogs { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {

    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_0900_ai_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => e.BookingId).HasName("PRIMARY");

            entity.ToTable("booking");

            entity.HasIndex(e => e.VehicleUserId, "FK_BOOKING_OWNER");

            entity.HasIndex(e => e.SlotId, "FK_BOOKING_SLOT");

            entity.HasIndex(e => e.VehicleId, "FK_BOOKING_VEHICLE");

            entity.Property(e => e.BookingId).HasColumnName("BOOKING_ID");
            entity.Property(e => e.BookingTime)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("BOOKING_TIME");
            entity.Property(e => e.ExpectedArrival)
                .HasColumnType("datetime")
                .HasColumnName("EXPECTED_ARRIVAL");
            entity.Property(e => e.ExpiredAt)
                .HasColumnType("datetime")
                .HasColumnName("EXPIRED_AT");
            entity.Property(e => e.Notes)
                .HasMaxLength(255)
                .HasColumnName("NOTES");
            entity.Property(e => e.SlotId)
                .HasMaxLength(20)
                .HasColumnName("SLOT_ID");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'PENDING'")
                .HasColumnType("enum('PENDING','CONFIRMED','CANCELLED','COMPLETED')")
                .HasColumnName("STATUS");
            entity.Property(e => e.VehicleId).HasColumnName("VEHICLE_ID");
            entity.Property(e => e.VehicleUserId)
                .HasMaxLength(20)
                .HasColumnName("VEHICLE_USER_ID");

            entity.HasOne(d => d.Slot).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.SlotId)
                .HasConstraintName("FK_BOOKING_SLOT");

            entity.HasOne(d => d.Vehicle).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.VehicleId)
                .HasConstraintName("FK_BOOKING_VEHICLE");

            entity.HasOne(d => d.VehicleUser).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.VehicleUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BOOKING_OWNER");
        });

        modelBuilder.Entity<FloorZone>(entity =>
        {
            entity.HasKey(e => e.ZoneId).HasName("PRIMARY");

            entity.ToTable("floor_zone");

            entity.HasIndex(e => e.BuildingId, "FK_ZONE_BUILDING");

            entity.HasIndex(e => e.VehicleTypeId, "FK_ZONE_TYPE");

            entity.Property(e => e.ZoneId).HasColumnName("ZONE_ID");
            entity.Property(e => e.BuildingId)
                .HasMaxLength(10)
                .HasColumnName("BUILDING_ID");
            entity.Property(e => e.Capacity).HasColumnName("CAPACITY");
            entity.Property(e => e.FloorNumber).HasColumnName("FLOOR_NUMBER");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'ACTIVE'")
                .HasColumnType("enum('ACTIVE','MAINTENANCE')")
                .HasColumnName("STATUS");
            entity.Property(e => e.VehicleTypeId).HasColumnName("VEHICLE_TYPE_ID");
            entity.Property(e => e.ZoneName)
                .HasMaxLength(50)
                .HasColumnName("ZONE_NAME");

            entity.HasOne(d => d.Building).WithMany(p => p.FloorZones)
                .HasForeignKey(d => d.BuildingId)
                .HasConstraintName("FK_ZONE_BUILDING");

            entity.HasOne(d => d.VehicleType).WithMany(p => p.FloorZones)
                .HasForeignKey(d => d.VehicleTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ZONE_TYPE");
        });

        modelBuilder.Entity<IncidentLog>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("PRIMARY");

            entity.ToTable("incident_log");

            entity.HasIndex(e => e.PaymentId, "FK_INCIDENT_PAYMENT");

            entity.HasIndex(e => e.SessionId, "FK_INCIDENT_SESSION");

            entity.HasIndex(e => e.ResolvedBy, "FK_INCIDENT_STAFF");

            entity.HasIndex(e => e.ReportedBy, "FK_INCIDENT_USER");

            entity.Property(e => e.LogId).HasColumnName("LOG_ID");
            entity.Property(e => e.CustomerEmail)
                .HasMaxLength(100)
                .HasColumnName("CUSTOMER_EMAIL");
            entity.Property(e => e.CustomerPhone)
                .HasMaxLength(15)
                .HasColumnName("CUSTOMER_PHONE");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnName("DESCRIPTION");
            entity.Property(e => e.IssueType)
                .HasColumnType("enum('LOST_TICKET','WRONG_SLOT','SYSTEM_ERROR','OTHER')")
                .HasColumnName("ISSUE_TYPE");
            entity.Property(e => e.PaymentId)
                .HasMaxLength(20)
                .HasColumnName("PAYMENT_ID");
            entity.Property(e => e.ReportTime)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("REPORT_TIME");
            entity.Property(e => e.ReportedBy)
                .HasMaxLength(20)
                .HasColumnName("REPORTED_BY");
            entity.Property(e => e.ResolvedAt)
                .HasColumnType("datetime")
                .HasColumnName("RESOLVED_AT");
            entity.Property(e => e.ResolvedBy)
                .HasMaxLength(20)
                .HasColumnName("RESOLVED_BY");
            entity.Property(e => e.SessionId)
                .HasMaxLength(20)
                .HasColumnName("SESSION_ID");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'OPEN'")
                .HasColumnType("enum('OPEN','RESOLVED')")
                .HasColumnName("STATUS");

            entity.HasOne(d => d.Payment).WithMany(p => p.IncidentLogs)
                .HasForeignKey(d => d.PaymentId)
                .HasConstraintName("FK_INCIDENT_PAYMENT");

            entity.HasOne(d => d.ReportedByNavigation).WithMany(p => p.IncidentLogReportedByNavigations)
                .HasForeignKey(d => d.ReportedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_INCIDENT_USER");

            entity.HasOne(d => d.ResolvedByNavigation).WithMany(p => p.IncidentLogResolvedByNavigations)
                .HasForeignKey(d => d.ResolvedBy)
                .HasConstraintName("FK_INCIDENT_STAFF");

            entity.HasOne(d => d.Session).WithMany(p => p.IncidentLogs)
                .HasForeignKey(d => d.SessionId)
                .HasConstraintName("FK_INCIDENT_SESSION");
        });

        modelBuilder.Entity<MonthlyPass>(entity =>
        {
            entity.HasKey(e => e.MonthlyPassId).HasName("PRIMARY");

            entity.ToTable("monthly_pass");

            entity.HasIndex(e => e.PlanId, "FK_MONTHLYPASS_PLAN");

            entity.HasIndex(e => e.VehicleId, "FK_MONTHLYPASS_VEHICLE");

            entity.Property(e => e.MonthlyPassId).HasColumnName("MONTHLY_PASS_ID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.EndDate).HasColumnName("END_DATE");
            entity.Property(e => e.PaymentStatus)
                .HasDefaultValueSql("'PENDING'")
                .HasColumnType("enum('PENDING','PAID')")
                .HasColumnName("PAYMENT_STATUS");
            entity.Property(e => e.PlanId)
                .HasMaxLength(50)
                .HasColumnName("PLAN_ID");
            entity.Property(e => e.StartDate).HasColumnName("START_DATE");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'ACTIVE'")
                .HasColumnType("enum('ACTIVE','EXPIRED')")
                .HasColumnName("STATUS");
            entity.Property(e => e.VehicleId).HasColumnName("VEHICLE_ID");

            entity.HasOne(d => d.Plan).WithMany(p => p.MonthlyPasses)
                .HasForeignKey(d => d.PlanId)
                .HasConstraintName("FK_MONTHLYPASS_PLAN");

            entity.HasOne(d => d.Vehicle).WithMany(p => p.MonthlyPasses)
                .HasForeignKey(d => d.VehicleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MONTHLYPASS_VEHICLE");
        });

        modelBuilder.Entity<ParkingBuilding>(entity =>
        {
            entity.HasKey(e => e.BuildingId).HasName("PRIMARY");

            entity.ToTable("parking_building");

            entity.Property(e => e.BuildingId)
                .HasMaxLength(10)
                .HasColumnName("BUILDING_ID");
            entity.Property(e => e.Address)
                .HasMaxLength(500)
                .HasColumnName("ADDRESS");
            entity.Property(e => e.BuildingName)
                .HasMaxLength(200)
                .HasColumnName("BUILDING_NAME");
            entity.Property(e => e.Is247)
                .HasDefaultValueSql("'0'")
                .HasColumnName("IS_24_7");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'ACTIVE'")
                .HasColumnType("enum('ACTIVE','MAINTENANCE','CLOSED')")
                .HasColumnName("STATUS");
            entity.Property(e => e.TotalFloors).HasColumnName("TOTAL_FLOORS");
            entity.Property(e => e.TotalSlots).HasColumnName("TOTAL_SLOTS");
            entity.Property(e => e.WeekdayHours)
                .HasMaxLength(20)
                .HasColumnName("WEEKDAY_HOURS");
            entity.Property(e => e.WeekendHours)
                .HasMaxLength(20)
                .HasColumnName("WEEKEND_HOURS");
        });

        modelBuilder.Entity<ParkingSession>(entity =>
        {
            entity.HasKey(e => e.SessionId).HasName("PRIMARY");

            entity.ToTable("parking_session");

            entity.HasIndex(e => e.BookingId, "FK_SESSION_BOOKING");

            entity.HasIndex(e => e.SlotId, "FK_SESSION_SLOT");

            entity.HasIndex(e => e.StaffInId, "FK_SESSION_STAFF_IN");

            entity.HasIndex(e => e.StaffOutId, "FK_SESSION_STAFF_OUT");

            entity.HasIndex(e => e.VehicleTypeId, "FK_SESSION_TYPE");

            entity.HasIndex(e => e.VehicleId, "FK_SESSION_VEHICLE");

            entity.Property(e => e.SessionId)
                .HasMaxLength(20)
                .HasColumnName("SESSION_ID");
            entity.Property(e => e.BookingId).HasColumnName("BOOKING_ID");
            entity.Property(e => e.CameraIn)
                .HasMaxLength(50)
                .HasColumnName("CAMERA_IN");
            entity.Property(e => e.CameraOut)
                .HasMaxLength(50)
                .HasColumnName("CAMERA_OUT");
            entity.Property(e => e.CheckInTime)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("CHECK_IN_TIME");
            entity.Property(e => e.CheckOutTime)
                .HasColumnType("datetime")
                .HasColumnName("CHECK_OUT_TIME");
            entity.Property(e => e.DurationMinutes).HasColumnName("DURATION_MINUTES");
            entity.Property(e => e.GateIn)
                .HasMaxLength(50)
                .HasColumnName("GATE_IN");
            entity.Property(e => e.GateOut)
                .HasMaxLength(50)
                .HasColumnName("GATE_OUT");
            entity.Property(e => e.ImageUrlIn)
                .HasMaxLength(500)
                .HasColumnName("IMAGE_URL_IN");
            entity.Property(e => e.ImageUrlOut)
                .HasMaxLength(500)
                .HasColumnName("IMAGE_URL_OUT");
            entity.Property(e => e.LicensePlateIn)
                .HasMaxLength(50)
                .HasColumnName("LICENSE_PLATE_IN");
            entity.Property(e => e.LicensePlateOut)
                .HasMaxLength(50)
                .HasColumnName("LICENSE_PLATE_OUT");
            entity.Property(e => e.PaymentStatus)
                .HasDefaultValueSql("'PENDING'")
                .HasColumnType("enum('PENDING','PAID','FAILED')")
                .HasColumnName("PAYMENT_STATUS");
            entity.Property(e => e.SlotId)
                .HasMaxLength(20)
                .HasColumnName("SLOT_ID");
            entity.Property(e => e.StaffInId)
                .HasMaxLength(20)
                .HasColumnName("STAFF_IN_ID");
            entity.Property(e => e.StaffOutId)
                .HasMaxLength(20)
                .HasColumnName("STAFF_OUT_ID");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'ACTIVE'")
                .HasColumnType("enum('ACTIVE','COMPLETED','CANCELLED','LOST_TICKET')")
                .HasColumnName("STATUS");
            entity.Property(e => e.TotalFee)
                .HasPrecision(10, 2)
                .HasColumnName("TOTAL_FEE");
            entity.Property(e => e.VehicleId).HasColumnName("VEHICLE_ID");
            entity.Property(e => e.VehicleTypeId).HasColumnName("VEHICLE_TYPE_ID");

            entity.HasOne(d => d.Booking).WithMany(p => p.ParkingSessions)
                .HasForeignKey(d => d.BookingId)
                .HasConstraintName("FK_SESSION_BOOKING");

            entity.HasOne(d => d.Slot).WithMany(p => p.ParkingSessions)
                .HasForeignKey(d => d.SlotId)
                .HasConstraintName("FK_SESSION_SLOT");

            entity.HasOne(d => d.StaffIn).WithMany(p => p.ParkingSessionStaffIns)
                .HasForeignKey(d => d.StaffInId)
                .HasConstraintName("FK_SESSION_STAFF_IN");

            entity.HasOne(d => d.StaffOut).WithMany(p => p.ParkingSessionStaffOuts)
                .HasForeignKey(d => d.StaffOutId)
                .HasConstraintName("FK_SESSION_STAFF_OUT");

            entity.HasOne(d => d.Vehicle).WithMany(p => p.ParkingSessions)
                .HasForeignKey(d => d.VehicleId)
                .HasConstraintName("FK_SESSION_VEHICLE");

            entity.HasOne(d => d.VehicleType).WithMany(p => p.ParkingSessions)
                .HasForeignKey(d => d.VehicleTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SESSION_TYPE");
        });

        modelBuilder.Entity<ParkingSlot>(entity =>
        {
            entity.HasKey(e => e.SlotId).HasName("PRIMARY");

            entity.ToTable("parking_slot");

            entity.HasIndex(e => e.ZoneId, "FK_SLOT_ZONE");

            entity.Property(e => e.SlotId)
                .HasMaxLength(20)
                .HasColumnName("SLOT_ID");
            entity.Property(e => e.CurrentSessionId)
                .HasMaxLength(20)
                .HasColumnName("CURRENT_SESSION_ID");
            entity.Property(e => e.IsElectricCharging)
                .HasDefaultValueSql("'0'")
                .HasColumnName("IS_ELECTRIC_CHARGING");
            entity.Property(e => e.IsHandicap)
                .HasDefaultValueSql("'0'")
                .HasColumnName("IS_HANDICAP");
            entity.Property(e => e.LastUpdated)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("LAST_UPDATED");
            entity.Property(e => e.SlotName)
                .HasMaxLength(20)
                .HasColumnName("SLOT_NAME");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'AVAILABLE'")
                .HasColumnType("enum('AVAILABLE','OCCUPIED','RESERVED','MAINTENANCE')")
                .HasColumnName("STATUS");
            entity.Property(e => e.ZoneId).HasColumnName("ZONE_ID");

            entity.HasOne(d => d.Zone).WithMany(p => p.ParkingSlots)
                .HasForeignKey(d => d.ZoneId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SLOT_ZONE");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("PRIMARY");

            entity.ToTable("payment");

            entity.HasIndex(e => e.BookingId, "FK_PAY_BOOKING");

            entity.HasIndex(e => e.CardId, "FK_PAY_CARD");

            entity.HasIndex(e => e.SessionId, "FK_PAY_SESSION");

            entity.HasIndex(e => e.UserId, "FK_PAY_USER");

            entity.Property(e => e.PaymentId)
                .HasMaxLength(20)
                .HasColumnName("PAYMENT_ID");
            entity.Property(e => e.AmountDue)
                .HasPrecision(10, 2)
                .HasColumnName("AMOUNT_DUE");
            entity.Property(e => e.AmountPaid)
                .HasPrecision(10, 2)
                .HasColumnName("AMOUNT_PAID");
            entity.Property(e => e.BookingId).HasColumnName("BOOKING_ID");
            entity.Property(e => e.CardId).HasColumnName("CARD_ID");
            entity.Property(e => e.ChangeDue)
                .HasPrecision(10, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("CHANGE_DUE");
            entity.Property(e => e.PaymentMethod)
                .HasColumnType("enum('CASH','VNPAY','SUBSCRIPTION')")
                .HasColumnName("PAYMENT_METHOD");
            entity.Property(e => e.PaymentTime)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("PAYMENT_TIME");
            entity.Property(e => e.PaymentType)
                .HasColumnType("enum('SESSION','MONTHLY_PASS','BOOKING','INCIDENT')")
                .HasColumnName("PAYMENT_TYPE");
            entity.Property(e => e.ReceiptUrl)
                .HasMaxLength(500)
                .HasColumnName("RECEIPT_URL");
            entity.Property(e => e.Remarks)
                .HasMaxLength(255)
                .HasColumnName("REMARKS");
            entity.Property(e => e.SessionId)
                .HasMaxLength(20)
                .HasColumnName("SESSION_ID");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'SUCCESS'")
                .HasColumnType("enum('SUCCESS','FAILED')")
                .HasColumnName("STATUS");
            entity.Property(e => e.TransactionId)
                .HasMaxLength(100)
                .HasColumnName("TRANSACTION_ID");
            entity.Property(e => e.UserId)
                .HasMaxLength(20)
                .HasColumnName("USER_ID");

            entity.HasOne(d => d.Booking).WithMany(p => p.Payments)
                .HasForeignKey(d => d.BookingId)
                .HasConstraintName("FK_PAY_BOOKING");

            entity.HasOne(d => d.Card).WithMany(p => p.Payments)
                .HasForeignKey(d => d.CardId)
                .HasConstraintName("FK_PAY_CARD");

            entity.HasOne(d => d.Session).WithMany(p => p.Payments)
                .HasForeignKey(d => d.SessionId)
                .HasConstraintName("FK_PAY_SESSION");

            entity.HasOne(d => d.User).WithMany(p => p.Payments)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_PAY_USER");
        });

        modelBuilder.Entity<PricingPolicy>(entity =>
        {
            entity.HasKey(e => e.PolicyId).HasName("PRIMARY");

            entity.ToTable("pricing_policy");

            entity.HasIndex(e => e.VehicleTypeId, "FK_POLICY_TYPE");

            entity.Property(e => e.PolicyId).HasColumnName("POLICY_ID");
            entity.Property(e => e.BasePrice)
                .HasPrecision(10, 2)
                .HasColumnName("BASE_PRICE");
            entity.Property(e => e.EffectiveDate).HasColumnName("EFFECTIVE_DATE");
            entity.Property(e => e.HourlyRate)
                .HasPrecision(10, 2)
                .HasColumnName("HOURLY_RATE");
            entity.Property(e => e.OvernightFee)
                .HasPrecision(10, 2)
                .HasColumnName("OVERNIGHT_FEE");
            entity.Property(e => e.VehicleTypeId).HasColumnName("VEHICLE_TYPE_ID");

            entity.HasOne(d => d.VehicleType).WithMany(p => p.PricingPolicies)
                .HasForeignKey(d => d.VehicleTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_POLICY_TYPE");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PRIMARY");

            entity.ToTable("role");

            entity.HasIndex(e => e.RoleName, "ROLE_NAME").IsUnique();

            entity.Property(e => e.RoleId).HasColumnName("ROLE_ID");
            entity.Property(e => e.Description)
                .HasMaxLength(200)
                .HasColumnName("DESCRIPTION");
            entity.Property(e => e.RoleName)
                .HasMaxLength(50)
                .HasColumnName("ROLE_NAME");
        });

        modelBuilder.Entity<SubscriptionPlan>(entity =>
        {
            entity.HasKey(e => e.PlanId).HasName("PRIMARY");

            entity.ToTable("subscription_plan");

            entity.HasIndex(e => e.VehicleTypeId, "FK_PLAN_TYPE");

            entity.Property(e => e.PlanId)
                .HasMaxLength(50)
                .HasColumnName("PLAN_ID");
            entity.Property(e => e.DurationDays).HasColumnName("DURATION_DAYS");
            entity.Property(e => e.GracePeriodDays)
                .HasDefaultValueSql("'0'")
                .HasColumnName("GRACE_PERIOD_DAYS");
            entity.Property(e => e.Price)
                .HasPrecision(10, 2)
                .HasColumnName("PRICE");
            entity.Property(e => e.VehicleTypeId).HasColumnName("VEHICLE_TYPE_ID");

            entity.HasOne(d => d.VehicleType).WithMany(p => p.SubscriptionPlans)
                .HasForeignKey(d => d.VehicleTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PLAN_TYPE");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PRIMARY");

            entity.ToTable("users");

            entity.HasIndex(e => e.Email, "EMAIL").IsUnique();

            entity.HasIndex(e => e.RoleId, "FK_USER_ROLE");

            entity.HasIndex(e => e.Username, "USERNAME").IsUnique();

            entity.Property(e => e.UserId)
                .HasMaxLength(20)
                .HasColumnName("USER_ID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .HasColumnName("EMAIL");
            entity.Property(e => e.FullName)
                .HasMaxLength(100)
                .HasColumnName("FULL_NAME");
            entity.Property(e => e.LastLogin)
                .HasColumnType("datetime")
                .HasColumnName("LAST_LOGIN");
            entity.Property(e => e.Password)
                .HasMaxLength(255)
                .HasColumnName("PASSWORD");
            entity.Property(e => e.Phone)
                .HasMaxLength(15)
                .HasColumnName("PHONE");
            entity.Property(e => e.RoleId).HasColumnName("ROLE_ID");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'ACTIVE'")
                .HasColumnType("enum('ACTIVE','INACTIVE','BANNED')")
                .HasColumnName("STATUS");
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .HasColumnName("USERNAME");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleId)
                .HasConstraintName("FK_USER_ROLE");
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasKey(e => e.VehicleId).HasName("PRIMARY");

            entity.ToTable("vehicle");

            entity.HasIndex(e => e.VehicleUserId, "FK_VEHICLE_OWNER");

            entity.HasIndex(e => e.VehicleTypeId, "FK_VEHICLE_TYPE");

            entity.HasIndex(e => e.VehiclePlateNumber, "VEHICLE_PLATE_NUMBER").IsUnique();

            entity.Property(e => e.VehicleId).HasColumnName("VEHICLE_ID");
            entity.Property(e => e.Brand)
                .HasMaxLength(50)
                .HasColumnName("BRAND");
            entity.Property(e => e.Color)
                .HasMaxLength(30)
                .HasColumnName("COLOR");
            entity.Property(e => e.Model)
                .HasMaxLength(50)
                .HasColumnName("MODEL");
            entity.Property(e => e.VehicleDescription)
                .HasMaxLength(200)
                .HasColumnName("VEHICLE_DESCRIPTION");
            entity.Property(e => e.VehiclePlateNumber)
                .HasMaxLength(50)
                .HasColumnName("VEHICLE_PLATE_NUMBER");
            entity.Property(e => e.VehicleTypeId).HasColumnName("VEHICLE_TYPE_ID");
            entity.Property(e => e.VehicleUserId)
                .HasMaxLength(20)
                .HasColumnName("VEHICLE_USER_ID");

            entity.HasOne(d => d.VehicleType).WithMany(p => p.Vehicles)
                .HasForeignKey(d => d.VehicleTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VEHICLE_TYPE");

            entity.HasOne(d => d.VehicleUser).WithMany(p => p.Vehicles)
                .HasForeignKey(d => d.VehicleUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VEHICLE_OWNER");
        });

        modelBuilder.Entity<VehicleType>(entity =>
        {
            entity.HasKey(e => e.VehicleTypeId).HasName("PRIMARY");

            entity.ToTable("vehicle_type");

            entity.HasIndex(e => e.VehicleTypeName, "VEHICLE_TYPE_NAME").IsUnique();

            entity.Property(e => e.VehicleTypeId).HasColumnName("VEHICLE_TYPE_ID");
            entity.Property(e => e.VehicleTypeName)
                .HasMaxLength(100)
                .HasColumnName("VEHICLE_TYPE_NAME");
        });

        modelBuilder.Entity<SlotStatusLog>(entity =>
        {
            // Map với bảng tên viết hoa và có gạch dưới
            entity.ToTable("SLOT_STATUS_LOGS");

            // Chỉ định khóa chính
            entity.HasKey(e => e.LogId);

            // Map các thuộc tính của Class sang tên cột Snake Case
            entity.Property(e => e.LogId).HasColumnName("log_id").HasMaxLength(50);
            entity.Property(e => e.SlotId).HasColumnName("slot_id").HasMaxLength(50);
            entity.Property(e => e.OldStatus).HasColumnName("old_status").HasMaxLength(20);
            entity.Property(e => e.NewStatus).HasColumnName("new_status").HasMaxLength(20);
            entity.Property(e => e.ChangedByStaffId).HasColumnName("changed_by_staff_id").HasMaxLength(50);
            entity.Property(e => e.ChangedAt).HasColumnName("changed_at").HasColumnType("datetime");
            entity.Property(e => e.Reason).HasColumnName("reason").HasMaxLength(255);
            entity.Property(e => e.EstimatedDurationMinutes).HasColumnName("estimated_duration_minutes");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
