"use strict";
import { cn } from "../../lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  ...props
}) => {
  const noise = createNoise3D();
  let canvasRef = useRef(null);
  const getSpeed = () => {
    switch (speed) {
      case "slow": return 0.001;
      case "fast": return 0.002;
      default: return 0.001;
    }
  };

  const init = () => {
    let canvas = canvasRef.current;
    let ctx = canvas.getContext("2d");
    let w = (ctx.canvas.width = window.innerWidth);
    let h = (ctx.canvas.height = window.innerHeight);
    ctx.filter = `blur(${blur}px)`;
    let nt = 0;

    window.onresize = function () {
      w = ctx.canvas.width = window.innerWidth;
      h = ctx.canvas.height = window.innerHeight;
      ctx.filter = `blur(${blur}px)`;
    };

    const render = () => {
      nt += getSpeed();
      ctx.fillStyle = backgroundFill || "black";
      ctx.fillRect(0, 0, w, h);
      drawWave(5);
      requestAnimationFrame(render);
    };

    const drawWave = (n) => {
      let waveColors = colors ?? ["#e53935", "#b71c1c", "#ff5252", "#ff1744", "#d32f2f"];
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.lineWidth = waveWidth || 50;
        ctx.strokeStyle = waveColors[i % waveColors.length];
        for (let x = 0; x < w; x += 5) {
          let y = noise(x / 800, 0.3 * i, nt) * 100;
          ctx.lineTo(x, y + h * 0.5);
        }
        ctx.stroke();
        ctx.closePath();
      }
    };
    render();
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div className={cn("h-screen flex flex-col items-center justify-center", containerClassName)}>
      <canvas className="absolute inset-0 z-0" ref={canvasRef} id="canvas"></canvas>
      <div className={cn("relative z-10", className)} {...props}>
        {children}
      </div>
    </div>
  );
};