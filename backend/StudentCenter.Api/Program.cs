using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StudentCenter.Api.Middleware;
using StudentCenter.Application.Interfaces;
using StudentCenter.Application.Services;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Data.Seeders;
using StudentCenter.Infrastructure.Services;

// Load local .env environment variables if present
var possibleEnvPaths = new[]
{
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "..", ".env")
};
foreach (var envPath in possibleEnvPaths)
{
    if (File.Exists(envPath))
    {
        foreach (var line in File.ReadAllLines(envPath))
        {
            var trimmed = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("#")) continue;
            var parts = trimmed.Split('=', 2);
            if (parts.Length == 2)
            {
                var key = parts[0].Trim();
                var val = parts[1].Trim().Trim('"').Trim('\'');
                if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                {
                    Environment.SetEnvironmentVariable(key, val);
                }
            }
        }
    }
}

var builder = WebApplication.CreateBuilder(args);

var rawConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? string.Empty;

var connectionString = ParseConnectionString(rawConnectionString);

var port = Environment.GetEnvironmentVariable("PORT") ?? "5051";
builder.WebHost.UseUrls($"http://*:{port}");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IFileStorageService, SupabaseStorageService>();
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
builder.Services.AddScoped<IAnnouncementService, AnnouncementService>();
builder.Services.AddScoped<IAnnouncementCommentService, AnnouncementCommentService>();
builder.Services.AddScoped<IAnnouncementReactionService, AnnouncementReactionService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IFacilityService, FacilityService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IMaterialService, MaterialService>();
builder.Services.AddScoped<IAssignmentService, AssignmentService>();
builder.Services.AddScoped<ISubmissionService, SubmissionService>();
builder.Services.AddScoped<ICalendarService, CalendarService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IProposalService, ProposalService>();
builder.Services.AddScoped<IExtracurricularService, ExtracurricularService>();
builder.Services.AddScoped<ISearchService, SearchService>();
builder.Services.AddScoped<IAttendanceService, AttendanceService>();
builder.Services.AddScoped<IMembershipService, MembershipService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<ISchoolClassService, SchoolClassService>();
builder.Services.AddScoped<IAcademicYearService, AcademicYearService>();
builder.Services.AddScoped<ISemesterService, SemesterService>();
builder.Services.AddScoped<IUserImportService, UserImportService>();

// Phase 16 Services
builder.Services.AddScoped<ISubjectService, SubjectService>();
builder.Services.AddScoped<ITeacherSubjectService, TeacherSubjectService>();
builder.Services.AddScoped<IClassSubjectService, ClassSubjectService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<IAcademicEventService, AcademicEventService>();

// Phase 17 Services
builder.Services.AddScoped<ILessonMaterialService, LessonMaterialService>();
builder.Services.AddScoped<IDashboardAggregationService, DashboardAggregationService>();

// Phase 18 Services
builder.Services.AddScoped<IGradeCalculationService, GradeCalculationService>();
builder.Services.AddScoped<IAssessmentService, AssessmentService>();
builder.Services.AddScoped<IStudentGradeService, StudentGradeService>();
builder.Services.AddScoped<IReportCardService, ReportCardService>();

// Phase 19 Services
builder.Services.AddScoped<ICommunicationAuthorizationService, CommunicationAuthorizationService>();
builder.Services.AddScoped<IDiscussionService, DiscussionService>();
builder.Services.AddScoped<IMessageService, MessageService>();

// Phase 22 Services
builder.Services.AddScoped<IElectionService, ElectionService>();

// Phase 6 Pemilos Pair & OSIS Recruitment Services
builder.Services.AddScoped<ICandidatePairService, CandidatePairService>();
builder.Services.AddScoped<IOsisRecruitmentService, OsisRecruitmentService>();

