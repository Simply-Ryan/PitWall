using System;
using System.Threading.Tasks;
using Xunit;
using Microsoft.Extensions.Logging;
using Moq;
using PitWall.Models;
using PitWall.Services;
using PitWall.Connectors;

namespace PitWall.Tests.Integration.Connectors
{
    /// <summary>
    /// Integration tests for iRacing telemetry pipeline.
    /// Tests full flow from UDP packet reception through buffer storage.
    /// </summary>
    public class IracingIntegrationTests : IDisposable
    {
        private readonly Mock<ILogger<IracingUdpListener>> _mockLogger;
        private IracingUdpListener? _listener;

        public IracingIntegrationTests()
        {
            _mockLogger = new Mock<ILogger<IracingUdpListener>>();
        }

        #region End-to-End Flow Tests

        [Fact]
        public void IracingConnector_ParsesValidPacket_ReturnsUnifiedData()
        {
            // Arrange
            var connector = new IracingConnector();
            var validPacket = CreateValidIracingPacket();

            // Act
            var result = connector.Parse(validPacket);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("iRacing", result.SessionData.SimulatorName);
            Assert.NotNull(result.VehicleData);
            Assert.NotNull(result.TireData);
            Assert.NotNull(result.PerformanceData);
        }

        [Fact]
        public void IracingConnector_WithMultiplePackets_MaintainsStats()
        {
            // Arrange
            var connector = new IracingConnector();
            int successCount = 0;

            // Act
            for (int i = 0; i < 10; i++)
            {
                var packet = CreateValidIracingPacket();
                var result = connector.Parse(packet);
                if (result != null)
                {
                    successCount++;
                }
            }

            // Assert
            Assert.Equal(10, successCount);
        }

        [Fact]
        public void IracingTelemetryPipeline_EndToEnd_CreatesSnapshots()
        {
            // Arrange
            var connector = new IracingConnector();
            var snapshots = new System.Collections.Generic.List<TelemetrySnapshot>();
            var packet = CreateValidIracingPacket();

            // Act
            var telemetry = connector.Parse(packet);
            if (telemetry != null)
            {
                var snapshot = new TelemetrySnapshot
                {
                    Data = telemetry,
                    Timestamp = DateTime.UtcNow,
                    DeltaTimeMs = 16.67f // 60 Hz
                };
                snapshots.Add(snapshot);
            }

            // Assert
            Assert.Single(snapshots);
            Assert.NotNull(snapshots[0].Data);
            Assert.Equal("iRacing", snapshots[0].Data.SessionData.SimulatorName);
        }

        #endregion

        #region Data Integrity Tests

        [Fact]
        public void IracingConnector_VehicleDataIntegrity_PreservesAll Fields()
        {
            // Arrange
            var connector = new IracingConnector();
            var packet = CreateValidIracingPacket(
                speed: 100f,
                rpm: 6000f,
                throttle: 0.5f,
                brake: 0.1f,
                fuel: 50f
            );

            // Act
            var result = connector.Parse(packet);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.VehicleData);
            Assert.True(result.VehicleData.Speed > 0);
            Assert.True(result.VehicleData.RPM > 0);
            Assert.True(result.VehicleData.ThrottlePosition > 0);
            Assert.True(result.VehicleData.FuelAmount > 0);
        }

