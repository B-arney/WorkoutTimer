import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, ListRenderItemInfo, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../../components/Icons';
import { useAuth } from '../../stores/authStore';
import { useTimerSessionStore, useWorkoutDataStore, WorkoutPlan } from '../../stores/workoutStore';

const HeaderComponent = React.memo(({ isLoading, isSelectionMode, toggleSelectAll, selectedWorkoutIdsSize, filteredWorkoutsLength, cancelSelection, onAddWorkout, onLogout, searchQuery, setSearchQuery }: any) => (
  <View className="mb-4">
    {isSelectionMode ? (
      <View className="mb-6 flex-row justify-between items-center">
        <TouchableOpacity onPress={toggleSelectAll} className="p-2 flex-row items-center gap-1.5">
          {selectedWorkoutIdsSize === filteredWorkoutsLength && filteredWorkoutsLength > 0 ? (
            <Icons.CheckCircle2 className="text-primary" size={24} />
          ) : (
            <Icons.Circle className="text-text-muted" size={24} />
          )}
          <Text className={selectedWorkoutIdsSize === filteredWorkoutsLength && filteredWorkoutsLength > 0 ? "text-primary text-base font-bold" : "text-text-muted text-base font-bold"}>All</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">{selectedWorkoutIdsSize} Selected</Text>
        <TouchableOpacity onPress={cancelSelection} className="p-2 flex-row items-center gap-1.5">
          <Text className="text-text-muted text-base font-bold">Cancel</Text>
          <Icons.X className="text-text-muted" size={24} />
        </TouchableOpacity>
      </View>
    ) : (
      <View>
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity 
              onPress={onLogout}
              testID="logout-button"
              className="bg-surface-light p-2 rounded-xl shadow-md"
            >
              <Icons.LogOut className="text-text-muted" size={24} />
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-white">
              Workout Plans
            </Text>
            {isLoading && <ActivityIndicator color="#3b82f6" />}
          </View>
          <View className="flex-row gap-4">
            <TouchableOpacity 
              onPress={onAddWorkout}
              testID="add-workout-button"
              className="bg-primary p-2 rounded-xl shadow-md shadow-primary/20"
            >
              <Icons.Plus className="text-white" size={24} />
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-row items-center bg-surface border-2 border-surface-light rounded-2xl px-4 py-3.5 shadow-sm">
          <Icons.Search className="text-text-muted" size={20} />
          <TextInput
            className="flex-1 text-white text-base ml-3 placeholder:text-text-muted"
            placeholder="Search workouts or tags..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
              <Icons.X className="text-text-muted" size={16} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    )}
  </View>
));

