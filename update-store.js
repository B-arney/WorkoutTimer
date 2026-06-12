const fs = require('fs');
const content = fs.readFileSync('stores/workoutStore.ts', 'utf8');

const updated = content.replace(
  /tags: string\[\];\s+intervals: ExerciseInterval\[\];\s+}/,
  `tags: string[];\n  intervals: ExerciseInterval[];\n}\n\nexport const MockWorkoutData: WorkoutPlan[] = mockWorkouts;`
);

fs.writeFileSync('stores/workoutStore.ts', updated);
