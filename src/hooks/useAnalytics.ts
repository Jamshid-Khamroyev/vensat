import { useEffect, useRef, useState } from "react";

interface AnalyticsData {
  visitorId: string;
  sessionId: string;
  device: string;
  browser: string;
  os: string;
  screen: string;
  language: string;
  timezone: string;
  referrer: string;
  duration: number;
  maxScroll: number;
  feedback: string;
  scrollSections: string[];
  sectionTime: Record<string, number>;
}

const getVisitorId = () => {
  let id = localStorage.getItem("visitor-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("visitor-id", id);
  }
  return id;
};

const getBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return "Unknown";
};

const getOS = () => {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "MacOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone")) return "iOS";
  return "Unknown";
};

const getDevice = () => {
  return /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : "Desktop";
};

const SECTION_MAP = [
  { min: 0, max: 15, name: "Hero" },
  { min: 15, max: 30, name: "Sources" },
  { min: 30, max: 40, name: "Translate" },
  { min: 40, max: 50, name: "Algorithm" },
  { min: 50, max: 60, name: "Dashboard" },
  { min: 60, max: 70, name: "Reading" },
  { min: 70, max: 80, name: "Practice" },
  { min: 80, max: 90, name: "Testimonials" },
  { min: 90, max: 100, name: "FAQ" },
];

const getSectionName = (scrollPercent: number) => {
  const section = SECTION_MAP.find(s => scrollPercent >= s.min && scrollPercent < s.max);
  return section ? section.name : "Unknown";
};

export const useAnalytics = () => {
  const startTime = useRef(Date.now());
  const visitorId = useRef(getVisitorId());
  const sessionId = useRef(crypto.randomUUID());
  const maxScroll = useRef(0);
  const feedback = useRef("");
  const viewedSections = useRef<Set<string>>(new Set());
  const sectionTime = useRef<Record<string, number>>({});
  const currentSection = useRef<string>("Hero");
  const sectionStartTime = useRef<number>(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  const API_URL = `api/analytics` 

  const trackSectionTime = () => {
    const now = Date.now();
    const elapsed = (now - sectionStartTime.current) / 1000;
    if (elapsed > 0.5) {
      sectionTime.current[currentSection.current] = 
        (sectionTime.current[currentSection.current] || 0) + elapsed;
    }
    sectionStartTime.current = now;
  };

  const getData = (): AnalyticsData => {
    trackSectionTime();
    return {
      visitorId: visitorId.current,
      sessionId: sessionId.current,
      device: getDevice(),
      browser: getBrowser(),
      os: getOS(),
      screen: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer || "Direct",
      duration: Math.floor((Date.now() - startTime.current) / 1000),
      maxScroll: maxScroll.current,
      feedback: feedback.current,
      scrollSections: Array.from(viewedSections.current),
      sectionTime: sectionTime.current,
    };
  };

  const send = async () => {
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getData()),
      });
    } catch {}
  };

  const sendBeacon = () => {
    const data = getData();
    navigator.sendBeacon(API_URL, new Blob([JSON.stringify(data)], { type: "application/json" }));
  };

  useEffect(() => {
    const onScroll = () => {
      const scroll = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      const rounded = Math.round(scroll);
      
      if (rounded > maxScroll.current) {
        maxScroll.current = rounded;
        const section = getSectionName(rounded);
        
        if (section !== currentSection.current) {
          trackSectionTime();
          currentSection.current = section;
          sectionStartTime.current = Date.now();
        }
        
        viewedSections.current.add(section);
      }
    };
    
    window.addEventListener("scroll", onScroll);
    return () => {
      trackSectionTime();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let count = 0;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && count < 3) {
        count++;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (count >= 2) setShowFeedback(true);
        }, 1000);
      }
    };
    document.addEventListener("mouseleave", onLeave);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const onHide = () => {
      trackSectionTime();
      if (document.visibilityState === "hidden") sendBeacon();
    };
    window.addEventListener("pagehide", sendBeacon);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      trackSectionTime();
      window.removeEventListener("pagehide", sendBeacon);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  return {
    showFeedback,
    closeFeedback: () => setShowFeedback(false),
    setFeedback: (text: string) => {
      feedback.current = text;
      send();
    },
  };
};