import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useTheme } from '../context/ThemeContext';
import { Medicine, medicineAPI, StreakData, MonthlyStreakHistory } from '../services/api';
import { WeeklyAdherenceSummary } from './WeeklyAdherenceSummary';
import { StreakCounter } from './StreakCounter';
import { JumpToTodayButton } from './JumpToTodayButton';
import { Card, CardHeader } from './UI';
import { 
  generateCourseBandMarkings, 
  mergeCalendarMarkings,
  EnhancedMarkedDates 
} from '../utils/courseBands';
import {
  generateStreakChainMarkings,
  mergeStreakMarkings
} from '../utils/streakChains';
import { 
  getCurrentDateInfo, 
  shouldShowJumpButton, 
  createJumpToTodayNavigation,
  extractYearMonth 
} from '../utils/calendarNavigation';

interface MedicineCalendarProps {
  medicines: Medicine[];
  adherenceData?: { [date: string]: { status: 'taken' | 'missed' | 'pending' } };
  onDatePress?: (date: DateData) => void;
  showSummary?: boolean;
}

export function MedicineCalendar({ 
  medicines, 
  adherenceData = {}, 
  onDatePress,
  showSummary = true,
}: MedicineCalendarProps) {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = getCurrentDateInfo();
    return { year: today.year, month: today.month };
  });

  // Streak data state
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [monthlyStreakHistory, setMonthlyStreakHistory] = useState<MonthlyStreakHistory | null>(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [streakError, setStreakError] = useState<string | null>(null);

  // Initialize with today's date
  useEffect(() => {
    const today = getCurrentDateInfo();
    setSelectedDate(today.dateString);
  }, []);

  // Fetch streak data
  const fetchStreakData = useCallback(async () => {
    try {
      setStreakLoading(true);
      setStreakError(null);
      
      const [generalStreakData, monthlyData] = await Promise.all([
        medicineAPI.getStreakData(),
        medicineAPI.getMonthlyStreakHistory(currentMonth.year, currentMonth.month)
      ]);
      
      setStreakData(generalStreakData);
      setMonthlyStreakHistory(monthlyData);
    } catch (error) {
      console.warn('Failed to fetch streak data:', error);
      setStreakError(error instanceof Error ? error.message : 'Failed to load streak data');
      // Set fallback data to prevent UI breaks
      setStreakData({
        currentStreak: 0,
        streakHistory: [],
        milestones: [],
        nextMilestone: null,
        lastCalculated: new Date().toISOString()
      });
      setMonthlyStreakHistory({
        year: currentMonth.year,
        month: currentMonth.month,
        dailyAdherence: [],
        monthlyStreaks: [],
        currentStreak: 0,
        milestones: [],
        nextMilestone: null
      });
    } finally {
      setStreakLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  // Generate course band markings for the current month
  const courseBandMarkings = useMemo(() => {
    return generateCourseBandMarkings(medicines, currentMonth);
  }, [medicines, currentMonth]);

  // Generate adherence dot markings
  const adherenceMarkings = useMemo(() => {
    const markings: { [date: string]: any } = {};
    
    Object.keys(adherenceData).forEach(date => {
      const status = adherenceData[date].status;
      let dotColor = colors.textMuted;
      
      switch (status) {
        case 'taken':
          dotColor = colors.success;
          break;
        case 'missed':
          dotColor = colors.danger;
          break;
        case 'pending':
          dotColor = colors.warning;
          break;
      }
      
      markings[date] = {
        dots: [{ color: dotColor }]
      };
    });
    
    return markings;
  }, [adherenceData, colors]);

  // Generate streak chain markings
  const streakChainMarkings = useMemo(() => {
    if (!monthlyStreakHistory) return {};
    
    return generateStreakChainMarkings(
      monthlyStreakHistory.monthlyStreaks,
      monthlyStreakHistory.dailyAdherence,
      currentMonth
    );
  }, [monthlyStreakHistory, currentMonth]);

  // Merge all markings (course bands + adherence dots + streak chains)
  const calendarMarkings = useMemo(() => {
    let merged = mergeCalendarMarkings(courseBandMarkings, adherenceMarkings);
    merged = mergeStreakMarkings(merged, streakChainMarkings);
    
    // Add selected date marking
    if (selectedDate) {
      merged[selectedDate] = {
        ...merged[selectedDate],
        selected: true,
        selectedColor: colors.primary
      };
    }
    
    return merged;
  }, [courseBandMarkings, adherenceMarkings, streakChainMarkings, selectedDate, colors.primary]);

  // Handle date press
  const handleDatePress = useCallback((date: DateData) => {
    setSelectedDate(date.dateString);
    onDatePress?.(date);
  }, [onDatePress]);

  // Handle month change
  const handleMonthChange = useCallback((month: DateData) => {
    const { year, month: monthNum } = extractYearMonth(month.dateString);
    setCurrentMonth({ year, month: monthNum });
  }, []);

  // Handle jump to today
  const handleJumpToToday = useCallback(() => {
    const todayNav = createJumpToTodayNavigation();
    setCurrentMonth({ year: todayNav.year, month: todayNav.month });
    setSelectedDate(todayNav.dateString);
  }, []);

  // Check if jump button should be visible
  const showJumpButton = shouldShowJumpButton(currentMonth.year, currentMonth.month);

  return (
    <Card variant="elevated" glowColor={colors.primary}>
      <CardHeader 
        title="Medicine Calendar" 
        icon="calendar-outline"
        right={
          <JumpToTodayButton 
            visible={showJumpButton}
            onPress={handleJumpToToday}
          />
        }
      />
      
      <View style={{ padding: 16 }}>
        {/* Weekly Adherence Summary */}
        {showSummary && (
          <WeeklyAdherenceSummary 
            year={currentMonth.year}
            month={currentMonth.month}
          />
        )}

        {/* Streak Counter */}
        {showSummary && !streakLoading && streakData && (
          <StreakCounter
            currentStreak={streakData.currentStreak}
            milestones={streakData.milestones}
            nextMilestone={streakData.nextMilestone}
            motivationalMessage=""
          />
        )}

        {showSummary && streakError && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.danger }]}>
              Streak data temporarily unavailable
            </Text>
          </View>
        )}

        {/* Calendar */}
        <Calendar
          current={`${currentMonth.year}-${currentMonth.month.toString().padStart(2, '0')}-01`}
          onDayPress={handleDatePress}
          onMonthChange={handleMonthChange}
          markingType="multi-period"
          markedDates={calendarMarkings}
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: colors.textMuted,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.textPrimary,
            todayTextColor: colors.primary,
            dayTextColor: colors.textPrimary,
            textDisabledColor: colors.textFaint,
            dotColor: colors.primary,
            selectedDotColor: colors.textPrimary,
            arrowColor: colors.primary,
            monthTextColor: colors.textPrimary,
            indicatorColor: colors.primary,
            textDayFontFamily: 'System',
            textMonthFontFamily: 'System',
            textDayHeaderFontFamily: 'System',
            textDayFontWeight: '400',
            textMonthFontWeight: '600',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
          style={{
            borderRadius: 12,
            backgroundColor: 'transparent',
          }}
        />

        {/* Selected Date Info */}
        {selectedDate && (
          <View style={styles.selectedDateInfo}>
            <Text style={[styles.selectedDateText, { color: colors.textPrimary }]}>
              Selected: {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            
            {/* Show active medicines for selected date */}
            {medicines.filter(med => {
              const selectedDateObj = new Date(selectedDate);
              const startDate = new Date(med.startDate);
              const endDate = med.endDate ? new Date(med.endDate) : null;
              return selectedDateObj >= startDate && (!endDate || selectedDateObj <= endDate);
            }).length > 0 && (
              <View style={styles.activeMedicines}>
                <Text style={[styles.activeMedicinesTitle, { color: colors.textMuted }]}>
                  Active medicines:
                </Text>
                {medicines.filter(med => {
                  const selectedDateObj = new Date(selectedDate);
                  const startDate = new Date(med.startDate);
                  const endDate = med.endDate ? new Date(med.endDate) : null;
                  return selectedDateObj >= startDate && (!endDate || selectedDateObj <= endDate);
                }).map(med => (
                  <View key={med._id} style={styles.medicineItem}>
                    <View 
                      style={[
                        styles.medicineColorDot, 
                        { backgroundColor: med.courseColor || colors.primary }
                      ]} 
                    />
                    <Text style={[styles.medicineName, { color: colors.textPrimary }]}>
                      {med.name} - {med.dosage}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  selectedDateInfo: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  activeMedicines: {
    marginTop: 8,
  },
  activeMedicinesTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  medicineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicineColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  medicineName: {
    fontSize: 12,
    flex: 1,
  },
  errorContainer: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
  },
});