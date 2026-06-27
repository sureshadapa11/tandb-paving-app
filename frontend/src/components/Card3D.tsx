import React from "react";
import { StyleSheet, ViewStyle, Pressable } from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

const SPRING = { damping: 15, stiffness: 160 };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Tilt3D — lightweight 3D press depth. Uses a plain Pressable (NO pan gesture)
 * so it never competes with parent ScrollView/FlatList scrolling. On press it
 * scales up slightly and tilts back for a tactile 3D feel.
 */
export function Tilt3D({
  children, onPress, style, testID,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  max?: number; // accepted for API compatibility (unused)
  testID?: string;
}) {
  const sc = useSharedValue(1);
  const rot = useSharedValue(0);

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { scale: sc.value },
      { rotateX: `${rot.value}deg` },
    ],
  }));

  return (
    <AnimatedPressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => { sc.value = withSpring(1.03, SPRING); rot.value = withSpring(5, SPRING); }}
      onPressOut={() => { sc.value = withSpring(1, SPRING); rot.value = withSpring(0, SPRING); }}
      style={[style, aStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

/**
 * FlipCard — tap to flip between front and back in true 3D (rotateY).
 * Tap gesture (maxDistance) yields to scrolling, so it stays smooth in lists.
 */
export function FlipCard({
  front, back, height = 200, style, testID,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  height?: number;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
}) {
  const spin = useSharedValue(0);

  const flip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    spin.value = withTiming(spin.value < 0.5 ? 1 : 0, { duration: 450 });
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(spin.value, [0, 1], [0, 180])}deg` }],
    opacity: spin.value < 0.5 ? 1 : 0,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(spin.value, [0, 1], [180, 360])}deg` }],
    opacity: spin.value >= 0.5 ? 1 : 0,
  }));

  const tap = Gesture.Tap().maxDistance(12).onEnd(() => runOnJS(flip)());

  return (
    <GestureDetector gesture={tap}>
      <Animated.View testID={testID} style={[{ height }, style]}>
        <Animated.View style={[styles.face, frontStyle]}>{front}</Animated.View>
        <Animated.View style={[styles.face, backStyle]}>{back}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  face: { ...StyleSheet.absoluteFillObject, backfaceVisibility: "hidden" },
});
