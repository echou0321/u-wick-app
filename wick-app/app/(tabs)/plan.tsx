import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { ScheduleItem } from '@/components/dashboard/ScheduleItem';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAppContext } from '@/context/AppContext';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PlanScreen() {
  const { todaySchedule, studyBlocks, notifActive } = useAppContext();

  // Group study blocks by day
  const blocksByDay: Record<string, typeof studyBlocks> = {};
  for (const block of studyBlocks) {
    const day = block.day ?? 'Other';
    if (!blocksByDay[day]) blocksByDay[day] = [];
    blocksByDay[day].push(block);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Plan</Text>
        {notifActive && (
          <Badge label="📱 Daily texts on" variant="teal" />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's classes */}
        <Card>
          <Text style={styles.sectionTitle}>Today's classes</Text>
          {todaySchedule.map((block) => (
            <ScheduleItem key={block.id} block={block} />
          ))}
        </Card>

        {/* Study blocks */}
        {studyBlocks.length > 0 ? (
          <Card>
            <Text style={styles.sectionTitle}>Study blocks this week</Text>
            {WEEK_DAYS.filter((d) => blocksByDay[d]).map((day) => (
              <View key={day} style={styles.dayGroup}>
                <Text style={styles.dayLabel}>{day}</Text>
                {blocksByDay[day].map((block) => (
                  <ScheduleItem key={block.id} block={block} />
                ))}
              </View>
            ))}
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No study blocks yet</Text>
            <Text style={styles.emptyBody}>
              Chat with Wick to set up your weekly study schedule. I'll fit
              blocks around your classes and commitments.
            </Text>
          </Card>
        )}

        {/* Week overview placeholder */}
        <Card>
          <Text style={styles.sectionTitle}>Week at a glance · Week 2</Text>
          <View style={styles.weekGrid}>
            {WEEK_DAYS.map((day) => {
              const hasBlock = !!blocksByDay[day];
              return (
                <View key={day} style={styles.dayCol}>
                  <Text style={styles.dayLabelSmall}>{day[0]}</Text>
                  <View
                    style={[
                      styles.dayDot,
                      hasBlock && styles.dayDotActive,
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    color: Colors.textPrimary,
  },
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  dayGroup: {
    marginBottom: 8,
  },
  dayLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  emptyBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSizes.base * 1.6,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  dayCol: { alignItems: 'center', gap: 6 },
  dayLabelSmall: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
