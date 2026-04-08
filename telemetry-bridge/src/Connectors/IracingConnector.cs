using System;
using System.Runtime.InteropServices;
using System.Text;
using PitWall.Models;
using PitWall.Connectors;

namespace PitWall.Connectors
{
    /// <summary>
    /// iRacing telemetry UDP connector implementation.
    /// Parses binary telemetry packets from iRacing sim running on localhost:11111
    /// iRacing sends ~60 Hz telemetry updates (~16ms intervals)
    /// Packet structure: Header (24 bytes) + telemetry fields (variable)
    /// </summary>
    public class IracingConnector : BaseSimConnector
    {
        // iRacing UDP packet constants
        private const int IRAC_HEADER_SIZE = 24;
        private const int IRAC_MAX_PACKET_SIZE = 4096;
        
        // Gear constants
        private const int IRAC_GEAR_REVERSE = -1;
        private const int IRAC_GEAR_NEUTRAL = 0;
        private const float IRAC_SESSION_TIME_INVALID = -1f;
        
        // UDP port for iRacing telemetry
        public override int DefaultPort => 11111;
        public override string SimulatorName => "iRacing";

        /// <summary>
        /// Internal representation of iRacing telemetry packet header.
        /// All fields are little-endian format.
        /// </summary>
        [StructLayout(LayoutKind.Sequential, Pack = 4)]
        private struct IracingHeader
        {
            public int Ver;                 // Version
            public int Status;              // Session status (running, caution, etc)
            public int TickRate;             // Ticks per second
            public int SessionID;            // Session ID
            public int SessionNum;           // Session number
            public int SessionState;         // Session state enum
            public int SessionUniqueID;      // Unique session ID
            public float SessionTime;        // Current session time
            public double SessionTickCount;  // Tick count in session
            public float SimSpeed;           // Sim speed multiplier (1.0 = real-time)
            public float CameraSpeed;        // Camera movement speed
            public float TimerLapsStart;     // Ticks until laps start
            public int Reserved0;            // Reserved for future use
        }

        /// <summary>
        /// Represents iRacing telemetry data structure.
        /// This is a simplified representation covering key fields.
        /// Full iRacing telemetry includes 200+ fields.
        /// </summary>
        [StructLayout(LayoutKind.Sequential, Pack = 4)]
        private struct IracingTelemetry
        {
            // Player vehicle data
            public float Speed;              // Speed in m/s
            public float Brake;              // Brake pressure (0.0-1.0)
            public float Throttle;           // Throttle position (0.0-1.0)
            public float Clutch;             // Clutch position (0.0-1.0)
            public float Gear;               // Current gear (-1=reverse, 0=neutral, 1+=forward)
            public float RPM;                // Engine RPM
            public float Ffb;                // Force feedback intensity
            
            // Tire telemetry (4 tires: FL, FR, BL, BR)
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
            public float[] TireTemp;         // Tire surface temperatures (celsius)
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
            public float[] TireLoad;         // Tire load in Newtons
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
            public float[] TireWear;         // Tire wear 0-1
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
            public float[] TirePressure;     // Tire pressure in kPa
            
            // Suspension
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
            public float[] SuspensionTravel; // Suspension travel for each wheel
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
            public float[] SuspensionVelocity; // Suspension motion velocity
            
            // Fuel and damage
            public float Fuel;               // Fuel remaining in liters
            public float FuelCapacity;       // Fuel tank capacity in liters
            public float FuelLevel;          // Fuel level (0.0-1.0)
            public float EngineThrottle;     // Engine throttle demand (0.0-1.0)
            public float WaterTemp;          // Water temperature in celsius
            public float OilTemp;            // Oil temperature in celsius
            public float OilPressure;        // Oil pressure in kPa
            
            // Position and motion
            public float Lat;                // Lateral acceleration in G
            public float Lon;                // Longitudinal acceleration in G
            public float Vert;               // Vertical acceleration in G
            public float Roll;               // Roll angle in radians
            public float Pitch;              // Pitch angle in radians
            public float Yaw;                // Yaw angle in radians
            
            // Session info
            public float SessionTime;        // Session time in seconds
            public float LapTime;            // Current lap time in seconds
            public float EstLapTime;         // Estimated lap time in seconds
            public int LapCount;             // Current lap number
            public int LapBestLap;           // Best lap number this session
            public float LapBestTime;        // Best lap time in seconds
            public float LapLastTime;        // Last completed lap time in seconds
            public float TireCompound;       // Tire compound code
            
            // Driver biometrics (if available)
            public float HeartRate;          // Heart rate in BPM
            public float RespirationRate;    // Respiration rate
        }

