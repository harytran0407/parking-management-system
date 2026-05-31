using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParkingManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddAvatarUrlToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "parking_building",
                columns: table => new
                {
                    BUILDING_ID = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BUILDING_NAME = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ADDRESS = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TOTAL_FLOORS = table.Column<int>(type: "int", nullable: false),
                    TOTAL_SLOTS = table.Column<int>(type: "int", nullable: false),
                    WEEKDAY_HOURS = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    WEEKEND_HOURS = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IS_24_7 = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    STATUS = table.Column<string>(type: "enum('ACTIVE','MAINTENANCE','CLOSED')", nullable: true, defaultValueSql: "'ACTIVE'", collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.BUILDING_ID);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "role",
                columns: table => new
                {
                    ROLE_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ROLE_NAME = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DESCRIPTION = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ROLE_ID);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "SLOT_STATUS_LOGS",
                columns: table => new
                {
                    log_id = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    slot_id = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    old_status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    new_status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    changed_by = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    changed_at = table.Column<DateTime>(type: "datetime", nullable: false),
                    reason = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    estimated_duration_minutes = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SLOT_STATUS_LOGS", x => x.log_id);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "vehicle_type",
                columns: table => new
                {
                    VEHICLE_TYPE_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    VEHICLE_TYPE_NAME = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.VEHICLE_TYPE_ID);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    USER_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    USERNAME = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PASSWORD = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FULL_NAME = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EMAIL = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PHONE = table.Column<string>(type: "varchar(15)", maxLength: 15, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ROLE_ID = table.Column<int>(type: "int", nullable: true),
                    STATUS = table.Column<string>(type: "enum('ACTIVE','INACTIVE','BANNED')", nullable: true, defaultValueSql: "'ACTIVE'", collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LAST_LOGIN = table.Column<DateTime>(type: "datetime", nullable: true),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    AvatarUrl = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.USER_ID);
                    table.ForeignKey(
                        name: "FK_USER_ROLE",
                        column: x => x.ROLE_ID,
                        principalTable: "role",
                        principalColumn: "ROLE_ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "floor_zone",
                columns: table => new
                {
                    ZONE_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ZONE_NAME = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FLOOR_NUMBER = table.Column<int>(type: "int", nullable: false),
                    CAPACITY = table.Column<int>(type: "int", nullable: false),
                    STATUS = table.Column<string>(type: "enum('ACTIVE','MAINTENANCE')", nullable: true, defaultValueSql: "'ACTIVE'", collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VEHICLE_TYPE_ID = table.Column<int>(type: "int", nullable: false),
                    BUILDING_ID = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ZONE_ID);
                    table.ForeignKey(
                        name: "FK_ZONE_BUILDING",
                        column: x => x.BUILDING_ID,
                        principalTable: "parking_building",
                        principalColumn: "BUILDING_ID");
                    table.ForeignKey(
                        name: "FK_ZONE_TYPE",
                        column: x => x.VEHICLE_TYPE_ID,
                        principalTable: "vehicle_type",
                        principalColumn: "VEHICLE_TYPE_ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "pricing_policy",
                columns: table => new
                {
                    POLICY_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    BASE_PRICE = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    HOURLY_RATE = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    OVERNIGHT_FEE = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    EFFECTIVE_DATE = table.Column<DateOnly>(type: "date", nullable: false),
                    VEHICLE_TYPE_ID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.POLICY_ID);
                    table.ForeignKey(
                        name: "FK_POLICY_TYPE",
                        column: x => x.VEHICLE_TYPE_ID,
                        principalTable: "vehicle_type",
                        principalColumn: "VEHICLE_TYPE_ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "subscription_plan",
                columns: table => new
                {
                    PLAN_ID = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VEHICLE_TYPE_ID = table.Column<int>(type: "int", nullable: false),
                    DURATION_DAYS = table.Column<int>(type: "int", nullable: false),
                    PRICE = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    GRACE_PERIOD_DAYS = table.Column<int>(type: "int", nullable: true, defaultValueSql: "'0'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.PLAN_ID);
                    table.ForeignKey(
                        name: "FK_PLAN_TYPE",
                        column: x => x.VEHICLE_TYPE_ID,
                        principalTable: "vehicle_type",
                        principalColumn: "VEHICLE_TYPE_ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "vehicle",
                columns: table => new
                {
                    VEHICLE_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    VEHICLE_PLATE_NUMBER = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VEHICLE_DESCRIPTION = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BRAND = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MODEL = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    COLOR = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VEHICLE_TYPE_ID = table.Column<int>(type: "int", nullable: false),
                    VEHICLE_USER_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.VEHICLE_ID);
                    table.ForeignKey(
                        name: "FK_VEHICLE_OWNER",
                        column: x => x.VEHICLE_USER_ID,
                        principalTable: "users",
                        principalColumn: "USER_ID");
                    table.ForeignKey(
                        name: "FK_VEHICLE_TYPE",
                        column: x => x.VEHICLE_TYPE_ID,
                        principalTable: "vehicle_type",
                        principalColumn: "VEHICLE_TYPE_ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "parking_slot",
                columns: table => new
                {
                    SLOT_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SLOT_NAME = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    STATUS = table.Column<string>(type: "enum('AVAILABLE','OCCUPIED','RESERVED','MAINTENANCE')", nullable: true, defaultValueSql: "'AVAILABLE'", collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IS_HANDICAP = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    IS_ELECTRIC_CHARGING = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    CURRENT_SESSION_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LAST_UPDATED = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ZONE_ID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.SLOT_ID);
                    table.ForeignKey(
                        name: "FK_SLOT_ZONE",
                        column: x => x.ZONE_ID,
                        principalTable: "floor_zone",
                        principalColumn: "ZONE_ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "monthly_pass",
                columns: table => new
                {
                    MONTHLY_PASS_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    VEHICLE_ID = table.Column<int>(type: "int", nullable: false),
                    PLAN_ID = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    START_DATE = table.Column<DateOnly>(type: "date", nullable: false),
                    END_DATE = table.Column<DateOnly>(type: "date", nullable: false),
                    STATUS = table.Column<string>(type: "enum('ACTIVE','EXPIRED')", nullable: true, defaultValueSql: "'ACTIVE'", collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PAYMENT_STATUS = table.Column<string>(type: "enum('PENDING','PAID')", nullable: true, defaultValueSql: "'PENDING'", collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CREATED_AT = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.MONTHLY_PASS_ID);
                    table.ForeignKey(
                        name: "FK_MONTHLYPASS_PLAN",
                        column: x => x.PLAN_ID,
                        principalTable: "subscription_plan",
                        principalColumn: "PLAN_ID");
                    table.ForeignKey(
                        name: "FK_MONTHLYPASS_VEHICLE",
                        column: x => x.VEHICLE_ID,
                        principalTable: "vehicle",
                        principalColumn: "VEHICLE_ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "booking",
                columns: table => new
                {
                    BOOKING_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    VEHICLE_USER_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VEHICLE_ID = table.Column<int>(type: "int", nullable: true),
                    SLOT_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EXPECTED_ARRIVAL = table.Column<DateTime>(type: "datetime", nullable: false),
                    EXPIRED_AT = table.Column<DateTime>(type: "datetime", nullable: true),
                    BOOKING_TIME = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    STATUS = table.Column<string>(type: "enum('PENDING','CONFIRMED','CANCELLED','COMPLETED')", nullable: true, defaultValueSql: "'PENDING'", collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NOTES = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.BOOKING_ID);
                    table.ForeignKey(
                        name: "FK_BOOKING_OWNER",
                        column: x => x.VEHICLE_USER_ID,
                        principalTable: "users",
                        principalColumn: "USER_ID");
                    table.ForeignKey(
                        name: "FK_BOOKING_SLOT",
                        column: x => x.SLOT_ID,
                        principalTable: "parking_slot",
                        principalColumn: "SLOT_ID");
                    table.ForeignKey(
                        name: "FK_BOOKING_VEHICLE",
                        column: x => x.VEHICLE_ID,
                        principalTable: "vehicle",
                        principalColumn: "VEHICLE_ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "parking_session",
                columns: table => new
                {
                    SESSION_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CHECK_IN_TIME = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CHECK_OUT_TIME = table.Column<DateTime>(type: "datetime", nullable: true),
                    DURATION_MINUTES = table.Column<int>(type: "int", nullable: true),
                    LICENSE_PLATE_IN = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IMAGE_URL_IN = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CAMERA_IN = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    GATE_IN = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    STAFF_IN_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LICENSE_PLATE_OUT = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IMAGE_URL_OUT = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    GATE_OUT = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CAMERA_OUT = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    STAFF_OUT_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TOTAL_FEE = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    STATUS = table.Column<string>(type: "enum('ACTIVE','COMPLETED','CANCELLED','LOST_TICKET')", nullable: true, defaultValueSql: "'ACTIVE'", collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PAYMENT_STATUS = table.Column<string>(type: "enum('PENDING','PAID','FAILED')", nullable: true, defaultValueSql: "'PENDING'", collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VEHICLE_TYPE_ID = table.Column<int>(type: "int", nullable: false),
                    SLOT_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VEHICLE_ID = table.Column<int>(type: "int", nullable: true),
                    BOOKING_ID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.SESSION_ID);
                    table.ForeignKey(
                        name: "FK_SESSION_BOOKING",
                        column: x => x.BOOKING_ID,
                        principalTable: "booking",
                        principalColumn: "BOOKING_ID");
                    table.ForeignKey(
                        name: "FK_SESSION_SLOT",
                        column: x => x.SLOT_ID,
                        principalTable: "parking_slot",
                        principalColumn: "SLOT_ID");
                    table.ForeignKey(
                        name: "FK_SESSION_STAFF_IN",
                        column: x => x.STAFF_IN_ID,
                        principalTable: "users",
                        principalColumn: "USER_ID");
                    table.ForeignKey(
                        name: "FK_SESSION_STAFF_OUT",
                        column: x => x.STAFF_OUT_ID,
                        principalTable: "users",
                        principalColumn: "USER_ID");
                    table.ForeignKey(
                        name: "FK_SESSION_TYPE",
                        column: x => x.VEHICLE_TYPE_ID,
                        principalTable: "vehicle_type",
                        principalColumn: "VEHICLE_TYPE_ID");
                    table.ForeignKey(
                        name: "FK_SESSION_VEHICLE",
                        column: x => x.VEHICLE_ID,
                        principalTable: "vehicle",
                        principalColumn: "VEHICLE_ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "payment",
                columns: table => new
                {
                    PAYMENT_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PAYMENT_TYPE = table.Column<string>(type: "enum('SESSION','MONTHLY_PASS','BOOKING','INCIDENT')", nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AMOUNT_DUE = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    AMOUNT_PAID = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    CHANGE_DUE = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true, defaultValueSql: "'0.00'"),
                    PAYMENT_METHOD = table.Column<string>(type: "enum('CASH','VNPAY','SUBSCRIPTION')", nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PAYMENT_TIME = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    STATUS = table.Column<string>(type: "enum('SUCCESS','FAILED')", nullable: true, defaultValueSql: "'SUCCESS'", collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TRANSACTION_ID = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RECEIPT_URL = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    REMARKS = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SESSION_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CARD_ID = table.Column<int>(type: "int", nullable: true),
                    BOOKING_ID = table.Column<int>(type: "int", nullable: true),
                    USER_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.PAYMENT_ID);
                    table.ForeignKey(
                        name: "FK_PAY_BOOKING",
                        column: x => x.BOOKING_ID,
                        principalTable: "booking",
                        principalColumn: "BOOKING_ID");
                    table.ForeignKey(
                        name: "FK_PAY_CARD",
                        column: x => x.CARD_ID,
                        principalTable: "monthly_pass",
                        principalColumn: "MONTHLY_PASS_ID");
                    table.ForeignKey(
                        name: "FK_PAY_SESSION",
                        column: x => x.SESSION_ID,
                        principalTable: "parking_session",
                        principalColumn: "SESSION_ID");
                    table.ForeignKey(
                        name: "FK_PAY_USER",
                        column: x => x.USER_ID,
                        principalTable: "users",
                        principalColumn: "USER_ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "incident_log",
                columns: table => new
                {
                    LOG_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SESSION_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    REPORTED_BY = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ISSUE_TYPE = table.Column<string>(type: "enum('LOST_TICKET','WRONG_SLOT','SYSTEM_ERROR','OTHER')", nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DESCRIPTION = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    REPORT_TIME = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    STATUS = table.Column<string>(type: "enum('OPEN','RESOLVED')", nullable: true, defaultValueSql: "'OPEN'", collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CUSTOMER_PHONE = table.Column<string>(type: "varchar(15)", maxLength: 15, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CUSTOMER_EMAIL = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PAYMENT_ID = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RESOLVED_BY = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RESOLVED_AT = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.LOG_ID);
                    table.ForeignKey(
                        name: "FK_INCIDENT_PAYMENT",
                        column: x => x.PAYMENT_ID,
                        principalTable: "payment",
                        principalColumn: "PAYMENT_ID");
                    table.ForeignKey(
                        name: "FK_INCIDENT_SESSION",
                        column: x => x.SESSION_ID,
                        principalTable: "parking_session",
                        principalColumn: "SESSION_ID");
                    table.ForeignKey(
                        name: "FK_INCIDENT_STAFF",
                        column: x => x.RESOLVED_BY,
                        principalTable: "users",
                        principalColumn: "USER_ID");
                    table.ForeignKey(
                        name: "FK_INCIDENT_USER",
                        column: x => x.REPORTED_BY,
                        principalTable: "users",
                        principalColumn: "USER_ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateIndex(
                name: "FK_BOOKING_OWNER",
                table: "booking",
                column: "VEHICLE_USER_ID");

            migrationBuilder.CreateIndex(
                name: "FK_BOOKING_SLOT",
                table: "booking",
                column: "SLOT_ID");

            migrationBuilder.CreateIndex(
                name: "FK_BOOKING_VEHICLE",
                table: "booking",
                column: "VEHICLE_ID");

            migrationBuilder.CreateIndex(
                name: "FK_ZONE_BUILDING",
                table: "floor_zone",
                column: "BUILDING_ID");

            migrationBuilder.CreateIndex(
                name: "FK_ZONE_TYPE",
                table: "floor_zone",
                column: "VEHICLE_TYPE_ID");

            migrationBuilder.CreateIndex(
                name: "FK_INCIDENT_PAYMENT",
                table: "incident_log",
                column: "PAYMENT_ID");

            migrationBuilder.CreateIndex(
                name: "FK_INCIDENT_SESSION",
                table: "incident_log",
                column: "SESSION_ID");

            migrationBuilder.CreateIndex(
                name: "FK_INCIDENT_STAFF",
                table: "incident_log",
                column: "RESOLVED_BY");

            migrationBuilder.CreateIndex(
                name: "FK_INCIDENT_USER",
                table: "incident_log",
                column: "REPORTED_BY");

            migrationBuilder.CreateIndex(
                name: "FK_MONTHLYPASS_PLAN",
                table: "monthly_pass",
                column: "PLAN_ID");

            migrationBuilder.CreateIndex(
                name: "FK_MONTHLYPASS_VEHICLE",
                table: "monthly_pass",
                column: "VEHICLE_ID");

            migrationBuilder.CreateIndex(
                name: "FK_SESSION_BOOKING",
                table: "parking_session",
                column: "BOOKING_ID");

            migrationBuilder.CreateIndex(
                name: "FK_SESSION_SLOT",
                table: "parking_session",
                column: "SLOT_ID");

            migrationBuilder.CreateIndex(
                name: "FK_SESSION_STAFF_IN",
                table: "parking_session",
                column: "STAFF_IN_ID");

            migrationBuilder.CreateIndex(
                name: "FK_SESSION_STAFF_OUT",
                table: "parking_session",
                column: "STAFF_OUT_ID");

            migrationBuilder.CreateIndex(
                name: "FK_SESSION_TYPE",
                table: "parking_session",
                column: "VEHICLE_TYPE_ID");

            migrationBuilder.CreateIndex(
                name: "FK_SESSION_VEHICLE",
                table: "parking_session",
                column: "VEHICLE_ID");

            migrationBuilder.CreateIndex(
                name: "FK_SLOT_ZONE",
                table: "parking_slot",
                column: "ZONE_ID");

            migrationBuilder.CreateIndex(
                name: "FK_PAY_BOOKING",
                table: "payment",
                column: "BOOKING_ID");

            migrationBuilder.CreateIndex(
                name: "FK_PAY_CARD",
                table: "payment",
                column: "CARD_ID");

            migrationBuilder.CreateIndex(
                name: "FK_PAY_SESSION",
                table: "payment",
                column: "SESSION_ID");

            migrationBuilder.CreateIndex(
                name: "FK_PAY_USER",
                table: "payment",
                column: "USER_ID");

            migrationBuilder.CreateIndex(
                name: "FK_POLICY_TYPE",
                table: "pricing_policy",
                column: "VEHICLE_TYPE_ID");

            migrationBuilder.CreateIndex(
                name: "ROLE_NAME",
                table: "role",
                column: "ROLE_NAME",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "FK_PLAN_TYPE",
                table: "subscription_plan",
                column: "VEHICLE_TYPE_ID");

            migrationBuilder.CreateIndex(
                name: "EMAIL",
                table: "users",
                column: "EMAIL",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "FK_USER_ROLE",
                table: "users",
                column: "ROLE_ID");

            migrationBuilder.CreateIndex(
                name: "USERNAME",
                table: "users",
                column: "USERNAME",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "FK_VEHICLE_OWNER",
                table: "vehicle",
                column: "VEHICLE_USER_ID");

            migrationBuilder.CreateIndex(
                name: "FK_VEHICLE_TYPE",
                table: "vehicle",
                column: "VEHICLE_TYPE_ID");

            migrationBuilder.CreateIndex(
                name: "VEHICLE_PLATE_NUMBER",
                table: "vehicle",
                column: "VEHICLE_PLATE_NUMBER",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "VEHICLE_TYPE_NAME",
                table: "vehicle_type",
                column: "VEHICLE_TYPE_NAME",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "incident_log");

            migrationBuilder.DropTable(
                name: "pricing_policy");

            migrationBuilder.DropTable(
                name: "SLOT_STATUS_LOGS");

            migrationBuilder.DropTable(
                name: "payment");

            migrationBuilder.DropTable(
                name: "monthly_pass");

            migrationBuilder.DropTable(
                name: "parking_session");

            migrationBuilder.DropTable(
                name: "subscription_plan");

            migrationBuilder.DropTable(
                name: "booking");

            migrationBuilder.DropTable(
                name: "parking_slot");

            migrationBuilder.DropTable(
                name: "vehicle");

            migrationBuilder.DropTable(
                name: "floor_zone");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "parking_building");

            migrationBuilder.DropTable(
                name: "vehicle_type");

            migrationBuilder.DropTable(
                name: "role");
        }
    }
}
