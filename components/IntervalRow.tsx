import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, Platform, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { Icons } from './Icons';
import { ExerciseInterval } from '../stores/workoutStore';

// --- Sub-components ---

const IntervalIcon = ({ type, isSelectionMode, isSelected, onPress, onMoveUp, onMoveDown, isFirst, isLast }: any) => {
  if (isSelectionMode) {
    return (
      <TouchableOpacity onPress={onPress} className="p-2">
        {isSelected ? <Icons.CheckCircle2 className="text-primary" size={24} /> : <Icons.Circle className="text-text-muted" size={24} />}
      </TouchableOpacity>
    );
  }
  if (onMoveUp || onMoveDown) {
    return (
      <View className="flex-col items-center justify-center -my-1">
        <TouchableOpacity onPress={onMoveUp} disabled={isFirst} className={`p-1.5 ${isFirst ? 'opacity-20' : 'opacity-100'}`} hitSlop={{ top: 10, bottom: 5, left: 10, right: 10 }}>
          <Icons.ChevronUp className="text-text-muted" size={22} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onMoveDown} disabled={isLast} className={`p-1.5 ${isLast ? 'opacity-20' : 'opacity-100'}`} hitSlop={{ top: 5, bottom: 10, left: 10, right: 10 }}>
          <Icons.ChevronDown className="text-text-muted" size={22} />
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View className="p-2">
      {type === 'rest' ? <Icons.Coffee className="text-text-muted" size={24} /> : <Icons.Dumbbell className="text-primary" size={24} />}
    </View>
  );
};

const IntervalNameEditor = ({ name, onNameChange, isSelectionMode }: any) => {
  const [localName, setLocalName] = useState(name);
  const [isFocused, setIsFocused] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => { setLocalName(name); }, [name]);

  useEffect(() => {
    if (isEditable) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isEditable]);

  const handleBlur = () => {
    setIsFocused(false);
    setIsEditable(false);
    if (onNameChange && localName !== name) onNameChange(localName);
  };

  if (!onNameChange) {
    return <Text className="text-white font-bold text-lg text-left flex-1" numberOfLines={1}>{name}</Text>;
  }

  return (
    <View className="flex-1 flex-row items-center">
      <TouchableOpacity 
        onPress={() => { setIsEditable(true); }}
        disabled={isSelectionMode}
        className={`mr-1 p-2 ${isSelectionMode ? 'opacity-30' : 'opacity-100'}`}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icons.Edit2 className="text-text-muted" size={16} />
      </TouchableOpacity>
      <View className={`flex-1 relative pb-1 border-b-2 ${isFocused ? 'border-primary' : 'border-transparent'}`}>
        <TextInput
          ref={inputRef}
          className="text-white font-bold text-lg p-0 text-left w-full placeholder:text-text-muted"
          value={localName}
          onChangeText={setLocalName}
          onFocus={() => {
            setIsFocused(true);
            if (Platform.OS !== 'web') {
              inputRef.current?.setNativeProps({ selection: { start: localName.length, end: localName.length } });
            }
          }}
          onBlur={handleBlur}
          placeholder="Exercise Name"
          maxLength={18}
          editable={!isSelectionMode && isEditable}
        />
      </View>
    </View>
  );
};