        /// <summary>
        /// Parses iRacing binary telemetry UDP packet into UnifiedTelemetryData.
        /// 
        /// iRacing telemetry is sent as binary-packed structures over UDP.
        /// Packet structure:
        /// - Header (24 bytes): version, status, session info
        /// - Telemetry (variable): vehicle data, tire data, engine data, etc
        /// 
        /// Performance: Designed for sub-2ms parsing latency at 60 Hz update rate
        /// </summary>
        /// <param name="rawData">Raw UDP packet bytes from iRacing</param>
        /// <returns>Parsed UnifiedTelemetryData or null if parsing fails</returns>
        public override UnifiedTelemetryData? Parse(byte[] rawData)
        {
            try
            {
                // Validate packet size
                if (rawData == null || rawData.Length < IRAC_HEADER_SIZE)
                {
                    RecordParsingError($"Invalid packet size: {rawData?.Length ?? 0}, minimum: {IRAC_HEADER_SIZE}");
                    return null;
                }

                // Parse header
                IracingHeader header = ParseHeader(rawData);
                if (!ValidateHeader(header))
                {
                    return null;
                }

                // Parse telemetry data
                IracingTelemetry telemetry = ParseTelemetry(rawData, IRAC_HEADER_SIZE);

                // Build unified telemetry data
                var unifiedData = new UnifiedTelemetryData
                {
                    // Session data
                    SessionData = new SessionData
                    {
                        SimulatorName = SimulatorName,
                        SessionID = header.SessionID.ToString(),
                        SessionNumber = header.SessionNum,
                        SessionTime = Math.Max(telemetry.SessionTime, 0),
                        SessionTickCount = (int)header.SessionTickCount,
                        SimSpeed = header.SimSpeed,
                        SessionStatus = MapSessionStatus(header.Status),
                        SessionState = header.SessionState.ToString()
                    },

                    // Vehicle data
                    VehicleData = new VehicleData
                    {
                        Speed = ConvertMsToKmh(telemetry.Speed),
                        Gear = MapGear(telemetry.Gear),
                        RPM = (int)telemetry.RPM,
                        ThrottlePosition = Clamp(telemetry.Throttle, 0, 1),
                        BrakePosition = Clamp(telemetry.Brake, 0, 1),
                        ClutchPosition = Clamp(telemetry.Clutch, 0, 1),
                        FuelAmount = Clamp(telemetry.Fuel, 0, telemetry.FuelCapacity),
                        FuelCapacity = Math.Max(telemetry.FuelCapacity, 0),
                        WaterTemperature = telemetry.WaterTemp,
                        OilTemperature = telemetry.OilTemp,
                        OilPressure = Math.Max(telemetry.OilPressure, 0),
                        EngineThrottle = Clamp(telemetry.EngineThrottle, 0, 1),
                        TireCompound = telemetry.TireCompound.ToString()
                    },

                    // Input data
                    InputData = new InputData
                    {
                        SteeringAngle = 0f, // iRacing doesn't provide direct steering wheel angle in basic telemetry
                        Throttle = Clamp(telemetry.Throttle, 0, 1),
                        Brake = Clamp(telemetry.Brake, 0, 1),
                        Clutch = Clamp(telemetry.Clutch, 0, 1),
                        HandBrake = 0f  // Not available in iRacing telemetry
                    },

                    // Tire data
                    TireData = ParseTireData(telemetry),

                    // Performance data
                    PerformanceData = new PerformanceData
                    {
                        LateralAcceleration = Clamp(telemetry.Lat, -5, 5),
                        LongitudinalAcceleration = Clamp(telemetry.Lon, -5, 5),
                        VerticalAcceleration = Clamp(telemetry.Vert, -5, 5),
                        CurrentLapTime = telemetry.LapTime > 0 ? telemetry.LapTime : null,
                        BestLapTime = telemetry.LapBestTime > 0 ? telemetry.LapBestTime : null,
                        LastLapTime = telemetry.LapLastTime > 0 ? telemetry.LapLastTime : null,
                        EstimatedLapTime = telemetry.EstLapTime > 0 ? telemetry.EstLapTime : null,
                        LapCount = telemetry.LapCount,
                        BestLapNumber = telemetry.LapBestLap
                    },

                    // Environment data
                    EnvironmentData = new EnvironmentData
                    {
                        RollAngle = telemetry.Roll,
                        PitchAngle = telemetry.Pitch,
                        YawAngle = telemetry.Yaw,
                        ForceFeedbackIntensity = Clamp(telemetry.Ffb, 0, 1),
                        // Track conditions and weather are in separate iRacing packets
                        TrackTemperature = null,
                        AmbientTemperature = null
                    },

                    // Set timestamp to now (iRacing doesn't provide precise wall-clock time in telemetry)
                    Timestamp = DateTime.UtcNow,
                    ReceivedAt = DateTime.UtcNow
                };

                IncrementSuccessCount();
                return unifiedData;
            }
            catch (Exception ex)
            {
                RecordParsingError($"Parsing exception: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Parses iRacing header from raw packet data.
        /// </summary>
        private IracingHeader ParseHeader(byte[] data)
        {
            GCHandle handle = GCHandle.Alloc(data, GCHandleType.Pinned);
            try
            {
                return (IracingHeader)Marshal.PtrToStructure(handle.AddrOfPinnedObject(), typeof(IracingHeader))!;
            }
            finally
            {
                handle.Free();
            }
        }

        /// <summary>
        /// Validates iRacing header for correctness.
        /// </summary>
        private bool ValidateHeader(IracingHeader header)
        {
            // Version check - iRacing protocol version
            if (header.Ver < 1)
            {
                RecordParsingError($"Invalid header version: {header.Ver}");
                return false;
            }

            // Session time validation
            if (header.SessionTime < IRAC_SESSION_TIME_INVALID)
            {
                RecordParsingError($"Invalid session time: {header.SessionTime}");
                return false;
            }

            return true;
        }

        /// <summary>
        /// Parses iRacing telemetry data from packet payload.
        /// </summary>
        private IracingTelemetry ParseTelemetry(byte[] data, int offset)
        {
            // Create buffer for telemetry structure
            byte[] telemetryBuffer = new byte[Marshal.SizeOf(typeof(IracingTelemetry))];
            
            // Copy relevant bytes from data
            int copySize = Math.Min(telemetryBuffer.Length, data.Length - offset);
            Array.Copy(data, offset, telemetryBuffer, 0, copySize);

            // Marshal bytes to structure
            GCHandle handle = GCHandle.Alloc(telemetryBuffer, GCHandleType.Pinned);
            try
            {
                return (IracingTelemetry)Marshal.PtrToStructure(handle.AddrOfPinnedObject(), typeof(IracingTelemetry))!;
            }
            finally
            {
                handle.Free();
            }
        }

        /// <summary>
        /// Parses tire data from iRacing telemetry (4 tires: FL, FR, BL, BR).
        /// </summary>
        private TireData ParseTireData(IracingTelemetry telemetry)
        {
            // Tire positions: 0=FL, 1=FR, 2=BL, 3=BR
            return new TireData
            {
                FrontLeft = CreateTireInfo(telemetry, 0),
                FrontRight = CreateTireInfo(telemetry, 1),
                BackLeft = CreateTireInfo(telemetry, 2),
                BackRight = CreateTireInfo(telemetry, 3)
            };
        }

        /// <summary>
        /// Creates TireInfo for a single tire.
        /// </summary>
        private TireInfo CreateTireInfo(IracingTelemetry telemetry, int tireIndex)
        {
            return new TireInfo
            {
                Temperature = Clamp(telemetry.TireTemp[tireIndex], -50, 150),
                Wear = Clamp(telemetry.TireWear[tireIndex], 0, 1),
                Pressure = Math.Max(telemetry.TirePressure[tireIndex], 0),
                Load = Math.Max(telemetry.TireLoad[tireIndex], 0),
                SuspensionTravel = telemetry.SuspensionTravel[tireIndex],
                SuspensionVelocity = telemetry.SuspensionVelocity[tireIndex]
            };
        }

        /// <summary>
        /// Maps iRacing gear value to standard gear representation.
        /// iRacing: -1 = Reverse, 0 = Neutral, 1-N = Forward gears
        /// </summary>
        private int MapGear(float gearValue)
        {
            int gear = (int)gearValue;
            if (gear == IRAC_GEAR_REVERSE) return -1;
            if (gear == IRAC_GEAR_NEUTRAL) return 0;
            return Math.Max(gear, 1);
        }

        /// <summary>
        /// Maps iRacing session status to SessionStatus enum.
        /// </summary>
        private string MapSessionStatus(int status)
        {
            // iRacing status enum values
            return status switch
            {
                0 => "IncidentBlack", // Black flag
                1 => "Disqualified",
                2 => "Finished",
                3 => "InProgress",
                4 => "NotInSession",
                5 => "NoData",
                _ => "Unknown"
            };
        }

        /// <summary>
        /// Converts speed from m/s to km/h.
        /// </summary>
        private float ConvertMsToKmh(float msPerSec)
        {
            return msPerSec * 3.6f;
        }

        /// <summary>
        /// Clamps value between min and max bounds.
        /// </summary>
        private float Clamp(float value, float min, float max)
        {
            return Math.Max(min, Math.Min(max, value));
        }

        /// <summary>
        /// Records parsing errors for debugging and telemetry.
        /// </summary>
        private void RecordParsingError(string error)
        {
            System.Console.WriteLine($"[iRacing Parser] {error}");
        }

        /// <summary>
        /// Increments successful parse counter for statistics.
        /// </summary>
        private void IncrementSuccessCount()
        {
            // TODO: Update telemetry statistics
        }
    }
}
