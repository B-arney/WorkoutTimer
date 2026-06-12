import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../stores/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error } = useAuth() as any;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (register) {
      await register(email, password);
    }
  };

  return (
    <View className="flex-1 justify-center p-6 bg-white dark:bg-black">
      <Text className="text-3xl font-bold mb-8 text-black dark:text-white text-center">Create Account</Text>
      
      {error && <Text className="text-red-500 mb-4 text-center">{error}</Text>}
      
      <TextInput
        testID="email-input"
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        className="w-full bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-4 text-black dark:text-white"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        testID="password-input"
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="w-full bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-6 text-black dark:text-white"
      />
      
      <TouchableOpacity 
        testID="register-button"
        onPress={handleRegister} 
        disabled={isLoading}
        className="w-full bg-green-500 p-4 rounded-xl mb-4 items-center"
      >
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Register</Text>}
      </TouchableOpacity>
      
      <Link href="/auth/login" asChild>
        <TouchableOpacity className="items-center p-2">
          <Text className="text-blue-500">Already have an account? Login</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
