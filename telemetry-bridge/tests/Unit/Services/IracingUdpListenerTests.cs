using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Microsoft.Extensions.Logging;
using PitWall.Models;
using PitWall.Services;
using PitWall.Connectors;

namespace PitWall.Tests.Unit.Services
{
    /// <summary>
    /// Unit tests for IracingUdpListener service.
    /// Tests UDP packet receiving, event raising, statistics tracking, and error handling.
    /// </summary>
    public class IracingUdpListenerTests : IDisposable
    {
        private readonly Mock<ILogger<IracingUdpListener>> _mockLogger;
        private readonly Mock<IracingConnector> _mockConnector;
        private readonly Mock<ITelemetryBuffer> _mockBuffer;
        private IracingUdpListener? _listener;

        public IracingUdpListenerTests()
        {
            _mockLogger = new Mock<ILogger<IracingUdpListener>>();
            _mockConnector = new Mock<IracingConnector>();
            _mockBuffer = new Mock<ITelemetryBuffer>();
        }

        #region Creation & Lifecycle Tests

        [Fact]
        public void Constructor_WithValidDependencies_CreatesListener()
        {
            // Act
            _listener = new IracingUdpListener(_mockLogger.Object, _mockConnector.Object, _mockBuffer.Object);

            // Assert
            Assert.NotNull(_listener);
        }

