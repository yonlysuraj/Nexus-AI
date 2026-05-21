import { useEffect } from "react";

/**
 * A hook that listens for Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
 * and triggers a callback if the provided condition is met.
 *
 * @param callback The function to execute
 * @param disabled If true, the shortcut won't trigger the callback
 */
export function useKeyboardShortcut(
  callback: () => void,
  disabled: boolean = false
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + Enter
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (!disabled) {
          e.preventDefault();
          callback();
        }
      }
    };

    // Attach to the document so it works anywhere on the page,
    // including inside textareas or inputs.
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [callback, disabled]);
}
