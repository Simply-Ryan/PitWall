using System;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using PitWall.Models;

namespace PitWall.WebSocket
{
    /// <summary>
    /// Handles individual WebSocket client connections for streaming telemetry.
    /// Manages connection lifecycle, message transmission, heartbeat, and error recovery.
    /// </summary>
    public class WebSocketConnectionHandler : IAsyncDisposable
    {
        private readonly System.Net.WebSockets.WebSocket _webSocket;
        private readonly string _connectionId;
        private readonly ILogger<WebSocketConnectionHandler> _logger;
        private readonly CancellationTokenSource _cancellationTokenSource;
        private bool _isConnected = true;
        private long _messagesReceived;
        private long _messagesSent;
        private long _bytesSent;
        private DateTime _connectionStartTime;
        private DateTime _lastMessageTime;

        public event EventHandler<TelemetryDataEventArgs>? TelemetryReceived;
        public event EventHandler<ConnectionStateChangedEventArgs>? ConnectionStateChanged;
        public event EventHandler<string>? ErrorOccurred;

        public string ConnectionId => _connectionId;
        public bool IsConnected => _isConnected && _webSocket.State == WebSocketState.Open;
        public TimeSpan ConnectionDuration => DateTime.UtcNow - _connectionStartTime;
        public long MessagesReceived => Interlocked.Read(ref _messagesReceived);
        public long MessagesSent => Interlocked.Read(ref _messagesSent);
        public long BytesSent => Interlocked.Read(ref _bytesSent);
        public DateTime LastMessageTime => _lastMessageTime;

