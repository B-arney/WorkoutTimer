import { Tabs, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useColorScheme } from '../../components/useColorScheme';
import Colors from '../../constants/Colors';
import { useWorkoutTimer } from '../../hooks/useWorkoutTimer';
import { useTimerSessionStore, useWorkoutDataStore } from '../../stores/workoutStore';
import { Icons } from '../../components/Icons';

function TimerRunner() {
  useWorkoutTimer();
  return null;
}

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const { currentWorkoutId, workoutPlanName, intervals, currentIntervalIndex, isPaused, togglePause, timeLeft } = useTimerSessionStore();
  const isSelectionMode = useWorkoutDataStore((state) => state.isSelectionMode);
  
  const showMiniPlayer = currentWorkoutId !== null && pathname !== '/timer' && !isSelectionMode;
  const currentInterval = intervals[currentIntervalIndex];

  return (
    <>
      <TimerRunner />
      <View className="flex-1 bg-background">
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme].tint,
            headerShown: false,
            tabBarStyle: { display: 'none' },
            animation: 'shift',
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: '',
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="timer"
            options={{
              title: 'Timer',
              headerShown: false,
            }}
          />
        </Tabs>
        
        {showMiniPlayer && currentInterval && (
          <View className="absolute bottom-0 left-0 right-0">
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)', 'black']}
              locations={[0, 0.4, 1]}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 160,
                pointerEvents: 'none',
              }}
            />
            <TouchableOpacity
              onPress={() => router.push('/timer' as any)}
              className="mx-5 mb-5 px-4 py-5 bg-surface rounded-2xl flex-row items-center shadow-md border-2 border-surface-light"
              style={{ elevation: 5 }}
            >
              <View className="flex-1">
                <Text className="text-white text-base font-bold">{currentInterval.name}</Text>
                <Text className="text-text-muted text-xs">{workoutPlanName}</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl font-bold text-primary">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </Text>
                <TouchableOpacity onPress={() => togglePause()} className="p-2">
                  {isPaused ? <Icons.Play className="text-primary fill-primary" size={24} /> : <Icons.Pause className="text-primary fill-primary" size={24} />}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}
