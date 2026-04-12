/**
 * Fuel Strategy Screen
 *
 * Comprehensive fuel analysis and pit strategy planning interface
 * Displays consumption trends, predictions, and recommended pit windows
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { useFuelStrategy } from '../hooks/useFuelStrategy';
import {
  updateMetrics,
  recordLapConsumption,
  setTrend,
  addAlert,
} from '../redux/slices/fuelStrategySlice';
import { getFuelStatusColor } from '../services/FuelCalculator';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  SHADOWS,
  COMMON_STYLES,
} from '../utils/theme';
import {
  StyledCard,
  MetricDisplay,
  SectionHeader,
  Divider,
  AlertBox,
  StatusIndicator,
} from '../components/StyledComponents';

const { width } = Dimensions.get('window');

interface FuelStrategyScreenProps {
  navigation?: any;
}

export const FuelStrategyScreen: React.FC<FuelStrategyScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const fuelStrategy = useAppSelector((state) => state.fuelStrategy);
  const telemetry = useAppSelector((state) => state.telemetry);
  const session = useAppSelector((state) => state.session);

  // Use the fuel strategy hook for calculations
  const { metrics, strategy, trend, conservative, pitImpact, isCalculating, error } = useFuelStrategy({
    totalLaps: 15,
    safetyMargin: 1.5,
  });

  // Sync hook results to Redux
  useEffect(() => {
    if (metrics && strategy) {
      dispatch(updateMetrics({ metrics, strategy }));
      dispatch(setTrend(trend));
    }
  }, [metrics, strategy, trend, dispatch]);

  // Alert on status changes
  useEffect(() => {
    if (fuelStrategy.previousStatus !== fuelStrategy.status && fuelStrategy.status !== 'unknown') {
      const severityMap = {
        safe: 'info',
        warning: 'warning',
        danger: 'critical',
        unknown: 'info',
      };

      dispatch(
        addAlert({
          type: 'fuel_low',
          message: `Fuel status: ${fuelStrategy.status.toUpperCase()}`,
          severity: severityMap[fuelStrategy.status] as any,
        })
      );
    }
  }, [fuelStrategy.status, fuelStrategy.previousStatus, dispatch]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>Waiting for telemetry data...</Text>
      </View>
    );
  }

  const statusColor = getFuelStatusColor(metrics.safetyStatus);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Premium Header */}
      <View style={styles.premiumHeader}>
        <Text style={styles.screenTitle}>⛽ FUEL STRATEGY</Text>
        <Text style={styles.screenSubtitle}>Pit Stop Analysis & Predictions</Text>
      </View>

      {/* Main Status Panel */}
      <View style={styles.mainPanelContainer}>
        <StyledCard variant="accent" title="Fuel Status & Finish Prediction">
          <View style={styles.statusMainContent}>
            <View style={styles.statusIndicatorContainer}>
              <StatusIndicator
                status={metrics.safetyStatus as any}
                label={metrics.safetyStatus.toUpperCase()}
                size="lg"
              />
            </View>

            <Divider variant="accent" spacing="md" />

            <View style={styles.finishPredictionRow}>
              <View>
                <Text style={styles.finishPredictionLabel}>Predicted End Fuel</Text>
                <Text
                  style={[
                    styles.finishPredictionValue,
                    { color: metrics.willFinish ? COLORS.status.success : COLORS.status.danger },
                  ]}
                >
                  {metrics.predictedEndFuel.toFixed(2)}L
                </Text>
              </View>
              <View>
                <Text style={styles.finishPredictionLabel}>Can Finish?</Text>
                <Text
                  style={[
                    styles.finishPredictionValue,
                    { color: metrics.willFinish ? COLORS.status.success : COLORS.status.danger },
                  ]}
                >
                  {metrics.willFinish ? '✓ YES' : '✗ NO'}
                </Text>
              </View>
            </View>
          </View>
        </StyledCard>
      </View>

      {/* Current Fuel Metrics */}
      <View style={styles.sectionContainer}>
        <SectionHeader title="Current Metrics" subtitle="Real-time Fuel Status" />
        <View style={styles.metricsGrid}>
          <MetricDisplay
            label="Current Level"
            value={metrics.currentLevel.toFixed(1)}
            unit="L"
          />
          <MetricDisplay
            label="Tank Capacity"
            value={metrics.capacity.toFixed(1)}
            unit="L"
          />
          <MetricDisplay
            label="Avg Consumption"
            value={metrics.avgConsumption.toFixed(3)}
            unit="L/Lap"
          />
          <MetricDisplay
            label="Consistency"
            value={metrics.consistency.toFixed(3)}
            trend={metrics.consistency < 0.5 ? 'down' : metrics.consistency < 1.0 ? 'stable' : 'up'}
          />
        </View>
      </View>

      {/* Race Predictions */}
      <View style={styles.sectionContainer}>
        <SectionHeader title="Race Predictions" subtitle="Fuel Consumption Forecast" />
        <StyledCard variant="default">
          <View style={styles.predictionContent}>
            <View style={styles.predictionRow}>
              <Text style={styles.predictionLabel}>Remaining Laps</Text>
              <Text style={styles.predictionValue}>{metrics.remainingLaps}</Text>
            </View>

            <View style={styles.predictionRow}>
              <Text style={styles.predictionLabel}>Projected End Fuel</Text>
              <Text style={[styles.predictionValue, { color: statusColor }]}>
                {metrics.predictedEndFuel.toFixed(2)}L
              </Text>
            </View>

            <View style={styles.predictionRow}>
              <Text style={styles.predictionLabel}>Safety Margin</Text>
              <Text style={styles.predictionValue}>{metrics.safetyMargin.toFixed(1)}L</Text>
            </View>

            <Divider variant="light" spacing="md" />

            <View style={styles.predictionRow}>
              <Text style={styles.predictionLabel}>Margin Status</Text>
              <Text style={[styles.predictionValue, { color: statusColor }]}>
                {(metrics.predictedEndFuel - metrics.safetyMargin).toFixed(2)}L
              </Text>
            </View>
          </View>
        </StyledCard>
      </View>

      {/* Pit Strategy */}
      {strategy && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Pit Strategy" subtitle="Stop Count & Fuel Distribution" />
          <StyledCard variant="default">
            <View style={styles.strategyContent}>
              <View style={styles.strategyRow}>
                <Text style={styles.strategyLabel}>Total Pit Stops Needed</Text>
                <Text style={styles.strategyValue}>{strategy.stopCount}</Text>
              </View>
              <View style={styles.strategyRow}>
                <Text style={styles.strategyLabel}>Fuel Per Stop</Text>
                <Text style={styles.strategyValue}>{strategy.fuelPerStop}L</Text>
              </View>
              <View style={styles.strategyRow}>
                <Text style={styles.strategyLabel}>Laps Per Stop</Text>
                <Text style={styles.strategyValue}>{strategy.lapsPerStop}</Text>
              </View>

              <Divider variant="light" spacing="md" />

              {/* Pit Window */}
              <Text style={styles.pitWindowTitle}>Recommended Pit Window</Text>
              <View style={styles.pitWindowContainer}>
                <View style={styles.pitWindowItem}>
                  <Text style={styles.pitWindowLabel}>Earliest</Text>
                  <Text style={styles.pitWindowValue}>Lap {strategy.pitWindow.earliest}</Text>
                </View>
                <View style={styles.pitWindowItemCenter}>
                  <Text style={styles.pitWindowLabel}>Recommended</Text>
                  <Text style={[styles.pitWindowValue, { color: COLORS.accent.cyan }]}>
                    Lap {strategy.pitWindow.recommendedLap}
                  </Text>
                </View>
                <View style={styles.pitWindowItem}>
                  <Text style={styles.pitWindowLabel}>Latest</Text>
                  <Text style={styles.pitWindowValue}>Lap {strategy.pitWindow.latest}</Text>
                </View>
              </View>
            </View>
          </StyledCard>
        </View>
      )}

      {/* Consumption Trend */}
      {trend && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Consumption Trend" subtitle="Fuel Usage Pattern" />
          <StyledCard
            variant={
              trend === 'increasing' ? 'danger' : trend === 'decreasing' ? 'accent' : 'default'
            }
          >
            <View style={styles.trendContent}>
              <View style={styles.trendIndicator}>
                <Text
                  style={[
                    styles.trendArrow,
                    {
                      color:
                        trend === 'increasing'
                          ? COLORS.status.danger
                          : trend === 'decreasing'
                            ? COLORS.status.success
                            : COLORS.text.secondary,
                    },
                  ]}
                >
                  {trend === 'increasing' ? '↑' : trend === 'decreasing' ? '↓' : '→'}
                </Text>
                <Text style={styles.trendText}>
                  Consumption is{' '}
                  {trend === 'increasing'
                    ? 'INCREASING'
                    : trend === 'decreasing'
                      ? 'DECREASING'
                      : 'STABLE'}
                </Text>
              </View>
              {conservative && (
                <>
                  <Divider variant="light" spacing="md" />
                  <View style={styles.conservativeRow}>
                    <Text style={styles.conservativeLabel}>Conservative Estimate</Text>
                    <Text style={styles.conservativeValue}>
                      {conservative.minEndFuel.toFixed(2)}L
                    </Text>
                  </View>
                </>
              )}
            </View>
          </StyledCard>
        </View>
      )}

      {/* Pit Impact Analysis */}
      {pitImpact && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Pit Impact" subtitle="Stop Time & Strategy Assessment" />
          <StyledCard variant="default">
            <View style={styles.impactContent}>
              <View style={styles.impactRow}>
                <Text style={styles.impactLabel}>Pit Stop Cost</Text>
                <Text style={styles.impactValue}>~{pitImpact.lapTimeLoss.toFixed(1)}s</Text>
              </View>

              <Divider variant="light" spacing="md" />

              <View style={styles.impactRow}>
                <Text
                  style={[
                    styles.impactLabel,
                    { color: pitImpact.isFuelIssue ? COLORS.status.danger : COLORS.status.success },
                  ]}
                >
                  Fuel Critical
                </Text>
                <Text
                  style={[
                    styles.impactValue,
                    { color: pitImpact.isFuelIssue ? COLORS.status.danger : COLORS.status.success },
                  ]}
                >
                  {pitImpact.isFuelIssue ? '✗ YES' : '✓ NO'}
                </Text>
              </View>

              <Divider variant="light" spacing="md" />

              <Text style={styles.recommendationText}>{pitImpact.recommendation}</Text>
            </View>
          </StyledCard>
        </View>
      )}

      {/* Active Alerts */}
      {fuelStrategy.alerts.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Active Alerts" subtitle="Strategy Notifications" />
          {fuelStrategy.alerts
            .filter((a) => !a.dismissed)
            .map((alert) => (
              <AlertBox
                key={alert.id}
                type={
                  alert.severity === 'critical'
                    ? 'error'
                    : alert.severity === 'warning'
                      ? 'warning'
                      : 'info'
                }
                message={alert.message}
              />
            ))}
        </View>
      )}

      {/* Bottom Padding */}
      <View style={styles.spacer} />
    </ScrollView>
  );
};

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{
  label: string;
  value: string;
  subtext: string;
  color?: string;
}> = ({ label, value, subtext, color = '#CCCCCC' }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    <Text style={styles.metricSubtext}>{subtext}</Text>
  </View>
);

