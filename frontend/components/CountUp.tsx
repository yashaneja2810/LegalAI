"use client";

import { useEffect, useState, useRef } from "react";

interface CountUpProps {
  from?: number;
  to: number;
  duration?: number;
  separator?: string;
  direction?: "up" | "down";
  className?: string;
}

const CountUp = ({
  from = 0,
  to,
  duration = 1,
  separator = "",
  direction = "up",
  className = "",
}: CountUpProps) => {
  const [count, setCount] = useState(from);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const startValue = direction === "up" ? from : to;
    const endValue = direction === "up" ? to : from;
    const difference = endValue - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = Math.round(startValue + difference * easeOutQuart);
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, from, to, duration, direction]);

  const formatNumber = (num: number) => {
    if (separator === ",") {
      return num.toLocaleString();
    }
    return num.toString();
  };

  return (
    <span ref={elementRef} className={className}>
      {formatNumber(count)}
    </span>
  );
};

export default CountUp;
