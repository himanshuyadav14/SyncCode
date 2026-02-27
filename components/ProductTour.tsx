"use client";

import { useEffect, useState } from "react";
import Joyride, { Step } from "react-joyride";

export default function ProductTour() {
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    // Check local storage to ensure the tour runs only once
    const tourCompleted = localStorage.getItem("synccode-tour-completed");
    if (!tourCompleted) {
      setRunTour(true);
    }
  }, []);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = ["finished", "skipped"];

    // When user finishes or skips the tour, save it in local storage
    if (finishedStatuses.includes(status)) {
      localStorage.setItem("synccode-tour-completed", "true");
      setRunTour(false);
    }
  };

  const steps: Step[] = [
    {
      target: ".tour-editor",
      content: "This is where the magic happens. Collaborate in real-time.",
      disableBeacon: true,
    },
    {
      target: ".tour-language",
      content: "Switch between C++, Python, Java, and SQL.",
    },
    {
      target: ".tour-run-code",
      content: "Execute your code or SQL queries instantly.",
    },
    {
      target: ".tour-timer",
      content:
        "Keep track of your interview time here. It's synced for everyone!",
    },
    {
      target: ".tour-invite",
      content: "Invite your friends or interviewer via Email or Link.",
    },
  ];

  if (!runTour) return null;

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: "#111113",
          backgroundColor: "#111113",
          overlayColor: "rgba(0, 0, 0, 0.6)",
          primaryColor: "#4f9cf9", // Match Accent Blue
          textColor: "#f4f4f5", // Text Primary
          zIndex: 1000,
        },
        tooltip: {
          border: "1px solid #1f1f23",
          borderRadius: "8px",
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        buttonNext: {
          backgroundColor: "#4f9cf9", // Match Accent Blue
          borderRadius: "6px",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: 600,
        },
        buttonBack: {
          color: "#a1a1aa", // Text Muted
          fontSize: "13px",
          marginLeft: "auto",
          marginRight: 10,
        },
        buttonSkip: {
          color: "#a1a1aa", // Text Muted
          fontSize: "13px",
        },
      }}
    />
  );
}