/**
 * Debug Row Component
 */
const DebugRow: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <View style={styles.debugRow}>
    <Text style={styles.debugLabel}>{label}:</Text>
    <Text style={styles.debugValue}>{String(value)}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    ...COMMON_STYLES.screenContainer,
    paddingTop: 0,
  },

  // Premium Header
  premiumHeader: {
    backgroundColor: COLORS.background.secondary,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border.primary,
  },

  screenTitle: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    letterSpacing: 2,
  },

  screenSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },

  // Main Panel Container
  mainPanelContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },

  statusMainContent: {
    gap: SPACING.lg,
  },

  statusIndicatorContainer: {
    alignItems: 'center',
  },

  finishPredictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  finishPredictionLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: 'bold' as const,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },

  finishPredictionValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    textAlign: 'center',
  },

  // Section Container
  sectionContainer: {
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.xl,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },

  // Prediction Content
  predictionContent: {
    gap: SPACING.lg,
  },

  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  predictionLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500' as const,
  },

  predictionValue: {
    fontSize: 15,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
  },

  // Strategy Content
  strategyContent: {
    gap: SPACING.lg,
  },

  strategyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  strategyLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500' as const,
  },

  strategyValue: {
    fontSize: 15,
    fontWeight: 'bold' as const,
    color: COLORS.accent.cyan,
  },

  // Pit Window
  pitWindowTitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: 'bold' as const,
    letterSpacing: 1,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },

  pitWindowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
  },

  pitWindowItem: {
    alignItems: 'center',
    flex: 1,
  },

  pitWindowItemCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: SPACING.md,
  },

  pitWindowLabel: {
    fontSize: 11,
    color: COLORS.text.tertiary,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },

  pitWindowValue: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
  },

  // Trend Content
  trendContent: {
    gap: SPACING.lg,
  },

  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },

  trendArrow: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },

  trendText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
  },

  conservativeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  conservativeLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500' as const,
  },

  conservativeValue: {
    fontSize: 15,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
  },

  // Impact Content
  impactContent: {
    gap: SPACING.lg,
  },

  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  impactLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500' as const,
  },

  impactValue: {
    fontSize: 15,
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
  },

  recommendationText: {
    fontSize: 13,
    color: COLORS.status.success,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Spacing
  spacer: {
    height: SPACING.xxxl,
  },
});
