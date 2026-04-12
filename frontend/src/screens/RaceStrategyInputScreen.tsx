import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@redux/store';
import { setActiveStrategy, setCalculating, setError } from '@redux/slices/strategySlice';
import { useRaceData } from '@hooks/useRaceData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type RaceStrategyInputScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'RaceStrategy'
>;

/**
 * Race Strategy Input Screen
 * 
 * Comprehensive form for:
 * - Viewing current telemetry
 * - Configuring race parameters
 * - Setting vehicle specs
 * - Adjusting weather conditions
 * - Importing historical data
 * - Calculating optimal strategy
 */
export const RaceStrategyInputScreen: React.FC<RaceStrategyInputScreenProps> =
  ({ navigation }) => {
    const dispatch = useAppDispatch();
    const { buildStrategyInput, getTelemetrySummary, hasMinimumData } = useRaceData();
    const strategy = useAppSelector((state) => state.strategy);
    const telemetry = useAppSelector((state) => state.telemetry);

    // Form state
    const [totalLaps, setTotalLaps] = useState('100');
    const [currentLap, setCurrentLap] = useState('1');
    const [fuelCapacity, setFuelCapacity] = useState('110');
    const [estimatedTireLife, setEstimatedTireLife] = useState('50');
    const [driverSkill, setDriverSkill] = useState<'conservative' | 'intermediate' | 'aggressive'>('intermediate');
    const [weatherCondition, setWeatherCondition] = useState<'clear' | 'light_rain' | 'heavy_rain'>('clear');
    const [trackTemp, setTrackTemp] = useState('50');
    const [safetyMargin, setSafetyMargin] = useState('1.5');

    const telemetrySummary = getTelemetrySummary();
    const canCalculate = hasMinimumData();

    /**
     * Handle strategy calculation
     */
    const handleCalculateStrategy = async () => {
      if (!canCalculate) {
        dispatch(setError('Telemetry connection required'));
        return;
      }

      dispatch(setCalculating(true));

      try {
        // Build strategy input from form
        const strategyInput = buildStrategyInput({
          totalLaps: parseInt(totalLaps, 10),
          currentLap: parseInt(currentLap, 10),
          vehicleSpecs: {
            fuelCapacity: parseFloat(fuelCapacity),
            maxFuelPerStop: parseFloat(fuelCapacity) * 0.95,
            tireCompound: 'medium',
            estimatedTireLife: parseInt(estimatedTireLife, 10),
            currentFuelLevel: telemetrySummary.currentFuel,
            currentLap: telemetrySummary.currentLap,
            currentTireWearPercent: telemetrySummary.tireWear.rearLeft,
          },
          weather: {
            ambientTemperatureCelsius: 22,
            trackTemperatureCelsius: parseFloat(trackTemp),
            condition: weatherCondition,
            fuelMultiplier: 1.0,
            tireWearMultiplier: 1.0,
            lapTimeMultiplier: 1.0,
            expectedChange: 'stable',
          },
          driverSkill,
          safetyMarginFuel: parseFloat(safetyMargin),
        });

        // Call backend API (Phase 6)
        const response = await fetch('http://localhost:3001/api/strategy/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(strategyInput),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate strategy');
        }

        const result = await response.json();
        dispatch(setActiveStrategy(result));

        // Navigate to strategy visualization
        navigation.navigate('StrategyResult');
      } catch (error) {
        dispatch(setError(error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        dispatch(setCalculating(false));
      }
    };

    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <Text style={styles.title}>Race Strategy Calculator</Text>

          {/* Telemetry Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Telemetry Status</Text>
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>
                Connection: {telemetry.isConnected ? '✅ Connected' : '❌ Not Connected'}
              </Text>
              <Text style={styles.statusText}>
                Session Active: {telemetrySummary.sessionActive ? '✅ Yes' : '❌ No'}
              </Text>
              <Text style={styles.statusText}>
                Current Lap: {telemetrySummary.currentLap}
              </Text>
              <Text style={styles.statusText}>
                Fuel Level: {telemetrySummary.currentFuel.toFixed(1)}L
              </Text>
              <Text style={styles.statusText}>
                Speed: {telemetrySummary.currentSpeed.toFixed(0)} km/h
              </Text>
            </View>
          </View>

          {/* Race Parameters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏁 Race Parameters</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Total Race Laps</Text>
              <TextInput
                style={styles.input}
                value={totalLaps}
                onChangeText={setTotalLaps}
                keyboardType="number-pad"
                placeholder="100"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Current Lap</Text>
              <TextInput
                style={styles.input}
                value={currentLap}
                onChangeText={setCurrentLap}
                keyboardType="number-pad"
                placeholder="1"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Driver Skill Level</Text>
              <View style={styles.buttonGroup}>
                {(['conservative', 'intermediate', 'aggressive'] as const).map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    style={[
                      styles.buttonOption,
                      driverSkill === skill && styles.buttonOptionActive,
                    ]}
                    onPress={() => setDriverSkill(skill)}
                  >
                    <Text
                      style={[
                        styles.buttonOptionText,
                        driverSkill === skill && styles.buttonOptionTextActive,
                      ]}
                    >
                      {skill.charAt(0).toUpperCase() + skill.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Vehicle Specs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏎️ Vehicle Specifications</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Fuel Tank Capacity (L)</Text>
              <TextInput
                style={styles.input}
                value={fuelCapacity}
                onChangeText={setFuelCapacity}
                keyboardType="decimal-pad"
                placeholder="110"
              />
              <Text style={styles.hint}>Typical F1 capacity: 110L</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Estimated Tire Life (laps)</Text>
              <TextInput
                style={styles.input}
                value={estimatedTireLife}
                onChangeText={setEstimatedTireLife}
                keyboardType="number-pad"
                placeholder="50"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Safety Margin (L)</Text>
              <TextInput
                style={styles.input}
                value={safetyMargin}
                onChangeText={setSafetyMargin}
                keyboardType="decimal-pad"
                placeholder="1.5"
              />
              <Text style={styles.hint}>Reserve fuel to avoid DNF</Text>
            </View>
          </View>

          {/* Weather Conditions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>☀️ Weather Conditions</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Current Condition</Text>
              <View style={styles.buttonGroup}>
                {(['clear', 'light_rain', 'heavy_rain'] as const).map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={[
                      styles.buttonOption,
                      weatherCondition === condition && styles.buttonOptionActive,
                    ]}
                    onPress={() => setWeatherCondition(condition)}
                  >
                    <Text
                      style={[
                        styles.buttonOptionText,
                        weatherCondition === condition && styles.buttonOptionTextActive,
                      ]}
                    >
                      {condition === 'clear'
                        ? '☀️ Clear'
                        : condition === 'light_rain'
                          ? '🌧️ Light Rain'
                          : '⛈️ Heavy Rain'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Track Temperature (°C)</Text>
              <TextInput
                style={styles.input}
                value={trackTemp}
                onChangeText={setTrackTemp}
                keyboardType="number-pad"
                placeholder="50"
              />
            </View>
          </View>

          {/* Error Display */}
          {strategy.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {strategy.error}</Text>
            </View>
          )}

          {/* Calculate Button */}
          <TouchableOpacity
            style={[
              styles.calculateButton,
              (!canCalculate || strategy.isCalculating) && styles.calculateButtonDisabled,
            ]}
            onPress={handleCalculateStrategy}
            disabled={!canCalculate || strategy.isCalculating}
          >
            {strategy.isCalculating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.calculateButtonText}>📊 Calculate Strategy</Text>
            )}
          </TouchableOpacity>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 How it works</Text>
            <Text style={styles.infoText}>
              1. Configure your race parameters above{'\n'}2. Press "Calculate Strategy"{'\n'}3. View optimized pit sequences
            </Text>
          </View>

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: 12,
  },
  statusBox: {
    backgroundColor: '#1a1a1a',
    paddi: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#00d4ff',
  },
  statusText: {
    color: '#e0e0e0',
    fontSize: 14,
    marginVertical: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#00d4ff',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  buttonOption: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#555',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  buttonOptionActive: {
    borderColor: '#00d4ff',
    backgroundColor: '#00d4ff',
  },
  buttonOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },
  buttonOptionTextActive: {
    color: '#000',
  },
  errorBox: {
    backgroundColor: '#4a1a1a',
    borderLeftWidth: 4,
    borderLeftColor: '#ff3344',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff8899',
    fontSize: 14,
  },
  calculateButton: {
    backgroundColor: '#00d4ff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  calculateButtonDisabled: {
    opacity: 0.5,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  infoBox: {
    backgroundColor: '#1a3a3a',
    borderLeftWidth: 4,
    borderLeftColor: '#00d4ff',
    padding: 12,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#b0d0d0',
    lineHeight: 20,
  },
});
