import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing } from 'react-native';

/** True while VoiceOver or TalkBack is on, so timed questions can allow more time. */
export function useScreenReader(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isScreenReaderEnabled().then((value) => { if (alive) setOn(value); }).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setOn);
    return () => { alive = false; subscription.remove(); };
  }, []);
  return on;
}

/**
 * A question clock for timed battles.
 *
 * Counts `seconds` down while `running` and starts over whenever `round`
 * changes. Stopping pauses it (the feedback after an answer is never timed);
 * it fires `onExpire` once when it reaches zero. `progress` runs 1 → 0 for a
 * bar on the native driver, `left` is whole seconds for the label, and
 * `remaining()` is the exact time left at the moment an answer lands.
 */
export function useCountdown(seconds: number, running: boolean, round: string | number, onExpire: () => void) {
  // Leaving the app pauses the clock; nobody should lose a question to a phone call.
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  const live = running && active;
  const progress = useRef(new Animated.Value(1)).current;
  const [left, setLeft] = useState(seconds);
  const remainingMs = useRef(seconds * 1000);
  const endsAt = useRef(0);
  const ticking = useRef(false);
  const fired = useRef(false);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  // A new question gets the whole clock. Declared first so it runs before the
  // effect below starts the new round.
  useEffect(() => {
    remainingMs.current = seconds * 1000;
    fired.current = false;
    progress.setValue(1);
    setLeft(seconds);
  }, [round, seconds, progress]);

  useEffect(() => {
    if (!live || fired.current || remainingMs.current <= 0) return;
    ticking.current = true;
    endsAt.current = Date.now() + remainingMs.current;
    const animation = Animated.timing(progress, { toValue: 0, duration: remainingMs.current, easing: Easing.linear, useNativeDriver: true });
    animation.start();
    const tick = setInterval(() => {
      const ms = Math.max(0, endsAt.current - Date.now());
      setLeft(Math.ceil(ms / 1000));
      if (ms <= 0 && !fired.current) {
        fired.current = true;
        clearInterval(tick);
        expire.current();
      }
    }, 200);
    return () => {
      clearInterval(tick);
      animation.stop();
      ticking.current = false;
      remainingMs.current = Math.max(0, endsAt.current - Date.now());
    };
  }, [live, round, seconds, progress]);

  const remaining = () => (ticking.current ? Math.max(0, endsAt.current - Date.now()) : remainingMs.current) / 1000;
  return { progress, left, total: seconds, remaining };
}

export type Countdown = ReturnType<typeof useCountdown>;
