import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { 
  saveWorkout as backendSaveWorkout, 
  deleteWorkout as backendDeleteWorkout,
  getCategories as backendGetCategories,
  saveCategory as backendSaveCategory,
  deleteCategory as backendDeleteCategory,
  getWorkoutCategories as backendGetWorkoutCategories,
  saveWorkoutCategory as backendSaveWorkoutCategory,
  deleteWorkoutCategory as backendDeleteWorkoutCategory
} from '../services/backend';

export type IntervalType = 'high' | 'low' | 'rest';

export interface ExerciseInterval {
  id: string;
  name: string;
  duration: number;
  type: IntervalType;
  color?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  intervals: ExerciseInterval[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface WorkoutCategory {
  workoutId: string;
  categoryId: string;
}

interface WorkoutDataState {
  savedWorkouts: WorkoutPlan[];
  categories: Category[];
  workoutCategories: WorkoutCategory[];
  isSelectionMode: boolean;
  isLoading: boolean;
  setSelectionMode: (mode: boolean) => void;
  saveWorkout: (updatedWorkout: WorkoutPlan) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  loadCategories: () => Promise<void>;
  createCategory: (category: Category) => Promise<void>;
  updateWorkoutCategories: (workoutId: string, categoryIds: string[]) => Promise<void>;
}

const mockWorkouts: WorkoutPlan[] = [
  {
    id: 'w1',
    name: 'Morning HIIT',
    intervals: [
      { id: '1', name: 'Jumping Jacks', duration: 30, type: 'high' },
      { id: '2', name: 'Push-ups', duration: 30, type: 'high' },
      { id: '3', name: 'Squats', duration: 30, type: 'high' },
      { id: '4', name: 'Plank', duration: 30, type: 'high' },
    ],
  },
  {
    id: 'w2',
    name: 'Core Crusher',
    intervals: [
      { id: 'c1', name: 'Crunches', duration: 45, type: 'high' },
      { id: 'c2', name: 'Rest', duration: 15, type: 'rest' },
      { id: 'c3', name: 'Leg Raises', duration: 45, type: 'high' },
    ],
  },
];

export const useWorkoutDataStore = create<WorkoutDataState>()(
  persist(
    (set, get) => ({
      savedWorkouts: mockWorkouts,
      categories: [],
      workoutCategories: [],
      isSelectionMode: false,
      isLoading: false,
      setSelectionMode: (mode) => set({ isSelectionMode: mode }),
      saveWorkout: async (updatedWorkout) => {
        set({ isLoading: true });
        try {
          await backendSaveWorkout(updatedWorkout);
          set((state) => ({
            savedWorkouts: state.savedWorkouts.find(w => w.id === updatedWorkout.id)
              ? state.savedWorkouts.map(w => w.id === updatedWorkout.id ? updatedWorkout : w)
              : [...state.savedWorkouts, updatedWorkout]
          }));
        } catch (error) {
          console.error("Failed to save workout to backend", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      deleteWorkout: async (id) => {
        set({ isLoading: true });
        try {
          await backendDeleteWorkout(id);
          set((state) => ({
            savedWorkouts: state.savedWorkouts.filter(w => w.id !== id)
          }));
        } catch (error) {
          console.error("Failed to delete workout from backend", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      loadCategories: async () => {
        try {
          const [categories, workoutCategories] = await Promise.all([
            backendGetCategories(),
            backendGetWorkoutCategories()
          ]);
          set({ categories, workoutCategories });
        } catch (error) {
          console.error("Failed to load categories", error);
        }
      },
      createCategory: async (category) => {
        try {
          await backendSaveCategory(category);
          set((state) => ({
            categories: [...state.categories, category]
          }));
        } catch (error) {
          console.error("Failed to create category", error);
        }
      },
      deleteCategory: async (id) => {
        try {
          await backendDeleteCategory(id);
          set((state) => ({
            categories: state.categories.filter(c => c.id !== id),
            workoutCategories: state.workoutCategories.filter(wc => wc.categoryId !== id)
          }));
        } catch (error) {
          console.error("Failed to delete category", error);
        }
      },
      updateWorkoutCategories: async (workoutId, categoryIds) => {
        try {
          const current = get().workoutCategories.filter(wc => wc.workoutId === workoutId);
          const currentIds = current.map(c => c.categoryId);
          
          const toAdd = categoryIds.filter(id => !currentIds.includes(id));
          const toRemove = currentIds.filter(id => !categoryIds.includes(id));

          await Promise.all([
            ...toAdd.map(id => backendSaveWorkoutCategory({ workoutId, categoryId: id })),
            ...toRemove.map(id => backendDeleteWorkoutCategory(workoutId, id))
          ]);

          set((state) => ({
            workoutCategories: [
              ...state.workoutCategories.filter(wc => wc.workoutId !== workoutId),
              ...categoryIds.map(id => ({ workoutId, categoryId: id }))
            ]
          }));
        } catch (error) {
          console.error("Failed to update workout categories", error);
        }
      },
    }),
    {
      name: 'workout-data-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

interface TimerSessionState {
  currentWorkoutId: string | null;
  workoutPlanName: string;
  intervals: ExerciseInterval[];
  currentIntervalIndex: number;
  timeLeft: number;
  isPaused: boolean;
  
  loadWorkout: (plan: WorkoutPlan) => void;
  updateInterval: (id: string, updates: Partial<ExerciseInterval> | ((i: ExerciseInterval) => Partial<ExerciseInterval>)) => void;
  reorderIntervals: (newIntervals: ExerciseInterval[]) => void;
  togglePause: () => void;
  skipToNext: () => void;
  resetWorkout: (originalPlan?: WorkoutPlan) => void;
  addRestAfterCurrent: () => void;
  updateCurrentIntervalDuration: (newDuration: number | ((prev: number) => number)) => void;
  setTimeLeft: (time: number | ((prev: number) => number)) => void;
  decrementTimeLeft: () => void;
}

export const useTimerSessionStore = create<TimerSessionState>()((set) => ({
  currentWorkoutId: null,
  workoutPlanName: '',
  intervals: [],
  currentIntervalIndex: 0,
  timeLeft: 0,
  isPaused: true,

  loadWorkout: (plan) => set({
    currentWorkoutId: plan.id,
    workoutPlanName: plan.name,
    intervals: [...plan.intervals],
    currentIntervalIndex: 0,
    timeLeft: plan.intervals.length > 0 ? plan.intervals[0].duration : 0,
    isPaused: true,
  }),

  updateInterval: (id, updates) => set((state) => ({
    intervals: state.intervals.map((i) => (i.id === id ? { ...i, ...(typeof updates === 'function' ? updates(i) : updates) } : i))
  })),

  reorderIntervals: (newIntervals) => set({ intervals: newIntervals }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  skipToNext: () => set((state) => {
    const nextIndex = Math.min(state.currentIntervalIndex + 1, state.intervals.length - 1);
    return {
      currentIntervalIndex: nextIndex,
      timeLeft: state.intervals[nextIndex]?.duration || 0,
    };
  }),

  resetWorkout: (originalPlan) => set((state) => {
    const intervalsToUse = originalPlan ? [...originalPlan.intervals] : state.intervals;
    return { 
      currentIntervalIndex: 0, 
      isPaused: true, 
      intervals: intervalsToUse,
      timeLeft: intervalsToUse[0]?.duration || 0,
    };
  }),

  updateCurrentIntervalDuration: (durationInput) => set((state) => {
    const newIntervals = [...state.intervals];
    const currentInterval = newIntervals[state.currentIntervalIndex];
    if (currentInterval) {
      currentInterval.duration = typeof durationInput === 'function' ? durationInput(currentInterval.duration) : durationInput;
    }
    return { intervals: newIntervals };
  }),

  setTimeLeft: (time) => set((state) => ({ 
    timeLeft: typeof time === 'function' ? time(state.timeLeft) : time 
  })),

  decrementTimeLeft: () => set((state) => ({ timeLeft: state.timeLeft - 1 })),

  addRestAfterCurrent: () => set((state) => {
    const newIntervals = [...state.intervals];
    const insertIndex = state.currentIntervalIndex + 1;
    newIntervals.splice(insertIndex, 0, {
      id: Math.random().toString(36).substring(2, 9),
      name: 'Rest',
      duration: 30,
      type: 'rest'
    });    return { intervals: newIntervals };
  }),
}));
