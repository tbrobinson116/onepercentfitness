import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography, borderRadius, shadows, spacing } from '../theme';

// ---- Animated Pressable Button ----
export function PressableScale({
  children,
  onPress,
  style,
  disabled,
  activeOpacity = 0.9,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  activeOpacity?: number;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.4 : 1,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={activeOpacity}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---- Section Header ----
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={sectionStyles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  title: {
    ...typography.label,
    color: colors.textSecondary,
  },
  action: {
    ...typography.captionBold,
    color: colors.accent,
  },
});

// ---- Card ----
export function Card({
  children,
  style,
  onPress,
  entering,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  entering?: any;
}) {
  const cardContent = (
    <Animated.View
      entering={entering}
      style={[cardStyles.container, style]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress}>
        {cardContent}
      </PressableScale>
    );
  }
  return cardContent;
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardLight,
  },
});

// ---- Circular Progress Ring ----
export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color = colors.accent,
  bgColor = colors.border,
  children,
}: {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
    </View>
  );
}

// ---- Pill/Chip selector ----
export function ChipSelector({
  options,
  selected,
  onSelect,
  multi = false,
}: {
  options: { key: string; label: string; icon?: string }[];
  selected: string | string[];
  onSelect: (key: string) => void;
  multi?: boolean;
}) {
  const isSelected = (key: string) =>
    Array.isArray(selected) ? selected.includes(key) : selected === key;

  return (
    <View style={chipStyles.container}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[chipStyles.chip, isSelected(opt.key) && chipStyles.chipActive]}
          onPress={() => onSelect(opt.key)}
          activeOpacity={0.7}
        >
          {opt.icon && <Text style={chipStyles.icon}>{opt.icon}</Text>}
          <Text style={[chipStyles.label, isSelected(opt.key) && chipStyles.labelActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  icon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  label: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.accentLight,
  },
});

// ---- Icon Button ----
export function IconButton({
  icon,
  size = 24,
  color = colors.text,
  onPress,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={style} activeOpacity={0.7}>
      <Ionicons name={icon} size={size} color={color} />
    </TouchableOpacity>
  );
}

// ---- Empty State ----
export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={emptyStyles.container}>
      <View style={emptyStyles.iconContainer}>
        <Ionicons name={icon} size={40} color={colors.textMuted} />
      </View>
      <Text style={emptyStyles.title}>{title}</Text>
      {subtitle && <Text style={emptyStyles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={emptyStyles.action}>
          <Text style={emptyStyles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.xxl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  action: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accentDim,
    borderRadius: borderRadius.full,
  },
  actionText: {
    ...typography.captionBold,
    color: colors.accent,
  },
});

// ---- Macro Ring (compact, for nutrition) ----
export function MacroRing({
  label,
  current,
  target,
  unit,
  color,
  size = 64,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  size?: number;
}) {
  const progress = target > 0 ? current / target : 0;
  return (
    <View style={{ alignItems: 'center' }}>
      <ProgressRing progress={progress} size={size} strokeWidth={5} color={color}>
        <Text style={{ ...typography.smallBold, color: colors.text }}>{current}</Text>
      </ProgressRing>
      <Text style={{ ...typography.small, color: colors.textSecondary, marginTop: 4 }}>
        {label}
      </Text>
      <Text style={{ ...typography.small, color: colors.textMuted }}>
        / {target}{unit}
      </Text>
    </View>
  );
}
