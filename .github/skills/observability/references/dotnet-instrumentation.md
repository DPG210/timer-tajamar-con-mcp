# .NET Instrumentation — OpenTelemetry Setup

## Package setup (.NET 8)

```xml
<PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.9.*" />
<PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.9.*" />
<PackageReference Include="OpenTelemetry.Instrumentation.Http" Version="1.9.*" />
<PackageReference Include="OpenTelemetry.Instrumentation.SqlClient" Version="1.9.*" />
<PackageReference Include="OpenTelemetry.Instrumentation.EntityFrameworkCore" Version="1.0.*-beta*" />
<PackageReference Include="OpenTelemetry.Exporter.OpenTelemetryProtocol" Version="1.9.*" />

<!-- Structured logging -->
<PackageReference Include="Serilog.AspNetCore" Version="8.*" />
<PackageReference Include="Serilog.Sinks.OpenTelemetry" Version="4.*" />
```

## Program.cs — full setup

```csharp
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ─── Structured Logging (Serilog) ───
builder.Host.UseSerilog((context, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("ServiceName", "MyApi")
    .Enrich.WithProperty("Environment", context.HostingEnvironment.EnvironmentName)
    .WriteTo.Console(outputTemplate:
        "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.OpenTelemetry(options =>
    {
        options.Endpoint = builder.Configuration["Otel:Endpoint"] ?? "http://localhost:4317";
        options.Protocol = Serilog.Sinks.OpenTelemetry.OtlpProtocol.Grpc;
    }));

// ─── OpenTelemetry ───
var serviceName = "MyApi";
var serviceVersion = "1.0.0";

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService(serviceName, serviceVersion: serviceVersion)
        .AddAttributes(new Dictionary<string, object>
        {
            ["deployment.environment"] = builder.Environment.EnvironmentName
        }))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation(options =>
        {
            options.RecordException = true;
            options.Filter = ctx => !ctx.Request.Path.StartsWithSegments("/health");
        })
        .AddHttpClientInstrumentation()
        .AddSqlClientInstrumentation(options => options.SetDbStatementForText = true)
        .AddEntityFrameworkCoreInstrumentation()
        .AddSource(serviceName)  // Custom ActivitySource
        .AddOtlpExporter())
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation()
        .AddMeter(serviceName)  // Custom Meter
        .AddOtlpExporter());

var app = builder.Build();
app.UseSerilogRequestLogging();  // Structured HTTP request logs
app.Run();
```

## Custom instrumentation

```csharp
using System.Diagnostics;
using System.Diagnostics.Metrics;

public class OrderService
{
    // Tracing: custom spans
    private static readonly ActivitySource ActivitySource = new("MyApi");
    
    // Metrics: custom counters/histograms
    private static readonly Meter Meter = new("MyApi");
    private static readonly Counter<long> OrdersCreated = Meter.CreateCounter<long>(
        "orders.created", "orders", "Number of orders created");
    private static readonly Histogram<double> OrderProcessingDuration = Meter.CreateHistogram<double>(
        "orders.processing.duration", "ms", "Time to process an order");

    public async Task<Order> CreateOrderAsync(CreateOrderRequest request)
    {
        // Start a custom span
        using var activity = ActivitySource.StartActivity("CreateOrder");
        activity?.SetTag("order.customer_id", request.CustomerId);
        activity?.SetTag("order.item_count", request.Items.Count);

        var stopwatch = Stopwatch.StartNew();
        try
        {
            var order = await ProcessOrder(request);
            
            // Record success metric
            OrdersCreated.Add(1, 
                new KeyValuePair<string, object?>("status", "success"),
                new KeyValuePair<string, object?>("payment_method", request.PaymentMethod));
            
            activity?.SetTag("order.id", order.Id);
            activity?.SetStatus(ActivityStatusCode.Ok);
            return order;
        }
        catch (Exception ex)
        {
            // Record failure
            OrdersCreated.Add(1, new KeyValuePair<string, object?>("status", "failed"));
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.RecordException(ex);
            throw;
        }
        finally
        {
            OrderProcessingDuration.Record(stopwatch.ElapsedMilliseconds);
        }
    }
}
```

## Structured logging patterns

```csharp
// GOOD: Structured with semantic properties
_logger.LogInformation("Order {OrderId} created for customer {CustomerId}, total {Total:C}",
    order.Id, order.CustomerId, order.Total);

// GOOD: Warning with context
_logger.LogWarning("Payment retry {Attempt}/{MaxAttempts} for order {OrderId}",
    attempt, maxAttempts, orderId);

// GOOD: Error with exception
_logger.LogError(ex, "Failed to process order {OrderId}: {Reason}",
    orderId, ex.Message);

// BAD: String interpolation (not searchable)
_logger.LogInformation($"Order {order.Id} created for customer {order.CustomerId}");

// BAD: No context
_logger.LogError("Something went wrong");
```

## Environment variables for configuration

```bash
# OTel Collector endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317

# Service identification
OTEL_SERVICE_NAME=MyApi
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production,service.version=1.2.3

# Sampling (reduce volume in production)
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1  # 10% of successful traces

# Azure Application Insights (alternative exporter)
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://...
```

## Health check endpoints (for observability integration)

```csharp
builder.Services.AddHealthChecks()
    .AddSqlServer(connectionString, name: "database")
    .AddRedis(redisConnection, name: "cache")
    .AddUrlGroup(new Uri("https://external-api.com/health"), name: "external-api");

app.MapHealthChecks("/health/live", new() { Predicate = _ => false });  // Liveness (app running)
app.MapHealthChecks("/health/ready", new() { Predicate = _ => true });  // Readiness (deps OK)
```

## Common anti-patterns

- **`Console.WriteLine` for logging** → Not structured, not correlated, not searchable. Use ILogger.
- **String interpolation in log messages** → `$"Order {id}"` prevents structured search. Use message templates.
- **Tracing every method** → Trace boundaries (HTTP, DB, queue). Internal methods use logs or nothing.
- **No sampling in production** → 100% tracing on high-traffic service = massive storage costs.
- **Health endpoint traced** → Thousands of noisy health check spans. Filter them out.
- **No exception recording on spans** → Errors become invisible in trace view. Always `RecordException`.
- **Logs without correlation** → Without TraceId/SpanId enrichment, logs can't be linked to traces.
