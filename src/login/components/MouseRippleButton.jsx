import React, { useState } from "react";

export default function MouseRippleButton({
  children,
  className = "",
  style,
  ...props
}) {
  const [ripples, setRipples] = useState([]);

  const createRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      x,
      y,
      size: Math.max(rect.width, rect.height),
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  return (
    <button
      {...props}
      onClick={(e) => {
        createRipple(e);
        if (props.onClick) props.onClick(e);
      }}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full opacity-50 animate-ripple"
          style={{
            backgroundColor: "#E1D6C4", // 🌟 warna ripple
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </button>
  );
}
