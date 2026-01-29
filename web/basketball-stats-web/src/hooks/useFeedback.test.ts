/**
 * Tests for useFeedback hook
 * Web equivalent of mobile's useSoundFeedback
 * Tests audio feedback via Web Audio API and haptic feedback via Vibration API
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useFeedback } from "./useFeedback";

describe("useFeedback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clear any previous calls to mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("hook initialization", () => {
    it("returns all expected feedback methods", () => {
      const { result } = renderHook(() => useFeedback());

      expect(result.current).toHaveProperty("confirm");
      expect(result.current).toHaveProperty("made");
      expect(result.current).toHaveProperty("missed");
      expect(result.current).toHaveProperty("foul");
      expect(result.current).toHaveProperty("foulOut");
      expect(result.current).toHaveProperty("timeout");
      expect(result.current).toHaveProperty("overtime");
      expect(result.current).toHaveProperty("error");
    });

    it("all methods are functions", () => {
      const { result } = renderHook(() => useFeedback());

      expect(typeof result.current.confirm).toBe("function");
      expect(typeof result.current.made).toBe("function");
      expect(typeof result.current.missed).toBe("function");
      expect(typeof result.current.foul).toBe("function");
      expect(typeof result.current.foulOut).toBe("function");
      expect(typeof result.current.timeout).toBe("function");
      expect(typeof result.current.overtime).toBe("function");
      expect(typeof result.current.error).toBe("function");
    });
  });

  describe("confirm feedback", () => {
    it("triggers vibration with correct pattern", () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.confirm();
      });

      expect(navigator.vibrate).toHaveBeenCalledWith(50);
    });

    it("creates audio context and oscillator", () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.confirm();
      });

      // AudioContext should be created
      expect(window.AudioContext).toHaveBeenCalled();
    });
  });

  describe("made shot feedback", () => {
    it("triggers success vibration pattern", () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.made();
      });

      expect(navigator.vibrate).toHaveBeenCalledWith([30, 20, 30]);
    });
  });

  describe("missed shot feedback", () => {
    it("triggers short vibration", () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.missed();
      });

      expect(navigator.vibrate).toHaveBeenCalledWith(30);
    });
  });

  describe("foul feedback", () => {
    it("triggers warning vibration pattern", () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.foul();
      });

      expect(navigator.vibrate).toHaveBeenCalledWith([50, 30, 50]);
    });
  });

  describe("foulOut feedback", () => {
    it("triggers long alert vibration pattern", () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.foulOut();
      });

      expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100, 50, 100]);
    });
  });

  describe("timeout feedback", () => {
    it("triggers timeout vibration pattern", () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.timeout();
      });

      expect(navigator.vibrate).toHaveBeenCalledWith([50, 50, 50]);
    });

    it("plays double beep with delay", () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.timeout();
      });

      // First call happens immediately
      expect(window.AudioContext).toHaveBeenCalled();

      // Advance timer for second beep
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // The hook should have played two tones (via setTimeout)
    });
  });

  describe("overtime feedback", () => {
    it("triggers overtime vibration pattern", () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.overtime();
      });

      expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100, 50, 100]);
    });

    it("plays ascending tone sequence", () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.overtime();
      });

      // First tone plays immediately
      expect(window.AudioContext).toHaveBeenCalled();

      // Advance for second and third tones
      act(() => {
        vi.advanceTimersByTime(200);
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Three tones should have been scheduled
    });
  });

  describe("error feedback", () => {
    it("triggers error vibration pattern", () => {
      const { result } = renderHook(() => useFeedback());

      act(() => {
        result.current.error();
      });

      expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100]);
    });
  });

  describe("vibration patterns", () => {
    it("all feedback methods call vibrate with expected patterns", () => {
      const { result } = renderHook(() => useFeedback());

      // Test all vibration patterns
      act(() => {
        result.current.confirm();
      });
      expect(navigator.vibrate).toHaveBeenLastCalledWith(50);

      act(() => {
        result.current.made();
      });
      expect(navigator.vibrate).toHaveBeenLastCalledWith([30, 20, 30]);

      act(() => {
        result.current.missed();
      });
      expect(navigator.vibrate).toHaveBeenLastCalledWith(30);

      act(() => {
        result.current.foul();
      });
      expect(navigator.vibrate).toHaveBeenLastCalledWith([50, 30, 50]);

      act(() => {
        result.current.foulOut();
      });
      expect(navigator.vibrate).toHaveBeenLastCalledWith([100, 50, 100, 50, 100]);

      act(() => {
        result.current.timeout();
      });
      expect(navigator.vibrate).toHaveBeenLastCalledWith([50, 50, 50]);

      act(() => {
        result.current.overtime();
      });
      expect(navigator.vibrate).toHaveBeenLastCalledWith([100, 50, 100, 50, 100]);

      act(() => {
        result.current.error();
      });
      expect(navigator.vibrate).toHaveBeenLastCalledWith([100, 50, 100]);
    });
  });

  describe("mock verification", () => {
    it("AudioContext is available in test environment", () => {
      expect(window.AudioContext).toBeDefined();
      expect(typeof window.AudioContext).toBe("function");
    });

    it("navigator.vibrate is available in test environment", () => {
      expect(navigator.vibrate).toBeDefined();
      expect(typeof navigator.vibrate).toBe("function");
    });

    it("webkitAudioContext is available as fallback", () => {
      expect(window.webkitAudioContext).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("does not throw when calling feedback methods", () => {
      const { result } = renderHook(() => useFeedback());

      expect(() => {
        act(() => {
          result.current.confirm();
          result.current.made();
          result.current.missed();
          result.current.foul();
          result.current.foulOut();
          result.current.timeout();
          result.current.overtime();
          result.current.error();
        });
      }).not.toThrow();
    });
  });

  describe("method stability", () => {
    it("methods are stable across re-renders", () => {
      const { result, rerender } = renderHook(() => useFeedback());

      const initialConfirm = result.current.confirm;
      const initialMade = result.current.made;

      rerender();

      expect(result.current.confirm).toBe(initialConfirm);
      expect(result.current.made).toBe(initialMade);
    });
  });
});