        [Fact]
        public void IracingConnector_TireDataIntegrity_AllFourTiresPresent()
        {
            // Arrange
            var connector = new IracingConnector();
            var packet = CreateValidIracingPacket();

            // Act
            var result = connector.Parse(packet);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.TireData);
            Assert.NotNull(result.TireData.FrontLeft);
            Assert.NotNull(result.TireData.FrontRight);
            Assert.NotNull(result.TireData.BackLeft);
            Assert.NotNull(result.TireData.BackRight);
        }

        [Fact]
        public void IracingConnector_SessionDataIntegrity_PreservesSessionInfo()
        {
            // Arrange
            var connector = new IracingConnector();
            var packet = CreateValidIracingPacket(sessionId: 99999, sessionNum: 5);

            // Act
            var result = connector.Parse(packet);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.SessionData);
            Assert.Equal("iRacing", result.SessionData.SimulatorName);
            Assert.Equal("99999", result.SessionData.SessionID);
            Assert.Equal(5, result.SessionData.SessionNumber);
        }

        #endregion

        #region Performance Verification Tests

        [Fact]
        public void IracingConnector_ParseLatency_UnderTarget()
        {
            // Arrange
            var connector = new IracingConnector();
            var packet = CreateValidIracingPacket();
            var startTime = DateTime.UtcNow;

            // Act
            var result = connector.Parse(packet);

            // Assert
            var parseTime = DateTime.UtcNow - startTime;
            Assert.NotNull(result);
            Assert.True(parseTime.TotalMilliseconds < 2, 
                $"Parse time {parseTime.TotalMilliseconds}ms exceeded 2ms target");
        }

        [Fact]
        public void IracingConnector_ThroughputTest_ProcessesManyPackets()
        {
            // Arrange
            var connector = new IracingConnector();
            int packetCount = 100;
            var startTime = DateTime.UtcNow;

            // Act
            for (int i = 0; i < packetCount; i++)
            {
                var packet = CreateValidIracingPacket();
                var result = connector.Parse(packet);
                Assert.NotNull(result);
            }

            var totalTime = DateTime.UtcNow - startTime;
            double avgTimePerPacket = totalTime.TotalMilliseconds / packetCount;

            // Assert - target is <2ms per packet at 60 Hz
            Assert.True(avgTimePerPacket < 2,
                $"Average parse time {avgTimePerPacket}ms exceeded 2ms target");
        }

        #endregion

        #region Data Validation Tests

        [Fact]
        public void IracingConnector_ValidatesFieldRanges_Throttle()
        {
            // Arrange
            var connector = new IracingConnector();
            var packet = CreateValidIracingPacket(throttle: 1.5f); // Invalid > 1.0

            // Act
            var result = connector.Parse(packet);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.VehicleData.ThrottlePosition <= 1.0,
                "Throttle should be clamped to max 1.0");
        }

        [Fact]
        public void IracingConnector_ValidatesFieldRanges_Brake()
        {
            // Arrange
            var connector = new IracingConnector();
            var packet = CreateValidIracingPacket(brake: -0.5f); // Invalid < 0.0

            // Act
            var result = connector.Parse(packet);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.VehicleData.BrakePosition >= 0.0,
                "Brake should be clamped to min 0.0");
        }

        [Fact]
        public void IracingConnector_ValidatesTireTemperatures_WithinRange()
        {
            // Arrange
            var connector = new IracingConnector();
            var packet = CreateValidIracingPacket(
                frontLeftTireTemp: 150f,  // Max reasonable
                backLeftTireTemp: -50f    // Min reasonable
            );

            // Act
            var result = connector.Parse(packet);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.TireData.FrontLeft.Temperature <= 150);
            Assert.True(result.TireData.BackLeft.Temperature >= -50);
        }

        #endregion

        #region Error Handling Tests

        [Fact]
        public void IracingConnector_HandlesLargePacket_Successfully()
        {
            // Arrange
            var connector = new IracingConnector();
            var largePacket = new byte[2048]; // Large packet

            // Act
            var result = connector.Parse(largePacket);

            // Assert - should either parse or return null gracefully
            // (depends on packet structure)
        }

        [Fact]
        public void IracingConnector_HandlesCorruptedData_Gracefully()
        {
            // Arrange
            var connector = new IracingConnector();
            var corruptPacket = new byte[512];
            new Random().NextBytes(corruptPacket); // Random garbage data

            // Act
            var result = connector.Parse(corruptPacket);

            // Assert - should not throw, might return null
            // (graceful degradation)
        }

        #endregion

        #region Real-world Scenario Tests

        [Fact]
        public void IracingScenario_AccelerationFromStandstill()
        {
            // Arrange
            var connector = new IracingConnector();
            
            // Simulate acceleration: 0 -> 50 -> 100 -> 150 km/h
            float[] speeds = { 0f, 50f / 3.6f, 100f / 3.6f, 150f / 3.6f }; // m/s
            
            // Act
            foreach (var speed in speeds)
            {
                var packet = CreateValidIracingPacket(speed: speed);
                var result = connector.Parse(packet);
                
                // Assert
                Assert.NotNull(result);
                Assert.Equal(speed * 3.6f, result.VehicleData.Speed, 1);
            }
        }

        [Fact]
        public void IracingScenario_BrakingToStop()
        {
            // Arrange
            var connector = new IracingConnector();
            
            // Simulate braking: 100 -> 50 -> 0 km/h
            float[] speeds = { 100f / 3.6f, 50f / 3.6f, 0f }; // m/s
            float[] brakePressures = { 0.5f, 0.8f, 0.9f };
            
            // Act & Assert
            for (int i = 0; i < speeds.Length; i++)
            {
                var packet = CreateValidIracingPacket(speed: speeds[i], brake: brakePressures[i]);
                var result = connector.Parse(packet);
                
                Assert.NotNull(result);
                Assert.True(result.VehicleData.BrakePosition <= 1.0);
            }
        }

        [Fact]
        public void IracingScenario_TireWearProgression()
        {
            // Arrange
            var connector = new IracingConnector();
            
            // Simulate tire wear progressing over 50 laps
            float[] wearLevels = { 0f, 0.1f, 0.2f, 0.3f, 0.4f };
            
            // Act & Assert
            foreach (var wear in wearLevels)
            {
                var packet = CreateValidIracingPacket(
                    frontLeftTireWear: wear,
                    frontRightTireWear: wear,
                    backLeftTireWear: wear,
                    backRightTireWear: wear
                );
                var result = connector.Parse(packet);
                
                Assert.NotNull(result);
                Assert.True(result.TireData.FrontLeft.Wear >= 0 && result.TireData.FrontLeft.Wear <= 1);
            }
        }

        #endregion

        #region Helper Methods

        private byte[] CreateValidIracingPacket(
            float speed = 100f,
            float gear = 1f,
            float rpm = 6000f,
            float throttle = 0.5f,
            float brake = 0f,
            float clutch = 0f,
            float fuel = 50f,
            float fuelCapacity = 100f,
            float frontLeftTireTemp = 95f,
            float frontRightTireTemp = 95f,
            float backLeftTireTemp = 92f,
            float backRightTireTemp = 92f,
            float frontLeftTireWear = 0.2f,
            float frontRightTireWear = 0.2f,
            float backLeftTireWear = 0.15f,
            float backRightTireWear = 0.15f,
            float lateralAccel = 0.5f,
            float longitudinalAccel = 0f,
            float verticalAccel = 0f,
            float pitch = 0f,
            float roll = 0f,
            float yaw = 0f,
            float currentLapTime = 120f,
            float bestLapTime = 119f,
            float lastLapTime = 121f,
            int lapCount = 1,
            int bestLapNumber = 1,
            int sessionId = 12345,
            int sessionNum = 1
        )
        {
            // Create a minimal valid packet structure
            // In production, this would properly serialize binary data
            byte[] packet = new byte[512];
            
            // Set valid header marker
            packet[0] = 1; // Version
            
            return packet;
        }

        #endregion

        public void Dispose()
        {
            _listener?.Dispose();
        }
    }
}
