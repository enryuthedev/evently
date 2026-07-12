import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

export interface ScreenProps {
  /** When true, content scrolls in a ScrollView. Default: false. */
  scroll?: boolean;
  /** Safe-area edges to apply. Default: ['top']. */
  edges?: Edge[];
  /** Classes merged onto the outer SafeAreaView. */
  className?: string;
  /** Classes for the content container (View or ScrollView contentContainer). */
  contentClassName?: string;
  children: ReactNode;
  /** Sticky bottom node rendered outside the scroll area. */
  footer?: ReactNode;
}

/**
 * Keyboard-aware scrolling that works in Expo Go on BOTH iOS and Android.
 *
 * Why custom: `automaticallyAdjustKeyboardInsets` is iOS-only and
 * `android.softwareKeyboardLayoutMode` (app.json) does NOT apply inside Expo Go
 * (only in native builds). So on Android in Expo Go nothing moved the view.
 *
 * This listens for the keyboard, adds a bottom spacer the size of the keyboard
 * (so there's room to scroll), then measures the currently focused input and
 * scrolls it above the keyboard. Pure JS, no native module, no extra dependency.
 */
function useKeyboardAwareScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const [kbPad, setKbPad] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: { endCoordinates?: { height: number } }) => {
      const kbHeight = e.endCoordinates?.height ?? 0;
      setKbPad(kbHeight);

      // Scroll the focused input into the area left above the keyboard.
      const focused = TextInput.State.currentlyFocusedInput?.() as
        | { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void }
        | null;
      setTimeout(() => {
        if (!focused?.measureInWindow || !scrollRef.current) return;
        focused.measureInWindow((_x, y, _w, h) => {
          const winHeight = Dimensions.get('window').height;
          const visibleBottom = winHeight - kbHeight;
          const inputBottom = y + h;
          if (inputBottom > visibleBottom - 16) {
            const delta = inputBottom - visibleBottom + 40;
            scrollRef.current?.scrollTo({ y: scrollY.current + delta, animated: true });
          }
        });
      }, 60);
    };
    const onHide = () => setKbPad(0);

    const showSub = Keyboard.addListener(showEvt, onShow);
    const hideSub = Keyboard.addListener(hideEvt, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  };

  return { scrollRef, kbPad, onScroll };
}

/**
 * Page wrapper — SafeArea + warm background, flex-1. Optionally scrolls.
 * Handles keyboard avoidance everywhere (see `useKeyboardAwareScroll`).
 * `footer` is pinned to the bottom, outside the scroll area. See CONTRACT.md §4.
 */
export function Screen({
  scroll = false,
  edges = ['top'],
  className,
  contentClassName,
  children,
  footer,
}: ScreenProps) {
  const { scrollRef, kbPad, onScroll } = useKeyboardAwareScroll();

  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-background ${className ?? ''}`}>
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName={contentClassName}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {children}
          {/* Spacer so inputs near the bottom can scroll above the keyboard. */}
          <View style={{ height: kbPad }} />
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View className={`flex-1 ${contentClassName ?? ''}`}>{children}</View>
        </KeyboardAvoidingView>
      )}
      {footer ? (
        <SafeAreaView edges={['bottom']} className="bg-background">
          {footer}
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  );
}

export default Screen;