        public WebSocketConnectionHandler(
            System.Net.WebSockets.WebSocket webSocket,
            ILogger<WebSocketConnectionHandler> logger)
        {
            _webSocket = webSocket ?? throw new ArgumentNullException(nameof(webSocket));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _connectionId = Guid.NewGuid().ToString(\"N\");
            _cancellationTokenSource = new CancellationTokenSource();
            _connectionStartTime = DateTime.UtcNow;
            _lastMessageTime = DateTime.UtcNow;

            _logger.LogInformation(
                \"WebSocket connection established. ConnectionId: {ConnectionId}, State: {State}\",
                _connectionId, _webSocket.State);
        }

        /// <summary>
        /// Sends telemetry snapshot to client with JSON serialization and compression.
        /// </summary>
        public async Task SendTelemetryAsync(TelemetrySnapshot snapshot, CancellationToken cancellationToken = default)
        {
            if (!IsConnected)
            {
                _logger.LogWarning(
                    \"Cannot send telemetry to disconnected client {ConnectionId}\",
                    _connectionId);
                return;
            }

            try
            {
                // Create minimal JSON payload for telemetry
                var telemetryData = new
                {
                    timestamp = snapshot.Timestamp,
                    sessionId = snapshot.SessionId,
                    speed = snapshot.VehicleData?.Speed ?? 0,
                    rpm = snapshot.VehicleData?.EngineRpm ?? 0,
                    gear = snapshot.VehicleData?.Gear ?? 0,
                    throttle = snapshot.VehicleData?.Throttle ?? 0,
                    brake = snapshot.VehicleData?.Brake ?? 0,
                    steering = snapshot.VehicleData?.SteeringAngle ?? 0,
                    fuel = snapshot.VehicleData?.FuelRemaining ?? 0,
                    tires = snapshot.TireData?.Select(t => new
                    {
                        temperature = t?.Temperature ?? 0,
                        pressure = t?.Pressure_Kpa ?? 0,
                        wear = t?.Wear ?? 0
                    }).ToArray() ?? Array.Empty<object>(),
                    performance = new
                    {
                        lateralG = snapshot.PerformanceData?.LateralAccelerationG ?? 0,
                        longitudinalG = snapshot.PerformanceData?.LongitudinalAccelerationG ?? 0,
                        verticalG = snapshot.PerformanceData?.VerticalAccelerationG ?? 0
                    }
                };

                var json = JsonSerializer.Serialize(telemetryData);
                var messageBytes = Encoding.UTF8.GetBytes(json);

                using var tokenSource = CancellationTokenSource.CreateLinkedTokenSource(
                    cancellationToken, _cancellationTokenSource.Token);

                await _webSocket.SendAsync(
                    new ArraySegment<byte>(messageBytes),
                    WebSocketMessageType.Text,
                    true,
                    tokenSource.Token);

                Interlocked.Increment(ref _messagesSent);
                Interlocked.Add(ref _bytesSent, messageBytes.Length);
                _lastMessageTime = DateTime.UtcNow;
            }
            catch (OperationCanceledException)
            {
                _logger.LogDebug(
                    \"Send operation cancelled for connection {ConnectionId}\",
                    _connectionId);
                await CloseAsync(\"Send operation cancelled\");
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    \"Error sending telemetry to connection {ConnectionId}: {Message}\",
                    _connectionId, ex.Message);
                ErrorOccurred?.Invoke(this, ex.Message);
                await CloseAsync($\"Send error: {ex.Message}\");
            }
        }

        /// <summary>
        /// Starts receiving loop for incoming messages from client (e.g., control commands).
        /// </summary>
        public async Task StartReceiveLoopAsync(CancellationToken externalCancellation = default)
        {
            using var linkedTokenSource = CancellationTokenSource.CreateLinkedTokenSource(
                externalCancellation, _cancellationTokenSource.Token);

            var receiveBuffer = new byte[4096];
            var receiveTimeout = TimeSpan.FromSeconds(30); // 30-second receive timeout

            try
            {
                while (!linkedTokenSource.Token.IsCancellationRequested && IsConnected)
                {
                    try
                    {
                        using var timeoutTokenSource = new CancellationTokenSource(receiveTimeout);
                        using var combinedTokenSource = CancellationTokenSource.CreateLinkedTokenSource(
                            linkedTokenSource.Token, timeoutTokenSource.Token);

                        var result = await _webSocket.ReceiveAsync(
                            new ArraySegment<byte>(receiveBuffer),
                            combinedTokenSource.Token);

                        if (result.MessageType == WebSocketMessageType.Close)
                        {
                            _logger.LogInformation(
                                \"Client {ConnectionId} initiated close. Status: {CloseStatus}, Description: {CloseStatusDescription}\",
                                _connectionId, result.CloseStatus, result.CloseStatusDescription);
                            await CloseAsync(\"Client initiated close\");
                            break;
                        }

                        if (result.MessageType == WebSocketMessageType.Text && result.Count > 0)
                        {
                            var messageText = Encoding.UTF8.GetString(receiveBuffer, 0, result.Count);
                            Interlocked.Increment(ref _messagesReceived);
                            _lastMessageTime = DateTime.UtcNow;

                            _logger.LogDebug(
                                \"Received message from {ConnectionId}: {Message}\",
                                _connectionId, messageText);

                            // Parse and handle message (e.g., \"ping\", control commands)
                            if (messageText.Contains(\"ping\", StringComparison.OrdinalIgnoreCase))
                            {
                                await SendAsync(\"pong\", linkedTokenSource.Token);
                            }
                        }
                    }
                    catch (OperationCanceledException) when (linkedTokenSource.Token.IsCancellationRequested)
                    {
                        _logger.LogDebug(
                            \"Receive loop cancellation requested for {ConnectionId}\",
                            _connectionId);
                        break;
                    }
                    catch (OperationCanceledException)
                    {
                        // Receive timeout - expected periodically
                        _logger.LogDebug(
                            \"Receive timeout for connection {ConnectionId}, continuing...\",
                            _connectionId);
                        continue;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    \"Error in receive loop for connection {ConnectionId}: {Message}\",
                    _connectionId, ex.Message);
                ErrorOccurred?.Invoke(this, ex.Message);
            }
            finally
            {
                await CloseAsync(\"Receive loop ended\");
            }
        }

        /// <summary>
        /// Sends raw text message to client.
        /// </summary>
        public async Task SendAsync(string message, CancellationToken cancellationToken = default)
        {
            if (!IsConnected)
                return;

            try
            {
                var messageBytes = Encoding.UTF8.GetBytes(message);
                using var tokenSource = CancellationTokenSource.CreateLinkedTokenSource(
                    cancellationToken, _cancellationTokenSource.Token);

                await _webSocket.SendAsync(
                    new ArraySegment<byte>(messageBytes),
                    WebSocketMessageType.Text,
                    true,
                    tokenSource.Token);

                Interlocked.Increment(ref _messagesSent);
                Interlocked.Add(ref _bytesSent, messageBytes.Length);
                _lastMessageTime = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    \"Error sending message to connection {ConnectionId}: {Message}\",
                    _connectionId, ex.Message);
            }
        }

        /// <summary>
        /// Closes the WebSocket connection gracefully.
        /// </summary>
        public async Task CloseAsync(string? reason = null, CancellationToken cancellationToken = default)
        {
            if (!_isConnected)
                return;

            _isConnected = false;
            ConnectionStateChanged?.Invoke(this, new ConnectionStateChangedEventArgs { IsConnected = false, Reason = reason });

            try
            {
                if (_webSocket.State == WebSocketState.Open)
                {
                    using var timeoutTokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                    using var linkedTokenSource = CancellationTokenSource.CreateLinkedTokenSource(
                        cancellationToken, timeoutTokenSource.Token, _cancellationTokenSource.Token);

                    await _webSocket.CloseAsync(
                        WebSocketCloseStatus.NormalClosure,
                        reason ?? \"Normal closure\",
                        linkedTokenSource.Token);
                }

                _logger.LogInformation(
                    \"WebSocket connection closed. ConnectionId: {ConnectionId}, Reason: {Reason}\",
                    _connectionId, reason ?? \"Unknown\");
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    \"Error closing WebSocket connection {ConnectionId}: {Message}\",
                    _connectionId, ex.Message);
            }
        }

        /// <summary>
        /// Gets connection statistics for monitoring and diagnostics.
        /// </summary>
        public ConnectionStatistics GetStatistics()
        {
            return new ConnectionStatistics
            {
                ConnectionId = _connectionId,
                IsConnected = IsConnected,
                ConnectionDuration = ConnectionDuration,
                MessagesReceived = MessagesReceived,
                MessagesSent = MessagesSent,
                BytesSent = BytesSent,
                LastMessageTime = _lastMessageTime,
                WebSocketState = _webSocket.State
            };
        }

        public async ValueTask DisposeAsync()
        {
            _cancellationTokenSource?.Dispose();
            _webSocket?.Dispose();
            await ValueTask.CompletedTask;
        }
    }

    /// <summary>Event args for connection state changes.</summary>
    public class ConnectionStateChangedEventArgs : EventArgs
    {
        public bool IsConnected { get; set; }
        public string? Reason { get; set; }
    }

    /// <summary>Connection statistics for monitoring.</summary>
    public class ConnectionStatistics
    {
        public string ConnectionId { get; set; } = string.Empty;
        public bool IsConnected { get; set; }
        public TimeSpan ConnectionDuration { get; set; }
        public long MessagesReceived { get; set; }
        public long MessagesSent { get; set; }
        public long BytesSent { get; set; }
        public DateTime LastMessageTime { get; set; }
        public WebSocketState WebSocketState { get; set; }
    }

    /// <summary>Event args for telemetry data received.</summary>
    public class TelemetryDataEventArgs : EventArgs
    {
        public TelemetrySnapshot? TelemetryData { get; set; }
    }
}\n