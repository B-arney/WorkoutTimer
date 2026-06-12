import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { Category, WorkoutCategory, WorkoutPlan } from '../stores/workoutStore';
import { auth, db } from './firebaseConfig';

const WORKOUTS_COLLECTION = 'workouts';
const CATEGORIES_COLLECTION = 'categories';
const WORKOUT_CATEGORIES_COLLECTION = 'workoutCategories';

const getUserId = () => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
};

export const getWorkouts = async (): Promise<WorkoutPlan[]> => {
  const q = query(
    collection(db, WORKOUTS_COLLECTION),
    where('userId', '==', getUserId())
  );
  const querySnapshot = await getDocs(q);
  const workouts: WorkoutPlan[] = [];
  querySnapshot.forEach((doc) => {
    workouts.push(doc.data() as WorkoutPlan);
  });
  return workouts;
};

export const saveWorkout = async (workout: WorkoutPlan): Promise<void> => {
  const workoutRef = doc(db, WORKOUTS_COLLECTION, workout.id);
  await setDoc(workoutRef, { ...workout, userId: getUserId() });
};

export const deleteWorkout = async (id: string): Promise<void> => {
  const workoutRef = doc(db, WORKOUTS_COLLECTION, id);
  // Optional: In a real app we might check if this belongs to the user first,
  // but security rules will handle that.
  await deleteDoc(workoutRef);
};

export const getCategories = async (): Promise<Category[]> => {
  const q = query(
    collection(db, CATEGORIES_COLLECTION),
    where('userId', '==', getUserId())
  );
  const querySnapshot = await getDocs(q);
  const categories: Category[] = [];
  querySnapshot.forEach((doc) => {
    categories.push(doc.data() as Category);
  });
  return categories;
};

export const saveCategory = async (category: Category): Promise<void> => {
  const categoryRef = doc(db, CATEGORIES_COLLECTION, category.id);
  await setDoc(categoryRef, { ...category, userId: getUserId() });
};

export const deleteCategory = async (id: string): Promise<void> => {
  const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
  await deleteDoc(categoryRef);
};

export const getWorkoutCategories = async (): Promise<WorkoutCategory[]> => {
  const q = query(
    collection(db, WORKOUT_CATEGORIES_COLLECTION),
    where('userId', '==', getUserId())
  );
  const querySnapshot = await getDocs(q);
  const workoutCategories: WorkoutCategory[] = [];
  querySnapshot.forEach((doc) => {
    workoutCategories.push(doc.data() as WorkoutCategory);
  });
  return workoutCategories;
};

export const saveWorkoutCategory = async (workoutCategory: WorkoutCategory): Promise<void> => {
  const refId = `${workoutCategory.workoutId}_${workoutCategory.categoryId}`;
  const ref = doc(db, WORKOUT_CATEGORIES_COLLECTION, refId);
  await setDoc(ref, { ...workoutCategory, userId: getUserId() });
};

export const deleteWorkoutCategory = async (workoutId: string, categoryId: string): Promise<void> => {
  const refId = `${workoutId}_${categoryId}`;
  const ref = doc(db, WORKOUT_CATEGORIES_COLLECTION, refId);
  await deleteDoc(ref);
};