export default function WorkoutPlansScreen() {
  const router = useRouter();
  const { logout } = useAuth() as any;
  const savedWorkouts = useWorkoutDataStore((state) => state.savedWorkouts);
  const categories = useWorkoutDataStore((state) => state.categories);
  const workoutCategories = useWorkoutDataStore((state) => state.workoutCategories);
  const loadCategories = useWorkoutDataStore((state) => state.loadCategories);
  const isLoading = useWorkoutDataStore((state) => state.isLoading);
  const deleteWorkout = useWorkoutDataStore((state) => state.deleteWorkout);
  const isSelectionMode = useWorkoutDataStore((state) => state.isSelectionMode);
  const setSelectionMode = useWorkoutDataStore((state) => state.setSelectionMode);
  
  const loadWorkout = useTimerSessionStore((state) => state.loadWorkout);
  const currentWorkoutId = useTimerSessionStore((state) => state.currentWorkoutId);

  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const user = useAuth((state: any) => state.user);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadCategories();
      }
    }, [loadCategories, user])
  );

  const filteredWorkouts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return savedWorkouts.filter(w => {
      const workoutCategoryIds = workoutCategories
        .filter(wc => wc.workoutId === w.id)
        .map(wc => wc.categoryId);
      const workoutCategoryNames = categories
        .filter(c => workoutCategoryIds.includes(c.id))
        .map(c => c.name.toLowerCase());

      return w.name.toLowerCase().includes(query) || 
             workoutCategoryNames.some(name => name.includes(query));
    });
  }, [savedWorkouts, searchQuery, categories, workoutCategories]);

  const toggleSelection = useCallback((id: string) => {
    Keyboard.dismiss();
    if (!isSelectionMode) setSelectionMode(true);
    setSelectedWorkoutIds(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [isSelectionMode, setSelectionMode]);

  const cancelSelection = useCallback(() => {
    setSelectedWorkoutIds(new Set());
    setSelectionMode(false);
  }, [setSelectionMode]);

  const toggleSelectAll = useCallback(() => {
    setSelectedWorkoutIds(current => {
      if (current.size === filteredWorkouts.length) {
        return new Set();
      } else {
        return new Set(filteredWorkouts.map(w => w.id));
      }
    });
  }, [filteredWorkouts]);

  const handleCardPress = useCallback((workout: WorkoutPlan) => {
    if (isSelectionMode) {
      toggleSelection(workout.id);
    }
  }, [isSelectionMode, toggleSelection]);

  const handleCardLongPress = useCallback((workout: WorkoutPlan) => {
    if (!isSelectionMode) {
      toggleSelection(workout.id);
    }
  }, [isSelectionMode, toggleSelection]);

  const handleDeleteSelected = useCallback(async () => {
    try {
      await Promise.all(Array.from(selectedWorkoutIds).map(id => deleteWorkout(id)));
      Alert.alert("Success", "Workouts deleted successfully.");
    } catch (e) {
      Alert.alert("Error", "Failed to delete workouts from the cloud.");
    }
    setSelectedWorkoutIds(new Set());
    setSelectionMode(false);
  }, [selectedWorkoutIds, deleteWorkout, setSelectionMode]);

  const handleStart = useCallback((workout: WorkoutPlan) => {
    if (workout.id !== currentWorkoutId) {
      loadWorkout(workout);
    }
    router.push('/(tabs)/timer' as any);
  }, [currentWorkoutId, loadWorkout, router]);

  const handleEdit = useCallback((workout: WorkoutPlan) => {
    router.push(`/edit?id=${workout.id}` as any);
  }, [router]);

  const handleAddWorkout = useCallback(() => {
    router.push('/edit?id=new' as any);
  }, [router]);

  const renderItem = useCallback(({ item: workout }: ListRenderItemInfo<WorkoutPlan>) => {
    const isSelected = selectedWorkoutIds.has(workout.id);
    const assignedCategoryIds = workoutCategories
      .filter(wc => wc.workoutId === workout.id)
      .map(wc => wc.categoryId);
    const assignedCategories = categories.filter(c => assignedCategoryIds.includes(c.id));

    return (
      <Pressable
        onPress={() => handleCardPress(workout)}
        onLongPress={() => handleCardLongPress(workout)}
        className="active:opacity-95"
      >
        <View className={`rounded-2xl px-4 py-5 mb-4 shadow-sm border-2 ${isSelected ? 'bg-primary/10 border-primary scale-[1.01] shadow-lg' : 'bg-surface border-surface-light shadow-sm'}`}>
          <View className="flex-row justify-between items-start mb-4">
            <Text className="text-xl font-bold text-white flex-1 pr-2">
              {workout.name}
            </Text>
            {isSelectionMode && (
              <View className="ml-2">
                {isSelected ? (
                  <Icons.CheckCircle2 className="text-primary" size={24} />
                ) : (
                  <Icons.Circle className="text-text-muted" size={24} />
                )}
              </View>
            )}
          </View>

          {assignedCategories.length > 0 && (
            <View className="flex-row flex-wrap justify-start mb-5">
              {assignedCategories.map((cat) => (
                <View
                  key={cat.id}
                  style={{ backgroundColor: cat.color || '#3b82f6' }}
                  className="px-3 py-1.5 rounded-xl mr-2 mb-2 items-center justify-center"
                >
                  <Text className="text-white text-xs font-bold uppercase tracking-wider text-center">
                    {cat.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                if (!isSelectionMode) handleEdit(workout);
              }}
              disabled={isSelectionMode}
              className={`flex-1 flex-row items-center justify-center border-2 border-primary py-3.5 rounded-xl gap-2 ${isSelectionMode ? 'bg-background opacity-50' : 'bg-surface opacity-100'}`}
            >
              <Icons.Edit2 className="text-primary" size={18} />
              <Text className="text-primary text-base font-bold">
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (!isSelectionMode) handleStart(workout);
              }}
              disabled={isSelectionMode}
              className={`flex-1 flex-row items-center justify-center bg-primary py-3.5 rounded-xl gap-2 ${isSelectionMode ? 'opacity-50' : 'opacity-100 shadow-md shadow-primary/30'}`}
            >
              <Icons.Play className="text-white fill-white" size={18} />
              <Text className="text-white text-base font-bold">
                {workout.id === currentWorkoutId ? 'Continue' : 'Start'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    );
  }, [selectedWorkoutIds, isSelectionMode, currentWorkoutId, categories, workoutCategories, handleCardPress, handleCardLongPress, handleEdit, handleStart]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filteredWorkouts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <HeaderComponent
            isSelectionMode={isSelectionMode}
            toggleSelectAll={toggleSelectAll}
            selectedWorkoutIdsSize={selectedWorkoutIds.size}
            filteredWorkoutsLength={filteredWorkouts.length}
            cancelSelection={cancelSelection}
            onAddWorkout={handleAddWorkout}
            onLogout={logout}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <View className="items-center mt-10">
            <Text className="text-text-muted text-base">
              {searchQuery.length > 0 
                ? "No matching workouts or categories." 
                : "No workout plans yet."}
            </Text>
          </View>
        }
      />

      {selectedWorkoutIds.size > 0 && (
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
              {selectedWorkoutIds.size} selected
            </Text>
            <TouchableOpacity
              className="flex-row items-center bg-red-500 py-2.5 px-4 rounded-lg gap-2"
              onPress={handleDeleteSelected}
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
