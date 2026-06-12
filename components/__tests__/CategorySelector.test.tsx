import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { CategorySelector } from '../CategorySelector';
import { useWorkoutDataStore } from '../../stores/workoutStore';

jest.mock('../../stores/workoutStore', () => ({
  useWorkoutDataStore: jest.fn(),
}));

describe('CategorySelector', () => {
  const mockCategories = [
    { id: '1', name: 'Cardio', color: '#3b82f6' },
    { id: '2', name: 'Strength', color: '#ef4444' },
  ];
  
  const mockCreateCategory = jest.fn();
  const mockDeleteCategory = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useWorkoutDataStore as unknown as jest.Mock).mockReturnValue({
      categories: mockCategories,
      createCategory: mockCreateCategory,
      deleteCategory: mockDeleteCategory,
      isLoading: false,
    });
  });

  it('renders dropdown trigger and opens modal', () => {
    const { getByText, queryByText } = render(
      <CategorySelector 
        selectedCategoryIds={[]} 
        onToggleCategory={() => {}} 
      />
    );
    
    expect(getByText('Select categories...')).toBeTruthy();
    
    // Open modal
    fireEvent.press(getByText('Select categories...'));
    
    expect(getByText('Select Categories')).toBeTruthy();
    expect(getByText('Cardio')).toBeTruthy();
    expect(getByText('Strength')).toBeTruthy();
  });

  it('calls onToggleCategory when a category is pressed in modal', () => {
    const onToggle = jest.fn();
    const { getByText } = render(
      <CategorySelector 
        selectedCategoryIds={[]} 
        onToggleCategory={onToggle} 
      />
    );
    
    fireEvent.press(getByText('Select categories...'));
    fireEvent.press(getByText('Cardio'));
    
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('calls createCategory when a new category is submitted', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = render(
      <CategorySelector 
        selectedCategoryIds={[]} 
        onToggleCategory={() => {}} 
      />
    );
    
    fireEvent.press(getByText('Select categories...'));
    
    const input = getByPlaceholderText('Category name...');
    fireEvent.changeText(input, 'Yoga');
    
    const button = getByTestId('create-category-button');
    await act(async () => {
      fireEvent.press(button);
    });
    
    expect(mockCreateCategory).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Yoga'
    }));
  });
});
