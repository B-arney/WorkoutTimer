import * as KeepAwake from 'expo-keep-awake';
import { useCallback, useEffect, useRef } from 'react';
import { useTimerSessionStore } from '../stores/workoutStore';

export const useWorkoutTimer = () => {
  const { 
    intervals, 
    currentIntervalIndex, 
    isPaused, 
    skipToNext, 
    togglePause,
    timeLeft,
    setTimeLeft,
    decrementTimeLeft
  } = useTimerSessionStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const playIntervalEndSound = useCallback(async (isFinalSoon: boolean) => {
    // expo-audio implementation will go here
    try {
      // Logic for playing sounds using expo-audio
    } catch (error) {
      console.warn('Audio error:', error);
    }
  }, []);

  useEffect(() => {
    if (intervals[currentIntervalIndex]) {
      setTimeLeft(intervals[currentIntervalIndex].duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIntervalIndex]);

  const adjustTimeLeft = useCallback((newDuration: number | ((prev: number) => number)) => {
    setTimeLeft(newDuration);
  }, [setTimeLeft]);

  useEffect(() => {
    if (isPaused) {
      if (KeepAwake.deactivateKeepAwake) {
        KeepAwake.deactivateKeepAwake().catch(() => {
          /* Ignore Errors if not active */
        });
      }
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      KeepAwake.activateKeepAwakeAsync();
      timerRef.current = setInterval(() => {
        const currentTime = useTimerSessionStore.getState().timeLeft;
        if (currentTime <= 1) {
          setTimeLeft(0);
          playIntervalEndSound(false);
          // Defer state updates to avoid React render cycle errors
          setTimeout(() => {
            const currentIdx = useTimerSessionStore.getState().currentIntervalIndex;
            const ints = useTimerSessionStore.getState().intervals;
            if (currentIdx < ints.length - 1) {
              skipToNext();
            } else {
              togglePause(); // Finish workout
            }
          }, 0);
        } else {
          decrementTimeLeft();
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, skipToNext, togglePause, playIntervalEndSound, setTimeLeft, decrementTimeLeft]);

  return { timeLeft, adjustTimeLeft };
};
