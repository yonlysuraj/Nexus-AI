"use client";

import { useCallback, useRef, useState } from "react";

export function useStream() {
  const [data, setData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setData("");
    setError(null);
    setIsLoading(false);
  }, []);

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsLoading(false);
  }, []);

  const start = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      reset();
      setIsLoading(true);

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const response = await fetch(input, { ...init, signal: controller.signal });
        if (!response.ok || !response.body) {
          throw new Error(`Stream failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setData((prev) => prev + chunk);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message || "Stream failed");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [reset]
  );

  return { data, error, isLoading, start, reset, abort };
}
