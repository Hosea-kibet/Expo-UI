"use client";

import { useEffect, useState } from "react";

type PagePreloaderProps = {
  bodyClassName: string;
};

export function PagePreloader({ bodyClassName }: PagePreloaderProps) {
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const started = Date.now();
    const previous = document.body.className;
    document.body.className = `${bodyClassName} loading`;

    const timer = window.setTimeout(() => {
      setIsDone(true);
      document.body.className = bodyClassName;
    }, Math.max(0, 850 - (Date.now() - started)));

    return () => {
      window.clearTimeout(timer);
      document.body.className = previous;
    };
  }, []);

  return (
    <div
      className={`register-preloader${isDone ? " is-done" : ""}`}
      id="register-preloader"
      aria-label="Loading Agri Africa"
    >
      <img src="/assets/logo-wordmark-dark.svg" alt="Agri Africa" />
      <span />
    </div>
  );
}
