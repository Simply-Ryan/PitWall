import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '@redux/store';
import { setActiveScenario } from '@redux/slices/strategySlice';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import type { StrategyScenario } from '@types/raceStrategy';

type RaceStrategyScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Dashboard'
>;

/**
 * Race Strategy Visualization Screen
 * 
 * Displays calculated strategy with pit sequences, scenarios, and risk analysis
 */
export const RaceStrategyScreen: React.FC<RaceStrategyScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const strategy = useAppSelector((state) => state.strategy);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [showRiskDetails, setShowRiskDetails] = useState(false);

  const activeStrategy = strategy.activeStrategy;
  if (!activeStrategy?.output) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No strategy calculated. Go back and calculate first.</Text>
      </View>
    );
  }

  const scenarios = activeStrategy.output.scenarios;
  const selectedScenario = scenarios[selectedScenarioIndex];
  const riskAssessment = activeStrategy.output.riskAssessment;

  const scenarioLabels = ['🟢 Best Case', '🟡 Likely', '🔴 Worst Case'];
  const scenarioColors = ['#00cc44', '#ffaa00', '#ff4444'];

  /**
   * Render pit stop details
   */
  const renderPitStop = (pit: any, index: number) => (
    <View key={pit.id} style={styles.pitStopCard}>
      <Text style={styles.pitStopTitle}>
        Pit Stop #{index + 1} - Lap {pit.lapNumber}
      </Text>
      <View style={styles.pitStopDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>⛽ Fuel</Text>
          <Text style={styles.detailValue}>{pit.fuelAmount.toFixed(1)}L</Text>
        </View>
        {pit.tireChange && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🔄 Tires</Text>
            <Text style={styles.detailValue}>{pit.tireCompound?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>⏱️ Loss</Text>
          <Text style={styles.detailValue}>{pit.estimatedLossSeconds.toFixed(1)}s</Text>
        </View>
        <Text style={styles.rationale}>{pit.rationale}</Text>
      </View>
    </View>
  );

  /**
   * Render risk assessment
   */
  const renderRiskAssessment = () => (
    <View style={styles.riskBox}>
      <View style={styles.riskHeader}>
        <Text style={styles.riskTitle}>📊 Risk Assessment</Text>
        <Switch
          value={showRiskDetails}
          onValueChange={setShowRiskDetails}
          trackColor={{ true: '#00d4ff', false: '#555' }}
        />
      </View>

      {showRiskDetails && (
        <View style={styles.riskDetails}>
          <View style={styles.riskItem}>
            <Text style={styles.riskLabel}>DNF Probability</Text>
            <View style={styles.riskMeter}>
              <View
                style={[
                  styles.riskFill,
                  {
                    width: `${Math.min(riskAssessment?.dnfProbability || 0) * 100}%`,
                    backgroundColor:
                      (riskAssessment?.dnfProbability || 0) < 5
                        ? '#00cc44'
                        : (riskAssessment?.dnfProbability || 0) < 15
                          ? '#ffaa00'
                          : '#ff4444',
                  },
                ]}
              />
            </View>
            <Text style={styles.riskValue}>
              {((riskAssessment?.dnfProbability || 0) * 100).toFixed(1)}%
            </Text>
          </View>

          <View style={styles.riskFactors}>
            <Text style={styles.factorsTitle}>Risk Factors:</Text>
            <Text style={styles.factorItem}>
              • Fuel: {riskAssessment?.fuelRisk || 'low'}
            </Text>
            <Text style={styles.factorItem}>
              • Tires: {riskAssessment?.tireRisk || 'medium'}
            </Text>
            <Text style={styles.factorItem}>
              • Pit Timing: {riskAssessment?.pitTimingRisk || 'medium'}
            </Text>
            <Text style={styles.factorItem}>
              • Weather: {riskAssessment?.weatherRisk || 'low'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  /**
   * Render fuel and tire margins
   */
  const renderMargins = () => (
    <View style={styles.marginBox}>
      <Text style={styles.marginTitle}>📈 Performance Margins</Text>

      <View style={styles.marginItem}>
        <Text style={styles.marginLabel}>Fuel Margin at Finish</Text>
        <View style={styles.marginBar}>
          <View
            style={[
              styles.marginFill,
              {
                width: `${Math.max(0, Math.min(100, (selectedScenario.fuelMarginLiters / 10) * 100))}%`,
                backgroundColor: selectedScenario.fuelMarginLiters > 5 ? '#00cc44' : '#ffaa00',
              },
            ]}
          />
        </View>
        <Text style={styles.marginValue}>{selectedScenario.fuelMarginLiters.toFixed(1)}L</Text>
      </View>

      <View style={styles.marginItem}>
        <Text style={styles.marginLabel}>Tire Margin</Text>
        <View style={styles.marginBar}>
          <View
            style={[
              styles.marginFill,
              {
                width: `${Math.max(0, Math.min(100, selectedScenario.tireMarginLaps))}%`,
                backgroundColor: selectedScenario.tireMarginLaps > 5 ? '#00cc44' : '#ffaa00',
              },
            ]}
          />
        </View>
        <Text style={styles.marginValue}>{selectedScenario.tireMarginLaps.toFixed(1)} laps</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Race Strategy</Text>

        {/* Scenario Selector */}
        <View style={styles.scenarioSelector}>
          {scenarios.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.scenarioButton,
                selectedScenarioIndex === index && styles.scenarioButtonActive,
                { borderBottomColor: scenarioColors[index] },
              ]}
              onPress={() => setSelectedScenarioIndex(index)}
            >
              <Text
                style={[
                  styles.scenarioButtonText,
                  selectedScenarioIndex === index && styles.scenarioButtonTextActive,
                ]}
              >
                {scenarioLabels[index]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Strategy Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>{scenarioLabels[selectedScenarioIndex]}</Text>
          <View style={styles.riskLevel}>
            <Text style={styles.riskLevelText}>Risk Level:</Text>
            <Text
              style={[
                styles.riskLevelValue,
                {
                  color:
                    selectedScenario.riskLevel === 'low'
                      ? '#00cc44'
                      : selectedScenario.riskLevel === 'medium'
                        ? '#ffaa00'
                        : '#ff4444',
                },
              ]}
            >
              {selectedScenario.riskLevel.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.strategyDescription}>{selectedScenario.description}</Text>
        </View>

        {/* Pit Sequence */}
        <View style={styles.pitSequenceBox}>
          <Text style={styles.sectionTitle}>🏁 Pit Sequence</Text>
          <Text style={styles.pitCount}>
            {selectedScenario.pitSequence.length} stop
            {selectedScenario.pitSequence.length !== 1 ? 's' : ''}
          </Text>
          {selectedScenario.pitSequence.map((pit, index) =>
            renderPitStop(pit, index),
          )}
        </View>

        {/* Margins */}
        {renderMargins()}

        {/* Risk Assessment */}
        {renderRiskAssessment()}

        {/* Assumptions */}
        <View style={styles.assumptionsBox}>
          <Text style={styles.sectionTitle}>💡 Assumptions</Text>
          <View style={styles.assumptionsList}>
            {activeStrategy.input.assumptions && (
              <>
                <Text style={styles.assumptionItem}>
                  • Fuel per lap: {activeStrategy.input.assumptions.fuelConsumptionPerLap}L
                </Text>
                <Text style={styles.assumptionItem}>
                  • Tire wear: {activeStrategy.input.assumptions.tireWearPerLap}%/lap
                </Text>
                <Text style={styles.assumptionItem}>
                  • Driver consistency: {activeStrategy.input.assumptions.driverConsistency}
                </Text>
                <Text style={styles.assumptionItem}>
                  • Weather: {activeStrategy.input.assumptions.weatherExpected}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('RaceStrategy')}
          >
            <Text style={styles.buttonText}>📝 Adjust</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonPrimary}>
            <Text style={styles.buttonPrimaryText}>📊 Execute Strategy</Text>
          </TouchableOpacity>
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
    marginBottom: 20,
    marginTop: 12,
  },
  errorText: {
    color: '#ff8899',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  scenarioSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  scenarioButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  scenarioButtonActive: {
    borderBottomColor: '#00d4ff',
  },
  scenarioButtonText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  scenarioButtonTextActive: {
    color: '#00d4ff',
  },
  summaryBox: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00d4ff',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 12,
  },
  riskLevel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  riskLevelText: {
    color: '#aaa',
    fontSize: 14,
  },
  riskLevelValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  strategyDescription: {
    color: '#d0d0d0',
    fontSize: 14,
    lineHeight: 20,
  },
  pitSequenceBox: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: 12,
  },
  pitCount: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  pitStopCard: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffaa00',
  },
  pitStopTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  pitStopDetails: {
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderRadius: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingVertical: 4,
  },
  detailLabel: {
    color: '#888',
    fontSize: 12,
  },
  detailValue: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '600',
  },
  rationale: {
    color: '#b0b0b0',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  marginBox: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  marginTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: 16,
  },
  marginItem: {
    marginBottom: 16,
  },
  marginLabel: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 6,
  },
  marginBar: {
    height: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  marginFill: {
    height: '100%',
    borderRadius: 4,
  },
  marginValue: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  riskBox: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d4ff',
  },
  riskDetails: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
  },
  riskItem: {
    marginBottom: 16,
  },
  riskLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  riskMeter: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  riskFill: {
    height: '100%',
  },
  riskValue: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  riskFactors: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  factorsTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  factorItem: {
    color: '#b0b0b0',
    fontSize: 12,
    marginBottom: 4,
  },
  assumptionsBox: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  assumptionsList: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
  },
  assumptionItem: {
    color: '#b0d0d0',
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#00d4ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonPrimary: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#00d4ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});
