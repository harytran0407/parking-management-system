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

    public virtual DbSet<ParkingBuilding> ParkingBuildings { get; set; }

    public virtual DbSet<ParkingSession> ParkingSessions { get; set; }

    public virtual DbSet<ParkingSlot> ParkingSlots { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<PricingPolicy> PricingPolicies { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<RoleAuditLog> RoleAuditLogs { get; set; }

    public virtual DbSet<VehicleType> VehicleTypes { get; set; }

    public virtual DbSet<SlotStatusLog> SlotStatusLogs { get; set; }

    public virtual DbSet<SystemSetting> SystemSettings { get; set; }

    public virtual DbSet<SystemLog> SystemLogs { get; set; }

    public virtual DbSet<Feedback> Feedbacks { get; set; }

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

            entity.HasIndex(e => e.ZoneId, "FK_BOOKING_ZONE");

            entity.HasIndex(e => e.VehicleTypeId, "FK_BOOKING_VEHICLE_TYPE");

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
            entity.Property(e => e.ZoneId)
                .HasColumnName("ZONE_ID");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'PENDING'")
                .HasColumnType("enum('PENDING','CONFIRMED','CANCELLED','COMPLETED')")
                .HasColumnName("STATUS");
            entity.Property(e => e.LicensePlate)
                .HasMaxLength(50)
                .HasColumnName("LICENSE_PLATE")
                .IsRequired();
            entity.Property(e => e.VehicleTypeId).HasColumnName("VEHICLE_TYPE_ID");
            entity.Property(e => e.VehicleUserId)
                .HasMaxLength(36)
                .HasColumnName("VEHICLE_USER_ID");

            entity.HasOne(d => d.Zone).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.ZoneId)
                .HasConstraintName("FK_BOOKING_ZONE");

            entity.HasOne(d => d.VehicleType).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.VehicleTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BOOKING_VEHICLE_TYPE");

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
            entity.Property(e => e.AvailableCapacity)
                .HasColumnName("AVAILABLE_CAPACITY")
                .HasDefaultValue(0);
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
                .HasMaxLength(36)
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

            entity.HasIndex(e => e.ZoneId, "FK_SESSION_ZONE");

            entity.HasIndex(e => e.SlotId, "FK_SESSION_SLOT");

            entity.HasIndex(e => e.StaffInId, "FK_SESSION_STAFF_IN");

            entity.HasIndex(e => e.StaffOutId, "FK_SESSION_STAFF_OUT");

            entity.HasIndex(e => e.VehicleTypeId, "FK_SESSION_TYPE");

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
            entity.Property(e => e.ZoneId)
                .HasColumnName("ZONE_ID");
            entity.Property(e => e.SlotId)
                .HasMaxLength(20)
                .HasColumnName("SLOT_ID");
            entity.Property(e => e.StaffInId)
                .HasMaxLength(36)
                .HasColumnName("STAFF_IN_ID");
            entity.Property(e => e.StaffOutId)
                .HasMaxLength(36)
                .HasColumnName("STAFF_OUT_ID");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'ACTIVE'")
                .HasColumnType("enum('ACTIVE','COMPLETED','CANCELLED','LOST_TICKET')")
                .HasColumnName("STATUS");
            entity.Property(e => e.TotalFee)
                .HasPrecision(10, 2)
                .HasColumnName("TOTAL_FEE");
            entity.Property(e => e.VehicleTypeId).HasColumnName("VEHICLE_TYPE_ID");
            entity.Property(e => e.TicketCode)
                .HasMaxLength(20)
                .HasColumnName("TICKET_CODE");

            entity.Property(e => e.IsLocked)
                .HasColumnName("IS_LOCKED")
                .HasColumnType("tinyint(1)");

            entity.HasOne(d => d.Booking).WithMany(p => p.ParkingSessions)
                .HasForeignKey(d => d.BookingId)
                .HasConstraintName("FK_SESSION_BOOKING");

            entity.HasOne(d => d.Zone).WithMany(p => p.ParkingSessions)
                .HasForeignKey(d => d.ZoneId)
                .HasConstraintName("FK_SESSION_ZONE");

            entity.HasOne(d => d.Slot).WithMany(p => p.ParkingSessions)
                .HasForeignKey(d => d.SlotId)
                .HasConstraintName("FK_SESSION_SLOT");

            entity.HasOne(d => d.StaffIn).WithMany(p => p.ParkingSessionStaffIns)
                .HasForeignKey(d => d.StaffInId)
                .HasConstraintName("FK_SESSION_STAFF_IN");

            entity.HasOne(d => d.StaffOut).WithMany(p => p.ParkingSessionStaffOuts)
                .HasForeignKey(d => d.StaffOutId)
                .HasConstraintName("FK_SESSION_STAFF_OUT");

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
            entity.Property(e => e.ChangeDue)
                .HasPrecision(10, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("CHANGE_DUE");
            entity.Property(e => e.PaymentMethod)
                .HasColumnType("enum('CASH','VNPAY','SUBSCRIPTION','PAYOS')")
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
                .HasColumnType("enum('SUCCESS','FAILED','PENDING')")
                .HasColumnName("STATUS");
            entity.Property(e => e.TransactionId)
                .HasMaxLength(100)
                .HasColumnName("TRANSACTION_ID");
            entity.Property(e => e.UserId)
                .HasMaxLength(36)
                .HasColumnName("USER_ID");

            entity.HasOne(d => d.Booking).WithMany(p => p.Payments)
                .HasForeignKey(d => d.BookingId)
                .HasConstraintName("FK_PAY_BOOKING");

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
            entity.Property(e => e.BaseHours).HasColumnName("BASE_HOURS");
            entity.Property(e => e.SubsequentRate)
                .HasPrecision(10, 2)
                .HasColumnName("SUBSEQUENT_RATE");
            entity.Property(e => e.SubsequentHours).HasColumnName("SUBSEQUENT_HOURS");
            entity.Property(e => e.DailyMaxPrice)
                .HasPrecision(10, 2)
                .HasColumnName("DAILY_MAX_PRICE");
            entity.Property(e => e.VehicleTypeId).HasColumnName("VEHICLE_TYPE_ID");

            entity.Property(e => e.HandlingFee)
                .HasPrecision(10, 2)
                .HasColumnName("HANDLING_FEE");

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


        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PRIMARY");

            entity.ToTable("users");

            entity.HasIndex(e => e.Email, "EMAIL").IsUnique();

            entity.HasIndex(e => e.RoleId, "FK_USER_ROLE");

            entity.HasIndex(e => e.Username, "USERNAME").IsUnique();

            entity.Property(e => e.UserId)
                .HasMaxLength(36)
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
            entity.Property(e => e.AvatarUrl)
                .HasColumnName("AvatarUrl")
                .HasColumnType("LONGTEXT");
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
            entity.ToTable("SLOT_STATUS_LOGS");
            entity.HasKey(e => e.LogId);
            entity.Property(e => e.LogId).HasColumnName("log_id").HasMaxLength(50);
            entity.Property(e => e.SlotId).HasColumnName("slot_id").HasMaxLength(50);
            entity.Property(e => e.OldStatus).HasColumnName("old_status").HasMaxLength(20);
            entity.Property(e => e.NewStatus).HasColumnName("new_status").HasMaxLength(20);
            entity.Property(e => e.ChangedBy).HasColumnName("changed_by").HasMaxLength(50);
            entity.Property(e => e.ChangedAt).HasColumnName("changed_at").HasColumnType("datetime");
            entity.Property(e => e.Reason).HasColumnName("reason").HasMaxLength(255);
            entity.Property(e => e.EstimatedDurationMinutes).HasColumnName("estimated_duration_minutes");
        });

        modelBuilder.Entity<RoleAuditLog>(entity =>
        {
            entity.ToTable("ROLE_AUDIT_LOG");
            entity.HasKey(e => e.RoleLogId);
            entity.Property(e => e.RoleLogId).HasColumnName("ROLE_LOG_ID");
            entity.Property(e => e.AdminId)
                .HasColumnName("ADMIN_ID")
                .HasMaxLength(36);

            entity.Property(e => e.TargetUserId)
                .HasColumnName("TARGET_USER_ID")
                .HasMaxLength(36);

            entity.Property(e => e.OldRoleId)
                .HasColumnName("OLD_ROLE_ID");

            entity.Property(e => e.NewRoleId)
                .HasColumnName("NEW_ROLE_ID");

            entity.Property(e => e.ChangedAt)
                .HasColumnName("CHANGED_AT")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.Admin)
                .WithMany()
                .HasForeignKey(d => d.AdminId)
                .HasConstraintName("FK_AUDIT_ADMIN");

            entity.HasOne(d => d.TargetUser)
                .WithMany()
                .HasForeignKey(d => d.TargetUserId)
                .HasConstraintName("FK_AUDIT_TARGET");
        });

        modelBuilder.Entity<SystemSetting>(entity =>
        {
            entity.ToTable("SYSTEM_SETTING");
            entity.HasKey(e => e.SettingId);

            entity.Property(e => e.SettingId).HasColumnName("SETTING_ID");

            entity.Property(e => e.SettingKey)
                .HasColumnName("SETTING_KEY")
                .IsRequired()
                .HasMaxLength(100);

            entity.HasIndex(e => e.SettingKey).IsUnique();

            entity.Property(e => e.SettingValue)
                .HasColumnName("SETTING_VALUE")
                .IsRequired();
            entity.Property(e => e.Description)
                .HasColumnName("DESCRIPTION")
                .HasMaxLength(255);

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("UPDATE_AT")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<SystemLog>(entity =>
        {
            entity.ToTable("SYSTEM_LOGS");
            entity.HasKey(e => e.LogId);
            entity.Property(e => e.LogId).HasColumnName("LOG_ID");
            entity.Property(e => e.LogLevel)
                .HasColumnName("LOG_LEVEL")
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Message)
                .HasColumnName("MESSAGE")
                .IsRequired();

            entity.Property(e => e.Source)
                .HasColumnName("SOURCE")
                .HasMaxLength(150);

            entity.Property(e => e.CreatedAt)
                .HasColumnName("CREATE_AT")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<Feedback>(entity =>
        {
            entity.ToTable("FEEDBACK");
            entity.HasKey(e => e.FeedbackId);

            entity.Property(e => e.FeedbackId)
                .HasColumnName("FEEDBACK_ID");

            entity.Property(e => e.UserId)
                .HasColumnName("USER_ID")
                .HasMaxLength(36);

            entity.Property(e => e.FullName)
                .HasColumnName("FULL_NAME")
                .IsRequired()
                .HasMaxLength(100);

            

            entity.Property(e => e.Title)
                .HasColumnName("TITLE")
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Content)
                .HasColumnName("CONTENT")
                .HasColumnType("text")
                .IsRequired();

            entity.Property(e => e.Status)
                .HasColumnName("STATUS")
                .HasDefaultValueSql("'OPEN'");

            entity.Property(e => e.CreatedAt)
                .HasColumnName("CREATED_AT")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.ResolvedAt)
                .HasColumnName("RESOLVED_AT")
                .HasColumnType("datetime");

            entity.Property(e => e.ResolvedBy)
                .HasColumnName("RESOLVED_BY")
                .HasMaxLength(36);

            entity.Property(e => e.ResponseNote)
                .HasColumnName("RESPONSE_NOTE")
                .HasColumnType("text");

            entity.Property(e => e.StarRating)
                .HasColumnName("STAR_RATING");

            entity.Property(e => e.CustomerPhone)
                .HasColumnName("CUSTOMER_PHONE")
                .HasMaxLength(20);

            entity.Property(e => e.CustomerEmail)
                .HasColumnName("CUSTOMER_EMAIL")
                .HasMaxLength(100);
        });

        var dateTimeConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
            v => v,
            v => DateTime.SpecifyKind(v, DateTimeKind.Unspecified)
        );

        var nullableDateTimeConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime?, DateTime?>(
            v => v,
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Unspecified) : null
        );

        // 2. Quét qua toàn bộ Database Schema được khai báo trong DbContext
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                // Nếu thuộc tính đó là DateTime (Bắt buộc)
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(dateTimeConverter);
                }
                // Nếu thuộc tính đó là DateTime? (Cho phép Null)
                else if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(nullableDateTimeConverter);
                }
            }
        }

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
