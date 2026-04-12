import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '@redux/store';
import { setError } from '@redux/slices/strategySlice';
import type { StrategyDeviation } from '../../../backend/src/services/StrategyMonitor';

interface StrategyMonitorWidgetProps {
  isVisible: boolean;
  deviations: StrategyDeviation[];
  riskLevel: 'stable' | 'elevated' | 'critical';
  onRecalculate?: () => void;
  collapsed?: boolean;
}

/**
 * Strategy Monitor Widget
 * 
 * Displays real-time strategy execution monitoring
 * Shows deviations and triggers recalculation alerts
 */
export const StrategyMonitorWidget: React.FC<StrategyMonitorWidgetProps> = ({
  isVisible,
  deviations,
  riskLevel,
  onRecalculate,
  collapsed = false,
}) => {
  const [expanded, setExpanded] = useState(!collapsed);
  const dispatch = useAppDispatch();

  if (!isVisible) return null;

  const riskColors = {
    stable: '#00cc44',
    elevated: '#ffaa00',
    critical: '#ff4444',
  };

  const severityColors = {
    low: '#88ff88',
    medium: '#ffdd00',
    high: '#ff8800',
    critical: '#ff3344',
  };

  /**
   * Render deviation item
   */
  const renderDeviation = ({ item, index }: { item: StrategyDeviation; index: number }) => (
    <View style={styles.deviationItem} key={index}>
      <View style={styles.deviationHeader}>
        <Text
          style={[styles.deviationType, { color: severityColors[item.severity] }]}
        >
          {item.type.toUpperCase()}
        </Text>
        <Text
          style={[
            styles.deviationSeverity,
            { color: severityColors[item.severity] },
          ]}
        >
          {item.severity.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.deviationMessage}>{item.message}</Text>
      <Text style={styles.deviationLap}>Lap {item.lapNumber}</Text>
    </View>
  );

  if (collapsed && !expanded) {
    return (
      <TouchableOpacity
        style={[styles.collapsedContainer, { borderColor: riskColors[riskLevel] }]}
        onPress={() => setExpanded(true)}
      >
        <Text style={styles.collapsedRiskLevel}>{riskLevel.toUpperCase()}</Text>
        {deviations.length > 0 && (
          <Text style={styles.collapsedDeviationCount}>
            {deviations.length} issue{deviations.length !== 1 ? 's' : ''}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { borderTopColor: riskColors[riskLevel] },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Strategy Monitor</Text>
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.expandToggle}>{expanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <>
          {/* Risk Level Bar */}
          <View style={styles.riskBar}>
            <Text style={styles.riskLabel}>Risk Level:</Text>
            <Text
              style={[
                styles.riskValue,
                { color: riskColors[riskLevel] },
              ]}
            >
              {riskLevel.toUpperCase()}
            </Text>
            <View
              style={[
                styles.riskIndicator,
                { backgroundColor: riskColors[riskLevel] },
              ]}
            />
          </View>

          {/* Deviations List */}
          {deviations.length > 0 ? (
            <View style={styles.deviationsContainer}>
              <Text style={styles.deviationsTitle}>
                Issues Detected ({deviations.length})
              </Text>
              <FlatList
                data={deviations.slice(-5)} // Show last 5
                renderItem={renderDeviation}
                keyExtractor={(item, idx) => `${idx}-${item.type}`}
                scrollEnabled={false}
              />
            </View>
          ) : (
            <View style={styles.clearStatus}>
              <Text style={styles.clearStatusText}>✅ No deviations detected</Text>
            </View>
          )}

          {/* Recalculation Needed Alert */}
          {deviations.some((d) => d.recalculationNeeded) && (
            <TouchableOpacity
              style={styles.recalculateAlert}
              onPress={onRecalculate}
            >
              <Text style={styles.recalculateAlertText}>
                ⚠️ Recalculation Recommended
              </Text>
              <Text style={styles.recalculateButton}>TAP TO RECALCULATE</Text>
            </TouchableOpacity>
          )}

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Deviations</Text>
              <Text style={styles.statValue}>{deviations.length}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Critical</Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: deviations.filter((d) => d.severity === 'critical')
                      .length > 0
                      ? '#ff3344'
                      : '#00cc44',
                  },
                ]}
              >
                {deviations.filter((d) => d.severity === 'critical').length}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>High Priority</Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: deviations.filter((d) => d.severity === 'high')
                      .length > 0
                      ? '#ff8800'
                      : '#00cc44',
                  },
                ]}
              >
                {deviations.filter((d) => d.severity === 'high').length}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 3,
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4ff',
  },
  expandToggle: {
    fontSize: 12,
    color: '#666',
  },
  riskBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0d0d0d',
  },
  riskLabel: {
    fontSize: 12,
    color: '#888',
    marginRight: 8,
  },
  riskValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  riskIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deviationsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 300,
  },
  deviationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  deviationItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff8800',
  },
  deviationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  deviationType: {
    fontSize: 11,
    fontWeight: '600',
  },
  deviationSeverity: {
    fontSize: 10,
    fontWeight: '700',
  },
  deviationMessage: {
    fontSize: 12,
    color: '#d0d0d0',
    marginBottom: 4,
    lineHeight: 16,
  },
  deviationLap: {
    fontSize: 10,
    color: '#666',
  },
  clearStatus: {
    backgroundColor: '#0d2a0d',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#00cc44',
  },
  clearStatusText: {
    fontSize: 12,
    color: '#00ff88',
    fontWeight: '500',
  },
  recalculateAlert: {
    backgroundColor: '#3a2a0a',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#ffaa00',
  },
  recalculateAlertText: {
    fontSize: 12,
    color: '#ffdd88',
    fontWeight: '600',
    marginBottom: 8,
  },
  recalculateButton: {
    fontSize: 11,
    color: '#ffaa00',
    fontWeight: '700',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  collapsedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 8,
    backgroundColor: '#1a1a1a',
  },
  collapsedRiskLevel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00d4ff',
  },
  collapsedDeviationCount: {
    fontSize: 10,
    color: '#888',
  },
});
