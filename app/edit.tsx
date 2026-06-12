import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView, ListRenderItemInfo, Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategorySelector } from '../components/CategorySelector';
import { Icons } from '../components/Icons';
import { IntervalRow } from '../components/IntervalRow';
import { ExerciseInterval, WorkoutPlan, useWorkoutDataStore } from '../stores/workoutStore';

const WorkoutNameHeader: React.FC<{ name: string, onNameChange: (text: string) => void }> = ({ name, onNameChange }) => {
  const [localName, setLocalName] = useState(name);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (name !== localName && !timeoutRef.current) {
      setLocalName(name);
    }
  }, [name]);

  const handleChange = (text: string) => {
    setLocalName(text);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onNameChange(text);
      timeoutRef.current = null;
    }, 500);
  };

  const handleBlur = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      onNameChange(localName);
      timeoutRef.current = null;
    }
  };

  return (
    <View className="mb-4">
      <Text className="text-text-muted mb-2 ml-1 font-bold">Workout Name</Text>
      <TextInput
        testID="workout-name-input"
        className="bg-surface text-white p-4 rounded-xl text-lg border border-outline placeholder:text-text-muted"
        value={localName}
        onChangeText={handleChange}
        onBlur={handleBlur}
        placeholder="Workout Name"
      />
    </View>
  );
};

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const savedWorkouts = useWorkoutDataStore((state) => state.savedWorkouts);
  const workoutCategories = useWorkoutDataStore((state) => state.workoutCategories);
  const loadCategories = useWorkoutDataStore((state) => state.loadCategories);
  const updateWorkoutCategories = useWorkoutDataStore((state) => state.updateWorkoutCategories);
  const saveWorkout = useWorkoutDataStore((state) => state.saveWorkout);
  const isLoading = useWorkoutDataStore((state) => state.isLoading);

  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (id) {
      if (id === 'new') {
        setWorkout({
          id: Math.random().toString(36).substring(2, 9),
          name: 'New Workout',
          intervals: []
        });
        setSelectedCategoryIds([]);
      } else {
        const existing = savedWorkouts.find(w => w.id === id);
        if (existing) {
          setWorkout(JSON.parse(JSON.stringify(existing)));
          setSelectedCategoryIds(
            workoutCategories
              .filter(wc => wc.workoutId === id)
              .map(wc => wc.categoryId)
          );
        }
      }
    }
  }, [id, savedWorkouts, workoutCategories]);

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  }, []);

  const handleSave = useCallback(async () => {
    Keyboard.dismiss();
    if (workout) {
      try {
        await saveWorkout(workout);
        await updateWorkoutCategories(workout.id, selectedCategoryIds);
        Alert.alert("Success", "Workout saved successfully.");
        router.back();
      } catch (error) {
        Alert.alert("Error", "Failed to save workout to the cloud.");
      }
    }
  }, [workout, selectedCategoryIds, saveWorkout, updateWorkoutCategories, router]);

  const updateInterval = useCallback((index: number, updates: Partial<ExerciseInterval>) => {
    setWorkout(prev => {
      if (!prev) return null;
      const newIntervals = [...prev.intervals];
      newIntervals[index] = { ...newIntervals[index], ...updates };
      return { ...prev, intervals: newIntervals };
    });
  }, []);

  const addInterval = useCallback(() => {
    Keyboard.dismiss();
    setWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        intervals: [
          ...prev.intervals,
          {
            id: Math.random().toString(36).substring(2, 9),
            name: '',
            duration: 30,
            type: 'high'
          }
        ]
      };
    });
  }, []);

  const addRest = useCallback(() => {
    Keyboard.dismiss();
    setWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        intervals: [
          ...prev.intervals,
          {
            id: Math.random().toString(36).substring(2, 9),
            name: 'Rest',
            duration: 30,
            type: 'rest'
          }
        ]
      };
    });
  }, []);

  const deleteSelected = useCallback(() => {
    setWorkout(prev => {
      if (!prev) return null;
      const newIntervals = prev.intervals.filter(i => !selectedExerciseIds.includes(i.id));
      return { ...prev, intervals: newIntervals };
    });
    setSelectedExerciseIds([]);
    setIsSelectionMode(false);
  }, [selectedExerciseIds]);

  const toggleSelection = useCallback((id: string) => {
    Keyboard.dismiss();
    setIsSelectionMode(true);
    setSelectedExerciseIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const cancelSelection = useCallback(() => {
    setSelectedExerciseIds([]);
    setIsSelectionMode(false);
  }, []);

  const toggleSelectAll = useCallback(() => {
    setWorkout(prev => {
      if (!prev) return prev;
      setSelectedExerciseIds(current => {
        if (current.length === prev.intervals.length) {
          return [];
        } else {
          return prev.intervals.map(i => i.id);
        }
      });
      return prev;
    });
  }, []);

  const moveIntervalUp = useCallback((index: number) => {
    Keyboard.dismiss();
    if (index === 0) return;
    setWorkout(prev => {
      if (!prev) return prev;
      const newIntervals = [...prev.intervals];
      const temp = newIntervals[index];
      newIntervals[index] = newIntervals[index - 1];
      newIntervals[index - 1] = temp;
      return { ...prev, intervals: newIntervals };
    });
  }, []);

  const moveIntervalDown = useCallback((index: number) => {
    Keyboard.dismiss();
    setWorkout(prev => {
      if (!prev || index === prev.intervals.length - 1) return prev;
      const newIntervals = [...prev.intervals];
      const temp = newIntervals[index];
      newIntervals[index] = newIntervals[index + 1];
      newIntervals[index + 1] = temp;
      return { ...prev, intervals: newIntervals };
    });
  }, []);

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<ExerciseInterval>) => {
    const isSelected = selectedExerciseIds.includes(item.id);
    const isFirst = index === 0;
    const isLast = workout ? index === workout.intervals.length - 1 : false;

    return (
      <IntervalRow
        interval={item}
        onUpdate={(amount) => updateInterval(index, { duration: Math.max(15, Math.min(3600, item.duration + amount)) })}
        onNameChange={(text) => updateInterval(index, { name: text })}
        onMoveUp={() => moveIntervalUp(index)}
        onMoveDown={() => moveIntervalDown(index)}
        isFirst={isFirst}
        isLast={isLast}
        isSelected={isSelected}
        isSelectionMode={isSelectionMode}
        onLongPress={() => toggleSelection(item.id)}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(item.id);
          } else {
            Keyboard.dismiss();
          }
        }}
      />
    );
  }, [selectedExerciseIds, isSelectionMode, workout, updateInterval, moveIntervalUp, moveIntervalDown, toggleSelection]);

  if (!workout) return null;

  const listHeader = (
    <View>
      <WorkoutNameHeader 
        name={workout.name} 
        onNameChange={(text) => setWorkout(prev => prev ? ({ ...prev, name: text }) : null)} 
      />
      <CategorySelector 
        selectedCategoryIds={selectedCategoryIds}
        onToggleCategory={toggleCategory}
      />
      <View className="mb-2">
        <Text className="text-text-muted ml-1 font-bold">Exercises</Text>
      </View>
    </View>
  );

  const listFooter = (
    <View className="pb-5 flex-row gap-3">
      <TouchableOpacity
        onPress={addInterval}
        className="flex-1 flex-row items-center justify-center bg-primary/20 p-4 rounded-xl mt-2 gap-2 border border-primary border-dashed"
      >
        <Icons.Plus className="text-primary" size={24} />
        <Text className="text-primary text-base font-bold text-center">Exercise</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={addRest}
        className="flex-1 flex-row items-center justify-center bg-surface-light/20 p-4 rounded-xl mt-2 gap-2 border border-outline border-dashed"
      >
        <Icons.Coffee className="text-text-muted" size={24} />
        <Text className="text-text-muted text-base font-bold text-center">Rest</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {isSelectionMode ? (
          <View className="flex-row items-center justify-between p-5">
            <TouchableOpacity onPress={toggleSelectAll} className="p-2 flex-row items-center gap-1.5">
              {selectedExerciseIds.length === workout.intervals.length && workout.intervals.length > 0 ? (
                <Icons.CheckCircle2 className="text-primary" size={24} />
              ) : (
                <Icons.Circle className="text-text-muted" size={24} />
              )}
              <Text className={selectedExerciseIds.length === workout.intervals.length && workout.intervals.length > 0 ? "text-primary text-base font-bold" : "text-text-muted text-base font-bold"}>All</Text>
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold">{selectedExerciseIds.length} Selected</Text>
            <TouchableOpacity onPress={cancelSelection} className="p-2 flex-row items-center gap-1.5">
              <Text className="text-text-muted text-base font-bold">Cancel</Text>
              <Icons.X className="text-text-muted" size={24} />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row items-center justify-between p-5">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Icons.ArrowLeft className="text-primary" size={24} />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">{id === 'new' ? 'New Workout' : 'Edit Workout'}</Text>
            <View className="flex-row gap-3 items-center">
              {isLoading ? (
                <View className="p-2">
                  <ActivityIndicator color="#3b82f6" />
                </View>
              ) : (
                <TouchableOpacity testID="save-workout-button" onPress={handleSave} className="p-2">
                  <Icons.Save className="text-primary" size={24} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <FlatList
          data={workout.intervals}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 230 }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        />
      </KeyboardAvoidingView>
      {selectedExerciseIds.length > 0 && (
        <Animated.View 
          entering={SlideInDown} 
          exiting={SlideOutDown} 
          className="absolute bottom-0 left-0 right-0"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)', 'black']}
            locations={[0, 0.4, 1]}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 200,
              pointerEvents: 'none',
            }}
          />
          <View className="mx-5 mb-5 px-4 py-5 bg-surface rounded-2xl flex-row items-center justify-between shadow-md border-2 border-surface-light">
            <Text className="text-base font-bold text-white">
              {selectedExerciseIds.length} selected
            </Text>
            <TouchableOpacity
              className="flex-row items-center bg-red-500 py-2.5 px-4 rounded-lg gap-2"
              onPress={deleteSelected}
            >
              <Icons.Trash2 className="text-white" size={20} />
              <Text className="text-white font-bold">Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
