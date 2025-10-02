import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for countdown timer with start, pause, and reset functionality
 * Handles edge cases like tab switching and component unmounting
 *
 * @param {number} duration - Initial duration in seconds
 * @param {Function} onTimeUp - Callback when timer reaches 0
 * @returns {Object} Timer state and controls
 */
export function useTimer(duration, onTimeUp) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  // Use refs to avoid stale closures and enable cleanup
  const intervalRef = useRef(null);
  const onTimeUpRef = useRef(onTimeUp);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(duration);

  // Keep onTimeUp callback ref updated
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Start the timer
  const start = useCallback(() => {
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, []);

  // Pause the timer
  const pause = useCallback(() => {
    setIsRunning(false);
    pausedTimeRef.current = timeRemaining;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [timeRemaining]);

  // Reset the timer to initial duration
  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(duration);
    pausedTimeRef.current = duration;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [duration]);

  // Main timer effect
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    // Record when we started for accurate timing
    const startTime = Date.now();
    const initialTime = pausedTimeRef.current;

    // Use setInterval for consistent updates
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const newTime = Math.max(0, initialTime - elapsed);

      setTimeRemaining(newTime);
      pausedTimeRef.current = newTime;

      // Check if time is up
      if (newTime <= 0) {
        setIsRunning(false);
        clearInterval(intervalRef.current);
        intervalRef.current = null;

        // Call the onTimeUp callback
        if (onTimeUpRef.current) {
          onTimeUpRef.current();
        }
      }
    }, 100); // Update every 100ms for smooth countdown

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeRemaining,
    isRunning,
    start,
    pause,
    reset
  };
}

export default useTimer;
