import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { HeroCard } from '@/components/dashboard/HeroCard';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { TaskRow } from '@/components/dashboard/TaskRow';
import { ScheduleItem } from '@/components/dashboard/ScheduleItem';
import { Card } from '@/components/ui/Card';
import { useAppContext } from '@/context/AppContext';

export default function HomeScreen() {
  const {
    user,
    tasks,
    todaySchedule,
    studyBlocks,
    notifActive,
    proactiveAlertDismissed,
    deadlineAdded,
    toggleTask,
    dismissProactiveAlert,
    setActiveChatFlow,
  } = useAppContext();

  const handleAlertTap = () => {
    setActiveChatFlow('proactive');
    router.push('/(tabs)/chat');
  };

  const visibleTasks = tasks.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <HeroCard
          name={user.name}
          dateLabel="Friday, Mar 6"
          weekLabel="Week 1"
        />

        {/* Proactive alert */}
        {!proactiveAlertDismissed && (
          <AlertCard
            badge="🎯 Opportunity"
            title="Informatics Application Opens Monday"
            body="Deadline: Friday, Mar 20 · Only 2 cycles per year"
            extraBadge={deadlineAdded ? '📅 Added to your calendar' : undefined}
            onDismiss={dismissProactiveAlert}
            onTap={handleAlertTap}
          />
        )}

        {/* Daily summary */}
        <Card>
          <Text style={styles.cardTitle}>Quarter kickoff! 🚀</Text>
          <Text style={styles.cardBody}>
            Welcome to your first quarter at UW! You're pre-major targeting{' '}
            {user.targetMajor}. I've loaded your syllabi — 14 assignments, 3
            exams, and 2 projects are on your radar.
          </Text>
          {notifActive && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                📱 Daily 7:30am summaries active
              </Text>
            </View>
          )}
        </Card>

        {/* Tasks + Schedule row */}
        <View style={styles.row}>
          {/* Tasks */}
          <Card style={styles.halfCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>To do today</Text>
              <Text
                style={styles.seeAll}
                onPress={() => router.push('/(tabs)/tasks')}
              >
                See all →
              </Text>
            </View>
            {visibleTasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={toggleTask} />
            ))}
          </Card>

          {/* Schedule */}
          <Card style={styles.halfCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Today's schedule</Text>
              <Text
                style={styles.seeAll}
                onPress={() => router.push('/(tabs)/plan')}
              >
                See all →
              </Text>
            </View>
            {todaySchedule.map((block) => (
              <ScheduleItem key={block.id} block={block} />
            ))}
          </Card>
        </View>

        {/* Study blocks (appear after planning chat) */}
        {studyBlocks.length > 0 && (
          <Card>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Study blocks</Text>
              <Text
                style={styles.seeAll}
                onPress={() => router.push('/(tabs)/plan')}
              >
                Edit →
              </Text>
            </View>
            {studyBlocks.map((block) => (
              <ScheduleItem key={block.id} block={block} showDay />
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  cardBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    lineHeight: FontSizes.base * 1.6,
  },
  seeAll: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
  notifBadge: {
    marginTop: 10,
    backgroundColor: Colors.accentGreen,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  notifBadgeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.accentTeal,
  },
});
