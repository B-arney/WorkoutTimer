import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Animated, Dimensions, Keyboard, PanResponder, Text, TouchableOpacity, View, FlatList, ListRenderItemInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../../components/Icons';
import { useTimerSessionStore, ExerciseInterval } from '../../stores/workoutStore';

import { IntervalRow } from '../../components/IntervalRow';

const { height: screenHeight } = Dimensions.get('window');

const HomeScreen = () => {
  const CLOSED_Y = screenHeight - 180;
  const OPEN_Y = 0;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(CLOSED_Y)).current;
  const currentY = useRef(CLOSED_Y);
  
  useEffect(() => {
    const listener = slideAnim.addListener(({ value }) => {
      currentY.current = value;
    });
    return () => slideAnim.removeListener(listener);
  }, [slideAnim]);

  const openMenu = () => {
    setIsMenuOpen(true);
    Animated.spring(slideAnim, {
      toValue: OPEN_Y,
      useNativeDriver: true,
      damping: 25,
      stiffness: 120,
    }).start();
  };

  const closeMenu = () => {
    Keyboard.dismiss();
    setIsMenuOpen(false);
    Animated.spring(slideAnim, {
      toValue: CLOSED_Y,
      useNativeDriver: true,
      damping: 25,
      stiffness: 120,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isOpen = currentY.current < CLOSED_Y / 2;
        if (!isOpen) { return gestureState.dy < -10; }
        return gestureState.dy > 20;
      },
      onPanResponderGrant: () => {
        slideAnim.extractOffset();
      },
      onPanResponderMove: (evt, gestureState) => {
        slideAnim.setValue(gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        slideAnim.flattenOffset();
        const finalY = currentY.current;
        const velocity = gestureState.vy;

        let targetY;
        if (velocity > 0.5) { 
          targetY = CLOSED_Y;
        } else if (velocity < -0.5) { 
          targetY = OPEN_Y;
        } else {
          targetY = finalY > CLOSED_Y / 2 ? CLOSED_Y : OPEN_Y;
        }

        if (targetY === CLOSED_Y) {
          Keyboard.dismiss();
        }

        setIsMenuOpen(targetY === OPEN_Y);

        Animated.spring(slideAnim, {
          toValue: targetY,
          useNativeDriver: true,
          damping: 25,
          stiffness: 120,
        }).start();
      },
    })
  ).current;

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [OPEN_Y, CLOSED_Y],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  const barOpacity = slideAnim.interpolate({
    inputRange: [CLOSED_Y - 100, CLOSED_Y], 
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const modalOpacity = slideAnim.interpolate({
    inputRange: [OPEN_Y, CLOSED_Y - 100], 
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const [scrollEnabled] = useState(true);
  const router = useRouter();

  const { 
    workoutPlanName,
    intervals, 
    currentIntervalIndex, 
    isPaused, 
    togglePause, 
    skipToNext,
    addRestAfterCurrent,
    resetWorkout,
    updateInterval,
    reorderIntervals,
    updateCurrentIntervalDuration,
    timeLeft,
    setTimeLeft
  } = useTimerSessionStore();
  
  const adjustTimeLeft = setTimeLeft;

  const moveIntervalUp = useCallback((index: number) => {
    if (index <= currentIntervalIndex) return;
    const newIntervals = [...intervals];
    const temp = newIntervals[index];
    newIntervals[index] = newIntervals[index - 1];
    newIntervals[index - 1] = temp;
    reorderIntervals(newIntervals);
    if (index - 1 === currentIntervalIndex) {
      setTimeLeft(newIntervals[currentIntervalIndex].duration);
    }
  }, [intervals, currentIntervalIndex, reorderIntervals, setTimeLeft]);

  const moveIntervalDown = useCallback((index: number) => {
    if (index < currentIntervalIndex || index === intervals.length - 1) return;
    const newIntervals = [...intervals];
    const temp = newIntervals[index];
    newIntervals[index] = newIntervals[index + 1];
    newIntervals[index + 1] = temp;
    reorderIntervals(newIntervals);
    if (index === currentIntervalIndex) {
      setTimeLeft(newIntervals[currentIntervalIndex].duration);
    }
  }, [intervals, currentIntervalIndex, reorderIntervals, setTimeLeft]);

  const currentInterval = intervals[currentIntervalIndex] || null;
  const nextInterval = intervals[currentIntervalIndex + 1] || null;

  const MainTimerAdjuster = useMemo(() => {
    let timerRefLocal: NodeJS.Timeout | null = null;
    let speed = 400;

    return {
      start: (currentTime: number, amount: number, stopCondition: (dur: number) => boolean) => {
        let currentVal = currentTime;
        
        const executeStep = () => {
          updateCurrentIntervalDuration((prevDur: number) => Math.min(3600, Math.max(0, prevDur + amount)));
          adjustTimeLeft((prevTime: number) => Math.min(3600, Math.max(0, prevTime + amount)));
          currentVal += amount;
          currentVal = Math.min(3600, Math.max(0, currentVal));
        };

        executeStep();
        if (stopCondition(currentVal)) return;

        speed = 400;
        
        const tick = () => {
          executeStep();
          if (stopCondition(currentVal)) {
            if (timerRefLocal) clearTimeout(timerRefLocal);
            timerRefLocal = null;
            return;
          }
          speed = Math.max(25, speed * 0.8);
          timerRefLocal = setTimeout(tick, speed);
        };
        timerRefLocal = setTimeout(tick, speed);
      },
      stop: () => {
        if (timerRefLocal) {
          clearTimeout(timerRefLocal);
          timerRefLocal = null;
        }
      }
    };
  }, [updateCurrentIntervalDuration, adjustTimeLeft]);

  const totalRemainingTimeDisplay = useMemo(() => {
    let remaining = timeLeft;
    for (let i = currentIntervalIndex + 1; i < intervals.length; i++) {
      remaining += intervals[i].duration;
    }
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`;
  }, [timeLeft, currentIntervalIndex, intervals]);

  const upcomingIntervals = useMemo(() => {
    return intervals.slice(currentIntervalIndex + 1);
  }, [intervals, currentIntervalIndex]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View className="px-6 pt-12 pb-2 flex-row justify-center items-center relative">
        <TouchableOpacity 
          className="p-2 absolute left-6 top-10"
          onPress={() => router.push('/(tabs)')}
        >
          <Icons.ChevronLeft className="text-primary" size={30} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">{workoutPlanName}</Text>
        <TouchableOpacity className="p-2 absolute right-6 top-10">
          <Icons.Settings className="text-primary" size={24} />
        </TouchableOpacity>
      </View>

      {/* Main Timer Area */}
      <View className="flex-1 justify-center items-center px-8">
        {currentInterval ? (
          <View className="w-full relative justify-center items-center">
            
            <View className="items-center z-10 w-full">
              <Text 
                className="text-xl uppercase tracking-widest mb-4 font-bold text-white" 
              >
                {currentInterval.name}
              </Text>
              
              {/* Dynamic adjusters around the active timer */}
              <View className="flex-row items-center justify-center gap-2">
                <View className="items-center w-32">
                  <TouchableOpacity 
                    onPressIn={() => MainTimerAdjuster.start(timeLeft, 60, (dur) => dur >= 3600)} 
                    onPressOut={() => MainTimerAdjuster.stop()}
                    disabled={timeLeft >= 3600} className="p-2 w-full items-center"
                  >
                    {timeLeft < 3600 ? <Icons.ChevronUp className="text-primary" size={40} /> : <View style={{ height: 40 }} />}
                  </TouchableOpacity>
                  <Text className="text-[90px] font-black text-white leading-[100px] tracking-tighter text-center">
                    {Math.floor(timeLeft / 60) < 10 ? `0${Math.floor(timeLeft / 60)}` : Math.floor(timeLeft / 60)}
                  </Text>
                  <TouchableOpacity 
                    onPressIn={() => MainTimerAdjuster.start(timeLeft, -60, (dur) => dur <= 60)} 
                    onPressOut={() => MainTimerAdjuster.stop()}
                    disabled={timeLeft <= 60} className="p-2 w-full items-center"
                  >
                    {timeLeft > 60 ? <Icons.ChevronDown className="text-primary" size={40} /> : <View style={{ height: 40 }} />}
                  </TouchableOpacity>
                </View>
                
                <Text className="text-text-muted text-[80px] font-bold leading-[100px] -mt-4">:</Text>

                <View className="items-center w-32">
                  <TouchableOpacity 
                    onPressIn={() => MainTimerAdjuster.start(timeLeft, 15, (dur) => dur >= 3600)} 
                    onPressOut={() => MainTimerAdjuster.stop()}
                    disabled={timeLeft >= 3600} className="p-2 w-full items-center"
                  >
                    {timeLeft < 3600 ? <Icons.ChevronUp className="text-primary" size={40} /> : <View style={{ height: 40 }} />}
                  </TouchableOpacity>
                  <Text className="text-[90px] font-black text-white leading-[100px] tracking-tighter text-center">
                    {timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}
                  </Text>
                  <TouchableOpacity 
                    onPressIn={() => MainTimerAdjuster.start(timeLeft, -15, (dur) => dur <= 15)} 
                    onPressOut={() => MainTimerAdjuster.stop()}
                    disabled={timeLeft <= 15} className="p-2 w-full items-center"
                  >
                    {timeLeft > 15 ? <Icons.ChevronDown className="text-primary" size={40} /> : <View style={{ height: 40 }} />}
                  </TouchableOpacity>
                </View>
              </View>

              {nextInterval && (
                <View className="mt-8 flex-row items-center bg-surface px-4 py-2 rounded-full">
                  <Text className="text-text-muted text-sm italic mr-2">Up next:</Text>
                  <Text className="text-white text-sm font-semibold">
                    {nextInterval.name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <Text className="text-text-muted italic text-center">No intervals defined</Text>
        )}
      </View>

      {/* Quick Controls */}
      <View className="px-8 pb-32">
        <View className="flex-row items-center justify-center mb-8 relative">
          <TouchableOpacity 
            onPress={togglePause}
            className="w-20 h-20 rounded-full bg-primary justify-center items-center shadow-lg"
          >
            {isPaused ? (
              <Icons.Play className="text-white fill-white ml-1" size={32} />
            ) : (
              <Icons.Pause className="text-white fill-white" size={32} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={skipToNext}
            className="absolute right-8 p-4"
          >
            <Icons.SkipForward className="text-white" size={28} />
          </TouchableOpacity>
        </View>

        {/* Quick actions for speed */}
        <View className="flex-row justify-center gap-4">
          <TouchableOpacity 
            onPress={addRestAfterCurrent}
            className="px-4 py-2 rounded-full border border-outline"
          >
            <Text className="text-text-muted text-xs">Add rest</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => resetWorkout()}
            className="px-4 py-2 rounded-full border border-outline"
          >
            <Text className="text-primary text-xs font-semibold">RESET</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Sheet Drawer */}
      <Animated.View 
        style={{ opacity: backdropOpacity }}
        pointerEvents={isMenuOpen ? 'auto' : 'none'}
        className="absolute inset-0 z-40 bg-black/80" 
      />
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={closeMenu} 
        style={{ ...(isMenuOpen ? {} : { display: 'none' }) }}
        className="absolute inset-0 z-40"
      />

      <Animated.View 
        {...panResponder.panHandlers}
        className="absolute left-0 right-0 z-50 bg-surface rounded-t-[40px] border-t-2 border-surface-light"
        style={{ 
          height: screenHeight,
          top: 80,
          transform: [{ translateY: slideAnim }],
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        }}
      >
        {/* Handle Bar */}
        <View className="w-full items-center pt-4 pb-2">
          <View className="w-12 h-1.5 bg-surface-light rounded-full" />
        </View>

        <View className="flex-1 relative">
          {/* Collapsed Content (Bar) */}
          <Animated.View 
            className="px-8 pb-6 flex-row justify-between items-center absolute w-full"
            style={{ opacity: barOpacity, zIndex: isMenuOpen ? 0 : 1 }}
            pointerEvents={isMenuOpen ? 'none' : 'auto'}
          >
            <View>
              <Text className="text-text-muted text-xs font-bold uppercase mb-1">Upcoming</Text>
              <Text className="text-white text-lg font-bold">
                {upcomingIntervals.length} more exercises
              </Text>
            </View>
            <TouchableOpacity 
              onPress={openMenu}
              className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20"
            >
              <Text className="text-primary font-bold">View List</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Full List Content */}
          <Animated.View 
            className="flex-1" 
            style={{ opacity: modalOpacity, zIndex: isMenuOpen ? 1 : 0 }}
            pointerEvents={isMenuOpen ? 'auto' : 'none'}
          >
            <View className="px-8 pt-0 pb-6 flex-row justify-between items-center">
              <Text className="text-2xl font-black text-white">Full Schedule</Text>
              <TouchableOpacity onPress={closeMenu} className="p-2">
                <Icons.X className="text-text-muted" size={24} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={intervals}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
              scrollEnabled={isMenuOpen}
              renderItem={({ item, index }) => {
              const isCurrent = index === currentIntervalIndex;
              const isUpcoming = index === currentIntervalIndex + 1;
              const isPast = index < currentIntervalIndex;

              return (
                <View>
                  {isCurrent && (
                    <Text className="text-primary text-xs font-bold uppercase mb-3 ml-1 tracking-widest">Current Exercise</Text>
                  )}
                  {isUpcoming && (
                    <Text className="text-text-muted text-xs font-bold uppercase mt-4 mb-3 ml-1 tracking-widest">Upcoming</Text>
                  )}
                  <View className={isPast ? 'opacity-40' : 'opacity-100'}>
                    <IntervalRow
                      interval={item}
                      onUpdate={(amount) => {
                        const newDuration = Math.max(15, Math.min(3600, item.duration + amount));
                        updateInterval(item.id, { duration: newDuration });
                        if (isCurrent) {
                          setTimeLeft((prev) => Math.max(15, Math.min(3600, prev + amount)));
                        }
                      }}
                      onMoveUp={index > currentIntervalIndex + 1 ? () => moveIntervalUp(index) : undefined}
                      onMoveDown={index > currentIntervalIndex && index < intervals.length - 1 ? () => moveIntervalDown(index) : undefined}
                      isFirst={index === 0}
                      isLast={index === intervals.length - 1}
                      isSelected={isCurrent}
                    />
                  </View>
                </View>
              );
            }}
          />
        </Animated.View>
      </View>
    </Animated.View>
  </SafeAreaView>
  );
};

export default HomeScreen;
