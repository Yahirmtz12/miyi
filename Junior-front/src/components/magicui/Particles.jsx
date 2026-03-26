import React, { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

export default function Particles({
  className = "",
  quantity = 100,
  staticity = 50,
  ease = 50,
  color = "#ffffff",
  refresh = false,
}) {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const context = useRef(null);
  const circles = useRef([]);
  const mousePosition = useRef({ x: 0, y: 0 });
  const mouse = useRef({ x: 0, y: 0 });
  const canvasSize = useRef({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d");
    }
    initCanvas();
    animate();
    window.addEventListener("resize", initCanvas);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("resize", initCanvas);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [color]);

  const initCanvas = () => {
    resizeCanvas();
    drawParticles();
  };

  const onMouseMove = (e) => {
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const { w, h } = canvasSize.current;
      const x = e.clientX - rect.left - w / 2;
      const y = e.clientY - rect.top - h / 2;
      const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
      if (inside) {
        mousePosition.current.x = e.clientX - rect.left;
        mousePosition.current.y = e.clientY - rect.top;
      }
    }
  };

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current = [];
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      context.current.scale(dpr, dpr);
    }
  };

  const circleParams = () => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const translateX = 0;
    const translateY = 0;
    const size = Math.floor(Math.random() * 3) + 1; // Antes era +0.1, ahora son más grandes
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.8 + 0.4).toFixed(1)); // Más opacas
    const dx = (Math.random() - 0.5) * 0.2;
    const dy = (Math.random() - 0.5) * 0.2;
    const magnetism = 0.1 + Math.random() * 4;
    return { x, y, translateX, translateY, size, alpha, targetAlpha, dx, dy, magnetism };
  };

  const drawCircle = (circle, update = false) => {
    if (context.current) {
      const { x, y, translateX, translateY, size, alpha } = circle;
      context.current.translate(translateX, translateY);
      context.current.beginPath();
      context.current.arc(x, y, size, 0, 2 * Math.PI);
      context.current.fillStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, "0")}`;
      context.current.fill();
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!update) {
        circles.current.push(circle);
      }
    }
  };

  const drawParticles = () => {
    circles.current = [];
    for (let i = 0; i < quantity; i++) {
      drawCircle(circleParams());
    }
  };

  const animate = () => {
    if (context.current) {
      context.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
      circles.current.forEach((circle, i) => {
        // Movimiento básico
        circle.x += circle.dx;
        circle.y += circle.dy;
        
        // Rebotar en bordes
        if (circle.x < 0 || circle.x > canvasSize.current.w) circle.dx *= -1;
        if (circle.y < 0 || circle.y > canvasSize.current.h) circle.dy *= -1;

        // Aparición suave
        if (circle.alpha < circle.targetAlpha) {
          circle.alpha += 0.02;
        }

        drawCircle(circle, true);
      });
      window.requestAnimationFrame(animate);
    }
  };

  return (
    <div className={className} ref={canvasContainerRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}