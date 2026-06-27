import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

const SPRING = { damping: 14, stiffness: 140 };

/**
 * Tilt3D — a card that tilts in 3D toward the finger (parallax depth) and
 * lifts on press. Falls back to a simple press if gestures aren't available.
 */
export function Tilt3D({
  children, onPress, style, max = 14, testID,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  max?: number;
  testID?: string;
}) {
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const sc = useSharedValue(1);
  const w = useSharedValue(1);
  const h = useSharedValue(1);

  const pan = Gesture.Pan()
    .onBegin(() => { sc.value = withSpring(1.04, SPRING); })
    .onUpdate((e) => {
      ry.value = (e.x / w.value - 0.5) * max * 2;
      rx.value = -(e.y / h.value - 0.5) * max * 2;
    })
    .onFinalize(() => {
      rx.value = withSpring(0, SPRING);
      ry.value = withSpring(0, SPRING);
      sc.value = withSpring(1, SPRING);
    });

  const tap = Gesture.Tap().maxDistance(12).onEnd(() => {
    if (onPress) runOnJS(onPress)();
  });

  const gesture = Gesture.Simultaneous(pan, tap);

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${rx.value}deg` },
      { rotateY: `${ry.value}deg` },
      { scale: sc.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        testID={testID}
        onLayout={(e) => { w.value = e.nativeEvent.layout.width; h.value = e.nativeEvent.layout.height; }}
        style={[style, aStyle]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

/**
 * FlipCard — tap to flip between front and back in true 3D (rotateY).
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

  const tap = Gesture.Tap().maxDistance(14).onEnd(() => runOnJS(flip)());

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
