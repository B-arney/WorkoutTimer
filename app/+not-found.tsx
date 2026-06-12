import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center p-5">
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View>
        <Text className="text-white text-xl font-bold">This screen doesn't exist.</Text>

        <Link href="/" className="mt-4 py-4">
          <Text className="text-primary text-sm">Go to home screen!</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
