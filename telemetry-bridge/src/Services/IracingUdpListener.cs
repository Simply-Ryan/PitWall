using System;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using PitWall.Models;

namespace PitWall.Services
{
    /// <summary>
    /// iRacing UDP telemetry listener service.
    /// Listens for incoming iRacing telemetry packets on UDP port 11111.
    /// Processes packets through IracingConnector and buffers them for consumption.
    /// 
    /// Performance target: Sub-2ms parsing latency at 60 Hz update rate
    /// </summary>
    public interface IIracingUdpListener
    {
        /// <summary>
        /// Starts listening for iRacing UDP telemetry packets.
        /// </summary>
        Task StartAsync(CancellationToken cancellationToken);

        /// <summary>
        /// Stops listening for UDP packets and cleans up resources.
        /// </summary>
        Task StopAsync();

        /// <summary>
        /// Gets current listener statistics.
        /// </summary>
        IracingListenerStats GetStats();

        /// <summary>
        /// Event fired when new telemetry data is received and parsed.
        /// </summary>
        event EventHandler<TelemetryReceivedEventArgs>? TelemetryReceived;

        /// <summary>
        /// Event fired when parsing error occurs.
        /// </summary>
        event EventHandler<ParsingErrorEventArgs>? ParsingError;
    }

    /// <summary>
    /// Event args for telemetry received event.
    /// </summary>
    public class TelemetryReceivedEventArgs : EventArgs
    {
        public TelemetryReceivedEventArgs(UnifiedTelemetryData telemetry, TimeSpan parseTime)
        {
            Telemetry = telemetry;
            ParseTime = parseTime;
        }

        public UnifiedTelemetryData Telemetry { get; }
        public TimeSpan ParseTime { get; }
    }

    /// <summary>
    /// Event args for parsing error event.
    /// </summary>
    public class ParsingErrorEventArgs : EventArgs
    {
        public ParsingErrorEventArgs(string error, Exception? exception = null)
        {
            Error = error;
            Exception = exception;
        }

        public string Error { get; }
        public Exception? Exception { get; }
    }

    /// <summary>
    /// iRacing UDP listener statistics for monitoring.
    /// </summary>
    public class IracingListenerStats
    {
        public int PacketsReceived { get; set; }
        public int PacketsParsed { get; set; }
        public int ParsingErrors { get; set; }
        public TimeSpan AverageParseTime { get; set; }
        public DateTime StartTime { get; set; }
        public int DroppedPackets { get; set; }
        public int BufferOverflows { get; set; }
    }

    /// <summary>
    /// Implementation of iRacing UDP listener.
    /// </summary>
    public class IracingUdpListener : IIracingUdpListener, IDisposable
    {
        private readonly ILogger<IracingUdpListener> _logger;
        private readonly IracingConnector _connector;
        private readonly ITelemetryBuffer _telemetryBuffer;

        private UdpClient? _udpClient;
        private CancellationTokenSource? _cancellationTokenSource;
        private Task? _listenerTask;
        private bool _disposed;

        // Statistics tracking
        private int _packetsReceived;
        private int _packetsParsed;
        private int _parsingErrors;
        private long _totalParseTimeMs;
        private int _droppedPackets;
        private int _bufferOverflows;
        private readonly DateTime _startTime;

        // iRacing UDP constants
        private const int IRAC_UDP_PORT = 11111;
        private const int IRAC_LISTEN_TIMEOUT_MS = 1000; // 1 second timeout for receive
        private const int MAX_PACKETS_PER_ITERATION = 10; // Max packets to process per iteration

        public event EventHandler<TelemetryReceivedEventArgs>? TelemetryReceived;
        public event EventHandler<ParsingErrorEventArgs>? ParsingError;

        public IracingUdpListener(
            ILogger<IracingUdpListener> logger,
            IracingConnector connector,
            ITelemetryBuffer telemetryBuffer)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _connector = connector ?? throw new ArgumentNullException(nameof(connector));
            _telemetryBuffer = telemetryBuffer ?? throw new ArgumentNullException(nameof(telemetryBuffer));
            _startTime = DateTime.UtcNow;
        }

        /// <summary>
        /// Starts listening for iRacing UDP telemetry packets.
        /// Runs listener loop that processes packets asynchronously.
        /// </summary>
        public async Task StartAsync(CancellationToken cancellationToken)
        {
            if (_listenerTask != null && !_listenerTask.IsCompleted)
            {
                _logger.LogWarning("iRacing UDP listener already running");
                return;
            }

            try
            {
                _cancellationTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                _udpClient = new UdpClient(IRAC_UDP_PORT);
                _udpClient.Client.ReceiveTimeout = IRAC_LISTEN_TIMEOUT_MS;

                _logger.LogInformation("iRacing UDP listener started on port {Port}", IRAC_UDP_PORT);

                _listenerTask = ListenAsync(_cancellationTokenSource.Token);
                await _listenerTask.ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start iRacing UDP listener");
                OnParsingError($"Failed to start UDP listener: {ex.Message}", ex);
                throw;
            }
        }

