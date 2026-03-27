import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Grid, Float, Stars } from "@react-three/drei";

export function PerspectiveBackground() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        background: "radial-gradient(circle at center, #1e293b 0%, #000000 80%)",
      }}
    >
      <Canvas camera={{ position: [6, 6, 12], fov: 50 }} background="black">
        <PerspectiveGrid />
      </Canvas>
    </div>
  );
}

export function FlipText({ children, className, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={className} ref={elementRef}>
      {children.split("").map((char, index) => (
        <span
          key={index}
          className="inline-block transition-all duration-500"
          style={{
            transform: isVisible ? "rotateX(0deg)" : "rotateX(90deg)",
            opacity: isVisible ? 1 : 0,
            transitionDelay: `${index * 0.05}s`,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}

export function SpotlightNavbar({ items, className, onItemClick, defaultActiveIndex = 0 }) {
  const navRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
  const [hoverX, setHoverX] = useState(null);
  const spotlightX = useRef(0);
  const ambienceX = useRef(0);

  useEffect(() => {
    if (!navRef.current) return;
    const nav = navRef.current;

    const handleMouseMove = (e) => {
      const rect = nav.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setHoverX(x);
      spotlightX.current = x;
      nav.style.setProperty("--spotlight-x", `${x}px`);
    };

    const handleMouseLeave = () => {
      setHoverX(null);
      const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`);
      if (activeItem) {
        const navRect = nav.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        const targetX = itemRect.left - navRect.left + itemRect.width / 2;
        animate(spotlightX.current, targetX, {
          type: "spring",
          stiffness: 200,
          damping: 20,
          onUpdate: (v) => {
            spotlightX.current = v;
            nav.style.setProperty("--spotlight-x", `${v}px`);
          },
        });
      }
    };

    nav.addEventListener("mousemove", handleMouseMove);
    nav.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      nav.removeEventListener("mousemove", handleMouseMove);
      nav.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [activeIndex]);

  useEffect(() => {
    if (!navRef.current) return;
    const nav = navRef.current;
    const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`);
    if (activeItem) {
      const navRect = nav.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const targetX = itemRect.left - navRect.left + itemRect.width / 2;
      animate(ambienceX.current, targetX, {
        type: "spring",
        stiffness: 200,
        damping: 20,
        onUpdate: (v) => {
          ambienceX.current = v;
          nav.style.setProperty("--ambience-x", `${v}px`);
        },
      });
    }
  }, [activeIndex]);

  const handleClick = (item, idx) => {
    setActiveIndex(idx);
    onItemClick?.(item, idx);
  };

  return (
    <div className={`relative flex justify-center pt-6 ${className || ""}`}>
      <nav
        ref={navRef}
        className="relative h-16 overflow-hidden rounded-full border border-white/20 bg-black/30 shadow-2xl backdrop-blur-xl"
        style={{
          "--spotlight-x": "0px",
          "--ambience-x": "0px",
        }}
      >
        <ul className="relative z-10 flex h-full items-center gap-3 px-5">
          {items.map((item, idx) => (
            <li key={idx} className="relative flex h-full items-center justify-center">
              <a
                href={item.href || item.to}
                data-index={idx}
                onClick={(e) => {
                  e.preventDefault();
                  handleClick(item, idx);
                }}
                className={`rounded-full px-6 py-2.5 text-lg font-bold transition-all duration-200 ${
                  activeIndex === idx
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-neutral-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            opacity: hoverX !== null ? 1 : 0,
            background: "radial-gradient(220px circle at var(--spotlight-x) 100%, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
          }}
        />

        <div
          className="pointer-events-none absolute bottom-0 left-0 z-10 h-[3px] w-full"
          style={{
            background: "radial-gradient(140px circle at var(--ambience-x) 0%, rgba(0, 255, 255, 0.9) 0%, transparent 100%)",
          }}
        />

        <div className="absolute bottom-0 left-0 z-0 h-[1px] w-full bg-white/20" />
      </nav>
    </div>
  );
}

export function PublicHeader({ navigate, activeIndex = 0 }) {
  const items = [
    { label: "Accueil", href: "/welcome" },
    { label: "Connexion", href: "/login" },
    { label: "Inscription", href: "/register" },
  ];

  return (
    <>
      <div className="mx-auto flex w-full max-w-7xl itemms-center justify-between gap-4 px-4 pt-6">
        <button
          type="button"
          onClick={() => navigate("/welcome")}
          className="group flex items-center gap-5 rounded-[2rem] border border-white/15 bg-black/35 px-5 py-4 text-left backdrop-blur-xl transition hover:border-cyan-300/40 hover:bg-black/45"
        >
          <div className="grid h-20 w-20 place-items-center rounded-[1.7rem] bg-gradient-to-br from-cyan-400 via-sky-400 to-fuchsia-500 text-2xl font-black text-slate-950 shadow-[0_20px_50px_rgba(34,211,238,0.3)]">
            EP
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.34em] text-cyan-300">
              ExamPlatform
            </p>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/10"
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:scale-105"
          >
            Creer un compte
          </button>
        </div>
      </div>

      <div className="flex justify-center pt-6">
        <SpotlightNavbar
          items={items}
          defaultActiveIndex={activeIndex}
          onItemClick={(item) => navigate(item.href)}
        />
      </div>
    </>
  );
}

export function TiltCard({ children, className = "" }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    const percentX = (relativeX / rect.width) * 2 - 1;
    const percentY = (relativeY / rect.height) * 2 - 1;
    x.set(percentX * 30);
    y.set(percentY * 30);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}

function PerspectiveGrid() {
  const gridRef = useRef();

  useFrame(({ clock }) => {
    if (gridRef.current) {
      gridRef.current.rotation.y = clock.getElapsedTime() * 0.05;
      gridRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#8b5cf6" />
      <pointLight position={[-5, 5, 5]} intensity={0.8} color="#06b6d4" />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group ref={gridRef}>
          <Grid
            args={[25, 25]}
            cellSize={0.6}
            cellThickness={0.6}
            cellColor="#a855f7"
            sectionSize={3}
            sectionThickness={1.2}
            sectionColor="#06b6d4"
            fadeDistance={40}
            fadeStrength={1}
            followCamera={false}
          />
        </group>
      </Float>
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.8} />
      <Environment preset="night" />
    </>
  );
}