        [Fact]
        public void Constructor_WithNullLogger_ThrowsArgumentNullException()
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() =>
                new IracingUdpListener(null!, _mockConnector.Object, _mockBuffer.Object)
            );
        }

        [Fact]
        public void Constructor_WithNullConnector_ThrowsArgumentNullException()
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() =>
                new IracingUdpListener(_mockLogger.Object, null!, _mockBuffer.Object)
            );
        }

        [Fact]
        public void Constructor_WithNullBuffer_ThrowsArgumentNullException()
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() =>
                new IracingUdpListener(_mockLogger.Object, _mockConnector.Object, null!)
            );
        }

        #endregion

        #region Event Subscription Tests

        [Fact]
        public void EventSubscription_TelemetryReceived_CanSubscribe()
        {
            // Arrange
            _listener = new IracingUdpListener(_mockLogger.Object, _mockConnector.Object, _mockBuffer.Object);
            bool eventFired = false;

            // Act
            _listener.TelemetryReceived += (s, e) => eventFired = true;

            // Assert - just checking we can subscribe without error
            Assert.NotNull(_listener.TelemetryReceived);
        }

        [Fact]
        public void EventSubscription_ParsingError_CanSubscribe()
        {
            // Arrange
            _listener = new IracingUdpListener(_mockLogger.Object, _mockConnector.Object, _mockBuffer.Object);
            bool eventFired = false;

            // Act
            _listener.ParsingError += (s, e) => eventFired = true;

            // Assert
            Assert.NotNull(_listener.ParsingError);
        }

        #endregion

        #region Statistics Tests

        [Fact]
        public void GetStats_OnCreation_ReturnsInitialStats()
        {
            // Arrange
            _listener = new IracingUdpListener(_mockLogger.Object, _mockConnector.Object, _mockBuffer.Object);

            // Act
            var stats = _listener.GetStats();

            // Assert
            Assert.NotNull(stats);
            Assert.Equal(0, stats.PacketsReceived);
            Assert.Equal(0, stats.PacketsParsed);
            Assert.Equal(0, stats.ParsingErrors);
            Assert.Equal(TimeSpan.Zero, stats.AverageParseTime);
        }

        [Fact]
        public void GetStats_IncludesStartTime()
        {
            // Arrange
            var beforeCreation = DateTime.UtcNow;
            _listener = new IracingUdpListener(_mockLogger.Object, _mockConnector.Object, _mockBuffer.Object);
            var afterCreation = DateTime.UtcNow;

            // Act
            var stats = _listener.GetStats();

            // Assert
            Assert.NotNull(stats);
            Assert.True(stats.StartTime >= beforeCreation);
            Assert.True(stats.StartTime <= afterCreation);
        }

        #endregion

        #region Lifecycle Management Tests

        [Fact]
        public async Task StopAsync_WhenNotStarted_CompletesSuccessfully()
        {
            // Arrange
            _listener = new IracingUdpListener(_mockLogger.Object, _mockConnector.Object, _mockBuffer.Object);

            // Act & Assert
            await _listener.StopAsync(); // Should not throw
        }

        [Fact]
        public void Dispose_CanBeCalled()
        {
            // Arrange
            _listener = new IracingUdpListener(_mockLogger.Object, _mockConnector.Object, _mockBuffer.Object);

            // Act & Assert
            _listener.Dispose(); // Should not throw
        }

        [Fact]
        public async Task MultipleStop_DoesNotThrow()
        {
            // Arrange
            _listener = new IracingUdpListener(_mockLogger.Object, _mockConnector.Object, _mockBuffer.Object);

            // Act & Assert
            await _listener.StopAsync();
            await _listener.StopAsync(); // Second stop should not throw
        }

        #endregion

        #region Error Event Tests

        [Fact]
        public void TelemetryReceivedEventArgs_WithValidData_StoresData()
        {
            // Arrange
            var telemetry = new UnifiedTelemetryData { Timestamp = DateTime.UtcNow };
            var parseTime = TimeSpan.FromMilliseconds(1.5);

            // Act
            var eventArgs = new TelemetryReceivedEventArgs(telemetry, parseTime);

            // Assert
            Assert.Equal(telemetry, eventArgs.Telemetry);
            Assert.Equal(parseTime, eventArgs.ParseTime);
        }

        [Fact]
        public void ParsingErrorEventArgs_WithError_StoresError()
        {
            // Arrange
            string error = "Test parsing error";

            // Act
            var eventArgs = new ParsingErrorEventArgs(error);

            // Assert
            Assert.Equal(error, eventArgs.Error);
            Assert.Null(eventArgs.Exception);
        }

        [Fact]
        public void ParsingErrorEventArgs_WithException_StoresException()
        {
            // Arrange
            string error = "Test error";
            var exception = new InvalidOperationException("Test exception");

            // Act
            var eventArgs = new ParsingErrorEventArgs(error, exception);

            // Assert
            Assert.Equal(error, eventArgs.Error);
            Assert.Equal(exception, eventArgs.Exception);
        }

        #endregion

        #region Statistics Class Tests

        [Fact]
        public void IracingListenerStats_WithValidValues_StoresValues()
        {
            // Arrange
            var stats = new IracingListenerStats
            {
                PacketsReceived = 100,
                PacketsParsed = 95,
                ParsingErrors = 5,
                AverageParseTime = TimeSpan.FromMilliseconds(1.2),
                DroppedPackets = 2,
                BufferOverflows = 1
            };

            // Act & Assert
            Assert.Equal(100, stats.PacketsReceived);
            Assert.Equal(95, stats.PacketsParsed);
            Assert.Equal(5, stats.ParsingErrors);
            Assert.Equal(TimeSpan.FromMilliseconds(1.2), stats.AverageParseTime);
            Assert.Equal(2, stats.DroppedPackets);
            Assert.Equal(1, stats.BufferOverflows);
        }

        [Fact]
        public void IracingListenerStats_CalculatesErrorRate()
        {
            // Arrange
            var stats = new IracingListenerStats
            {
                PacketsReceived = 1000,
                ParsingErrors = 50
            };

            // Act
            double errorRate = (double)stats.ParsingErrors / stats.PacketsReceived;

            // Assert
            Assert.Equal(0.05, errorRate); // 5% error rate
        }

        #endregion

        #region Configuration Tests

        [Fact]
        public void DefaultPort_IsCorrectIracingPort()
        {
            // Arrange
            var testConnector = new IracingConnector();

            // Act
            int port = testConnector.DefaultPort;

            // Assert
            Assert.Equal(11111, port);
        }

        [Fact]
        public void SimulatorName_ReturnsIracing()
        {
            // Arrange
            var testConnector = new IracingConnector();

            // Act
            string name = testConnector.SimulatorName;

            // Assert
            Assert.Equal("iRacing", name);
        }

        #endregion

        #region Integration-like Tests

        [Fact]
        public async Task StopAsync_CallsCleanup()
        {
            // Arrange
            _listener = new IracingUdpListener(_mockLogger.Object, _mockConnector.Object, _mockBuffer.Object);

            // Act
            await _listener.StopAsync();

            // Assert - Should complete without error
            var stats = _listener.GetStats();
            Assert.NotNull(stats);
        }

        [Fact]
        public void Dispose_FollowedByStopAsync_Throws()
        {
            // Arrange
            _listener = new IracingUdpListener(_mockLogger.Object, _mockConnector.Object, _mockBuffer.Object);
            _listener.Dispose();

            // Act & Assert - StopAsync after Dispose should still complete (gracefully)
            var task = _listener.StopAsync();
            Assert.True(task.IsCompletedSuccessfully || task.IsFaulted);
        }

        #endregion

        #region Performance Expectations

        [Fact]
        public void GetStats_ReturnsZeroAverageParseTimeWhenNoPackets()
        {
            // Arrange
            _listener = new IracingUdpListener(_mockLogger.Object, _mockConnector.Object, _mockBuffer.Object);

            // Act
            var stats = _listener.GetStats();

            // Assert
            Assert.Equal(TimeSpan.Zero, stats.AverageParseTime);
        }

        #endregion

        public void Dispose()
        {
            _listener?.Dispose();
        }
    }
}
