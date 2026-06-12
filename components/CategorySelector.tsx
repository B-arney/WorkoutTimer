import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useWorkoutDataStore } from '../stores/workoutStore';
import { Icons } from './Icons';

interface CategorySelectorProps {
  selectedCategoryIds: string[];
  onToggleCategory: (id: string) => void;
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  selectedCategoryIds, 
  onToggleCategory 
}) => {
  const { categories, createCategory, deleteCategory } = useWorkoutDataStore();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsCreating(true);
    const newCategory = {
      id: Math.random().toString(36).substring(2, 9),
      name: newCategoryName.trim(),
      color: selectedColor
    };
    
    await createCategory(newCategory);
    onToggleCategory(newCategory.id);
    setNewCategoryName('');
    setIsCreating(false);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete the category "${name}"? This will remove it from all workout plans.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => deleteCategory(id) 
        }
      ]
    );
  };

  const selectedCategories = categories.filter(c => selectedCategoryIds.includes(c.id));

  return (
    <View className="mb-4">
      <Text className="text-text-muted mb-2 ml-1 font-bold">Categories</Text>
      
      {/* Dropdown Trigger */}
      <TouchableOpacity 
        onPress={() => setIsMenuOpen(true)}
        className="bg-surface border-2 border-outline rounded-xl px-4 py-3 flex-row justify-between items-center"
      >
        <View className="flex-row flex-1 flex-wrap gap-1">
          {selectedCategories.length > 0 ? (
            selectedCategories.map(cat => (
              <View key={cat.id} style={{ backgroundColor: cat.color }} className="px-2 py-1 rounded-lg">
                <Text className="text-white text-xs font-bold">{cat.name}</Text>
              </View>
            ))
          ) : (
            <Text className="text-text-muted">Select categories...</Text>
          )}
        </View>
        <Icons.ChevronDown size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <View className="flex-1 justify-center items-center px-6">
          {/* Backdrop sibling to ensure it doesn't intercept child scrolls */}
          <Pressable 
            className="absolute inset-0 bg-black/60" 
            onPress={() => setIsMenuOpen(false)} 
          />
          
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="w-full h-[80%]"
          >
            <View className="bg-surface-light w-full h-full rounded-3xl border-2 border-outline shadow-2xl overflow-hidden">
              <View className="p-6 border-b border-outline flex-row justify-between items-center">
                <Text className="text-white text-xl font-bold">Select Categories</Text>
                <TouchableOpacity onPress={() => setIsMenuOpen(false)} className="p-1">
                  <Icons.X size={24} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                ref={scrollViewRef}
                className="flex-1"
                contentContainerStyle={{ padding: 16, paddingBottom: 300 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {categories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <View 
                      key={category.id} 
                      className="flex-row items-center mb-2"
                    >
                      <TouchableOpacity
                        onPress={() => onToggleCategory(category.id)}
                        className="flex-1 flex-row items-center p-3 rounded-xl bg-surface"
                      >
                        <View 
                          className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                            isSelected ? 'bg-primary border-primary' : 'border-outline'
                          }`}
                        >
                          {isSelected && <Icons.Check size={16} color="white" strokeWidth={3} />}
                        </View>
                        <View style={{ backgroundColor: category.color }} className="w-3 h-3 rounded-full mr-3" />
                        <Text className="text-white text-lg flex-1">{category.name}</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        onPress={() => handleDeleteCategory(category.id, category.name)}
                        className="p-3 ml-2"
                      >
                        <Icons.Trash2 size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                <View className="mt-6 pt-6 border-t border-outline">
                  <Text className="text-white text-lg font-bold mb-4">Create New</Text>
                  
                  <View className="bg-surface border-2 border-outline rounded-xl px-4 py-1 mb-4">
                    <TextInput
                      className="text-white py-2 text-base"
                      placeholder="Category name..."
                      placeholderTextColor="#9ca3af"
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      onFocus={() => {
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                      }}
                    />
                  </View>

                  <Text className="text-text-muted mb-3 font-bold">Pick a color</Text>
                  <View className="flex-row flex-wrap gap-3 mb-6">
                    {PRESET_COLORS.map(color => (
                      <TouchableOpacity
                        key={color}
                        onPress={() => setSelectedColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-10 h-10 rounded-full border-4 ${
                          selectedColor === color ? 'border-white' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </View>

                  <TouchableOpacity 
                    testID="create-category-button"
                    onPress={handleCreateCategory}
                    disabled={!newCategoryName.trim() || isCreating}
                    className={`py-4 rounded-xl items-center justify-center flex-row gap-2 ${
                      !newCategoryName.trim() || isCreating ? 'bg-surface border-2 border-outline' : 'bg-primary'
                    }`}
                  >
                    {isCreating ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Icons.Plus size={20} color="white" />
                        <Text className="text-white font-bold text-lg">Create Category</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};