const TimeStepper = ({ value, label, onAdjust, isSelectionMode, step, canMinus, canPlus }: any) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const speedRef = useRef(300);

  const startHold = (amount: number) => {
    Keyboard.dismiss();
    speedRef.current = 300; 
    const tick = () => {
      onAdjust(amount);
      speedRef.current = Math.max(70, speedRef.current * 0.85);
      timerRef.current = setTimeout(tick, speedRef.current);
    };
    timerRef.current = setTimeout(tick, speedRef.current);
  };

  const stopHold = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const isDisabledMinus = !canMinus || isSelectionMode;
  const isDisabledPlus = !canPlus || isSelectionMode;

  return (
    <View className="flex-row items-center bg-background rounded-xl px-1 py-1">
      <TouchableOpacity 
        className={`p-2 ${!isDisabledMinus ? 'opacity-100' : 'opacity-30'}`}
        onPress={() => { Keyboard.dismiss(); onAdjust(-step); }}
        onPressIn={() => startHold(-step)} 
        onPressOut={stopHold}
        disabled={isDisabledMinus}
      >
        <Icons.Minus className="text-primary" size={16} strokeWidth={3} />
      </TouchableOpacity>
      
      <View className={`w-10 items-center justify-center ${isSelectionMode ? 'opacity-50' : 'opacity-100'}`}>
        <Text className="text-white text-base font-extrabold leading-tight" style={{ fontVariant: ['tabular-nums'] }}>
          {value < 10 ? `0${value}` : value}
        </Text>
        <Text className="text-text-muted text-[9px] font-bold tracking-tighter -mt-0.5">{label}</Text>
      </View>

      <TouchableOpacity 
        className={`p-2 ${!isDisabledPlus ? 'opacity-100' : 'opacity-30'}`}
        onPress={() => { Keyboard.dismiss(); onAdjust(step); }}
        onPressIn={() => startHold(step)} 
        onPressOut={stopHold}
        disabled={isDisabledPlus}
      >
        <Icons.Plus className="text-primary" size={16} strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
};

// --- Main Component ---

interface IntervalRowProps {
  interval: ExerciseInterval;
  onUpdate: (amount: number) => void;
  onNameChange?: (name: string) => void;
  displayDurationOverride?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const IntervalRow: React.FC<IntervalRowProps> = ({ 
  interval, 
  onUpdate, 
  onNameChange,
  displayDurationOverride,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isSelected,
  isSelectionMode,
  onPress,
  onLongPress
}) => {
  const durationToDisplay = displayDurationOverride !== undefined ? displayDurationOverride : interval.duration;
  const mins = Math.floor(durationToDisplay / 60);
  const secs = durationToDisplay % 60;

  const handleRowPress = () => {
    if (onPress) onPress();
  };

  const isRest = interval.type === 'rest';

  return (
    <View className="pb-4">
      <View 
        className={`flex-row items-center px-4 py-5 rounded-2xl border-2 border-l-[6px] ${
          isSelected ? 'bg-surface-light border-primary shadow-lg scale-[1.01]' : 'bg-surface border-surface-light shadow-sm'
        } ${isRest ? 'border-l-outline' : 'border-l-primary-dark'}`}
      >
        {/* Left Column: Fixed width for perfect alignment across list */}
        <View className="w-12 items-center justify-center mr-3">
          <IntervalIcon 
            type={interval.type} 
            isSelectionMode={isSelectionMode} 
            isSelected={isSelected} 
            onPress={() => onPress && onPress()}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            isFirst={isFirst}
            isLast={isLast}
          />
        </View>

        {/* Right Column: Flexible content */}
        <TouchableOpacity 
          className="flex-1"
          onPress={handleRowPress}
          onLongPress={onLongPress}
          delayLongPress={300}
          activeOpacity={1}
          disabled={!onPress && !onLongPress}
        >
          <View className="flex-col">
            {/* Header: Name */}
            <View className="flex-row items-center mb-4">
              <IntervalNameEditor name={interval.name} onNameChange={onNameChange} isSelectionMode={isSelectionMode} />
            </View>
            
            {/* Footer: Controls */}
            <View className="flex-row items-center">
              <View className="flex-row items-center">
                <TimeStepper 
                  value={mins} 
                  label="MIN" 
                  step={60} 
                  onAdjust={onUpdate} 
                  isSelectionMode={isSelectionMode} 
                  canMinus={durationToDisplay - 60 >= 15} 
                  canPlus={durationToDisplay + 60 <= 3600} 
                />
                <View className="px-2 items-center justify-center">
                  <Text className={`text-text-muted text-lg font-bold ${isSelectionMode ? 'opacity-50' : 'opacity-100'}`}>:</Text>
                </View>
                <TimeStepper 
                  value={secs} 
                  label="SEC" 
                  step={15} 
                  onAdjust={onUpdate} 
                  isSelectionMode={isSelectionMode} 
                  canMinus={durationToDisplay - 15 >= 15} 
                  canPlus={durationToDisplay + 15 <= 3600} 
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
