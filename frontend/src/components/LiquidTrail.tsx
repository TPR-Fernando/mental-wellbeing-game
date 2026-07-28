import { useEffect, useRef } from 'react';

const BALL_COUNT = 16;

interface LiquidTrailProps {
  /** Accent color for the cursor bobble balls */
  accentColor?: string;
}

interface Ball {
  el: HTMLDivElement;
  x: number;
  y: number;
}

/**
 * Liquid mouse-trail effect.
 * Uses spring-physics chained DOM circles + an SVG goo filter so nearby
 * blobs merge seamlessly, giving a viscous liquid feel.
 */
export function LiquidTrail({ accentColor = 'rgba(147, 95, 255, 0.92)' }: LiquidTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const colorRef = useRef<string>(accentColor);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Build chain of circles — head is largest, tail is smallest
    const balls: Ball[] = [];
    for (let i = 0; i < BALL_COUNT; i++) {
      const t = 1 - i / BALL_COUNT;
      const size = 8 + t * 26;
      const el = document.createElement('div');
      el.style.cssText = [
        'position:absolute',
        'border-radius:50%',
        `width:${size}px`,
        `height:${size}px`,
        'background:' + colorRef.current,
        'transform:translate(-50%,-50%)',
        'left:-1000px',
        'top:-1000px',
      ].join(';');
      container.appendChild(el);
      balls.push({ el, x: -1000, y: -1000 });
    }
    ballsRef.current = balls;

    // Update color ref when accentColor prop changes (reactive color updates)
    colorRef.current = accentColor;

    const mouse = { x: -1000, y: -1000 };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let raf: number;

    const animate = () => {
      // Head springs toward cursor
      balls[0].x += (mouse.x - balls[0].x) * 0.28;
      balls[0].y += (mouse.y - balls[0].y) * 0.28;

      // Each ball springs toward the one in front of it (slower toward tail)
      for (let i = 1; i < balls.length; i++) {
        const lag = Math.max(0.22 - i * 0.008, 0.04);
        balls[i].x += (balls[i - 1].x - balls[i].x) * lag;
        balls[i].y += (balls[i - 1].y - balls[i].y) * lag;
      }

      balls.forEach(b => {
        b.el.style.left = `${b.x}px`;
        b.el.style.top = `${b.y}px`;
      });

      raf = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      balls.forEach(b => b.el.remove());
      ballsRef.current = [];
    };
  }, []);

  // Effect to update ball colors when accentColor changes
  useEffect(() => {
    if (colorRef.current === accentColor) return;
    colorRef.current = accentColor;
    ballsRef.current.forEach(b => {
      b.el.style.background = accentColor;
    });
  }, [accentColor]);

  return (
    <>
      {/* SVG goo filter — blurs then thresholds alpha so close blobs merge */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <filter id="liquid-goo" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
              result="goo"
            />
          </filter>
        </defs>
      </svg>

      {/* Ball container — the goo filter is applied here */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          filter: 'url(#liquid-goo)',
          overflow: 'hidden',
        }}
      />
    </>
  );
}