// PPLG Center Domain Foundation Services (Phase 4B)
builder.Services.AddScoped<IStudentProfileService, StudentProfileService>();
builder.Services.AddScoped<IClassLeadershipService, ClassLeadershipService>();
builder.Services.AddScoped<IClassDivisionService, ClassDivisionService>();
builder.Services.AddScoped<IScheduleRotationService, ScheduleRotationService>();
builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<ICommunityGroupService, CommunityGroupService>();
builder.Services.AddScoped<IGroupMessageService, GroupMessageService>();
builder.Services.AddScoped<IUserPermissionService, UserPermissionService>();

var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKeyFile = Environment.GetEnvironmentVariable("JWT_SECRET__FILE");
var secretKey = !string.IsNullOrWhiteSpace(secretKeyFile) && System.IO.File.Exists(secretKeyFile)
    ? System.IO.File.ReadAllText(secretKeyFile).Trim()
    : Environment.GetEnvironmentVariable("JWT_SECRET")
      ?? jwtSettings["SecretKey"]
      ?? throw new InvalidOperationException("JWT_SECRET is required but not configured.");

var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
    ?? jwtSettings["Issuer"]
    ?? "PPLGCenter";

var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
    ?? jwtSettings["Audience"]
    ?? "PPLGCenterApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

builder.Services.AddAuthorization();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });

    options.AddPolicy("ProductionPolicy", policy =>
    {
        var rawOrigins = builder.Configuration["CORS__AllowedOrigins"]
            ?? builder.Configuration["CORS_ALLOWED_ORIGINS"]
            ?? builder.Configuration["AllowedOrigins:Production"]
            ?? Environment.GetEnvironmentVariable("CORS__AllowedOrigins")
            ?? Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")
            ?? "https://pplgcenter.vercel.app";

        var allowedOrigins = rawOrigins
            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(o => o.TrimEnd('/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrWhiteSpace(origin)) return false;
            var normalizedOrigin = origin.TrimEnd('/');
            return allowedOrigins.Contains(normalizedOrigin, StringComparer.OrdinalIgnoreCase);
        })
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddSwaggerGen();

builder.Services.AddHealthChecks();

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

var app = builder.Build();

app.UseForwardedHeaders();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = services.GetRequiredService<AppDbContext>();
        logger.LogInformation("Checking and executing pending database migrations...");
        await dbContext.Database.MigrateAsync();
        logger.LogInformation("Database migrations applied successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while executing database migrations at startup.");
    }
}

app.UseResponseCompression();

var corsPolicy = app.Environment.IsDevelopment() ? "DevelopmentPolicy" : "ProductionPolicy";
app.UseCors(corsPolicy);

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    await next();
});

var uploadsDirEnv = builder.Configuration["UPLOAD_PATH"] ?? Environment.GetEnvironmentVariable("UPLOAD_PATH");
var uploadsPhysicalPath = !string.IsNullOrWhiteSpace(uploadsDirEnv)
    ? (Path.IsPathRooted(uploadsDirEnv) ? uploadsDirEnv : Path.Combine(app.Environment.ContentRootPath, uploadsDirEnv))
    : Path.Combine(app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot"), "uploads");

if (!Directory.Exists(uploadsPhysicalPath))
{
    Directory.CreateDirectory(uploadsPhysicalPath);
}

app.UseStaticFiles();

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPhysicalPath),
    RequestPath = "/uploads"
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Student Center API v1.0");
        options.RoutePrefix = string.Empty;
    });
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

await SeedAdminData.SeedAsync(app.Services);
await MasterDataSeeder.SeedAsync(app.Services);
await OperationDataSeeder.SeedAsync(app.Services);
await UserJsonSeeder.SeedUsersFromJsonAsync(app.Services);

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers();

app.Run();

static string ParseConnectionString(string rawUrl)
{
    if (string.IsNullOrWhiteSpace(rawUrl))
        return rawUrl;

    if (rawUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        rawUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            var uri = new Uri(rawUrl);
            var userInfo = uri.UserInfo.Split(':');
            var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
            var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
            var host = uri.Host;
            var port = uri.Port > 0 ? uri.Port : 5432;
            var database = uri.AbsolutePath.TrimStart('/');

            return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
        }
        catch
        {
            return rawUrl;
        }
    }

    return rawUrl;
}