        /// <summary>
        /// Stops listening for UDP packets and cleans up resources.
        /// </summary>
        public async Task StopAsync()
        {
            try
            {
                _cancellationTokenSource?.Cancel();

                if (_listenerTask != null)
                {
                    try
                    {
                        await _listenerTask.ConfigureAwait(false);
                    }
                    catch (OperationCanceledException)
                    {
                        // Expected when cancelling
                    }
                }

                _udpClient?.Dispose();
                _logger.LogInformation("iRacing UDP listener stopped");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping iRacing UDP listener");
            }
        }

        /// <summary>
        /// Gets current listener statistics.
        /// </summary>
        public IracingListenerStats GetStats()
        {
            return new IracingListenerStats
            {
                PacketsReceived = _packetsReceived,
                PacketsParsed = _packetsParsed,
                ParsingErrors = _parsingErrors,
                AverageParseTime = _packetsParsed > 0
                    ? TimeSpan.FromMilliseconds((double)_totalParseTimeMs / _packetsParsed)
                    : TimeSpan.Zero,
                StartTime = _startTime,
                DroppedPackets = _droppedPackets,
                BufferOverflows = _bufferOverflows
            };
        }

        /// <summary>
        /// Main listener loop that continuously receives and processes UDP packets.
        /// Runs asynchronously until cancellation is requested.
        /// </summary>
        private async Task ListenAsync(CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    // Receive UDP packet with timeout
                    UdpReceiveResult result = await ReceivePacketAsync(cancellationToken).ConfigureAwait(false);

                    // Process the packet
                    ProcessPacket(result.Buffer);

                    Interlocked.Increment(ref _packetsReceived);
                }
                catch (OperationCanceledException)
                {
                    // Expected during shutdown
                    break;
                }
                catch (SocketException ex) when (ex.SocketErrorCode == SocketError.TimedOut)
                {
                    // Timeout is normal - just continue listening
                    continue;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in UDP listener loop");
                    OnParsingError($"UDP listener error: {ex.Message}", ex);
                }
            }
        }

        /// <summary>
        /// Receives a UDP packet asynchronously with timeout handling.
        /// </summary>
        private async Task<UdpReceiveResult> ReceivePacketAsync(CancellationToken cancellationToken)
        {
            if (_udpClient == null)
            {
                throw new InvalidOperationException("UDP client not initialized");
            }

            try
            {
                return await _udpClient.ReceiveAsync().ConfigureAwait(false);
            }
            catch (SocketException ex) when (ex.SocketErrorCode == SocketError.TimedOut)
            {
                // Convert timeout to cancellation
                await Task.Delay(10, cancellationToken).ConfigureAwait(false);
                throw new OperationCanceledException("Receive timeout", ex);
            }
        }

        /// <summary>
        /// Processes a single UDP packet: parsing, validation, and buffering.
        /// Measures parse time for performance monitoring.
        /// </summary>
        private void ProcessPacket(byte[] rawData)
        {
            var startTime = DateTime.UtcNow;

            try
            {
                // Parse iRacing binary packet
                var telemetry = _connector.Parse(rawData);

                if (telemetry == null)
                {
                    Interlocked.Increment(ref _parsingErrors);
                    OnParsingError("Failed to parse iRacing telemetry packet");
                    return;
                }

                // Create snapshot for buffer
                var snapshot = new TelemetrySnapshot
                {
                    Data = telemetry,
                    Timestamp = DateTime.UtcNow,
                    DeltaTimeMs = (float)(DateTime.UtcNow - startTime).TotalMilliseconds
                };

                // Buffer the telemetry
                _telemetryBuffer.Enqueue(snapshot);

                // Update statistics
                Interlocked.Increment(ref _packetsParsed);
                var parseTimeMs = (long)(DateTime.UtcNow - startTime).TotalMilliseconds;
                Interlocked.Add(ref _totalParseTimeMs, parseTimeMs);

                // Log performance warning if parse time exceeds target
                if (parseTimeMs > 2)
                {
                    _logger.LogWarning("Slow iRacing parse: {ParseTimeMs}ms (target: <2ms)", parseTimeMs);
                }

                // Raise event for consumers
                OnTelemetryReceived(telemetry, DateTime.UtcNow - startTime);
            }
            catch (Exception ex)
            {
                Interlocked.Increment(ref _parsingErrors);
                _logger.LogError(ex, "Error processing iRacing telemetry packet");
                OnParsingError($"Packet processing error: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Raises TelemetryReceived event.
        /// </summary>
        private void OnTelemetryReceived(UnifiedTelemetryData telemetry, TimeSpan parseTime)
        {
            try
            {
                TelemetryReceived?.Invoke(this, new TelemetryReceivedEventArgs(telemetry, parseTime));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in TelemetryReceived event handler");
            }
        }

        /// <summary>
        /// Raises ParsingError event.
        /// </summary>
        private void OnParsingError(string error, Exception? exception = null)
        {
            try
            {
                ParsingError?.Invoke(this, new ParsingErrorEventArgs(error, exception));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ParsingError event handler");
            }
        }

        /// <summary>
        /// Disposes resources.
        /// </summary>
        public void Dispose()
        {
            if (_disposed)
            {
                return;
            }

            try
            {
                StopAsync().GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during disposal");
            }

            _cancellationTokenSource?.Dispose();
            _udpClient?.Dispose();
            _disposed = true;
        }
    }
}
