import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Grid, Float, Stars } from "@react-three/drei";
import { AuthContext } from "../context/AuthContext";
import { PublicHeader } from "../components/ExperienceUI";

const FlipText = ({ children, className, delay = 0 }) => {
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
};

const SpotlightNavbar = ({ items, className, onItemClick, defaultActiveIndex = 0 }) => {
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
    <div className={`relative flex justify-center pt-10 ${className}`}>
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
                href={item.href}
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
};

const PerspectiveGrid = () => {
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
};

export default function Welcome() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isLoggedIn = Boolean(token);

  const navItems = isLoggedIn
    ? [
        { label: "Accueil", href: "/welcome" },
        { label: "Exams", href: "/dashboard" },
        { label: "Profile", href: "/profile" },
      ]
    : [
        { label: "Accueil", href: "/welcome" },
        { label: "Connexion", href: "/login" },
        { label: "Inscription", href: "/register" },
      ];

  const handleNavClick = (item) => {
    navigate(item.href);
  };

  const initials = (user?.name || "PR")
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
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

      <div id="top" className="relative z-10 min-h-screen overflow-y-auto">
        {isLoggedIn ? (
          <>
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 pt-6">
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
                  onClick={() => navigate("/profile")}
                  className="hidden items-center gap-3 rounded-[1.3rem] border border-white/10 bg-white/5 px-3 py-2 text-left backdrop-blur-xl sm:flex"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="avatar"
                      className="h-11 w-11 rounded-[1rem] object-cover"
                    />
                  ) : (
                    <div className="grid h-11 w-11 place-items-center rounded-[1rem] bg-gradient-to-br from-cyan-400 to-emerald-400 font-black text-slate-950">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-black text-white">
                      {user?.name || "Professeur"}
                    </p>
                    <p className="text-xs text-slate-300">
                      {user?.title || user?.email || "Compte connecte"}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/logout")}
                  className="rounded-full border border-rose-300/25 bg-rose-400/10 px-5 py-3 text-sm font-black text-rose-100 backdrop-blur-xl transition hover:bg-rose-400/20 hover:shadow-[0_0_18px_rgba(251,113,133,0.32)]"
                >
                  Deconnexion
                </button>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <SpotlightNavbar
                items={navItems}
                defaultActiveIndex={0}
                onItemClick={handleNavClick}
              />
            </div>
          </>
        ) : (
          <PublicHeader navigate={navigate} activeIndex={0} />
        )}

        <main className="container mx-auto px-4 py-8">
          <div className="mb-12 text-center">
            <FlipText className="text-5xl font-black text-white md:text-7xl" delay={0}>
              Une plateforme d'examen moderne
            </FlipText>
            <p className="mt-4 text-lg text-slate-200">
              Surveillee, elegante et pensee pour les professeurs comme pour les etudiants.
            </p>
            {isLoggedIn ? (
              <p className="mt-3 text-sm font-bold text-cyan-200">
                Vous etes connecte. Accedez a vos examens, a votre profile ou deconnectez-vous.
              </p>
            ) : null}
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="space-y-5">
                <p className="text-lg leading-8 text-slate-300">
                  Gerez vos examens, validez les etudiants en direct, corrigez les
                  copies, exportez les resultats en PDF et profitez d'une experience
                  visuelle forte pour les professeurs comme pour les etudiants.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-7 py-4 text-base font-black text-white shadow-lg transition hover:scale-105"
                    >
                      Voir mes examens
                    </Link>
                    <Link
                      to="/profile"
                      className="rounded-full border border-white/10 bg-white/5 px-7 py-4 text-base font-bold text-white backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-white/10"
                    >
                      Ouvrir mon profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-7 py-4 text-base font-black text-white shadow-lg transition hover:scale-105"
                    >
                      Commencer comme professeur
                    </Link>
                    <Link
                      to="/login"
                      className="rounded-full border border-white/10 bg-white/5 px-7 py-4 text-base font-bold text-white backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-white/10"
                    >
                      Acceder au dashboard
                    </Link>
                  </>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FeatureCard
                  title="Validation temps reel"
                  text="Acceptez les etudiants et surveillez leurs alertes sans perdre le fil."
                />
                <FeatureCard
                  title="Correction claire"
                  text="Separez les copies corrigees et non corrigees avec export PDF propre."
                />
                <FeatureCard
                  title="Experience premium"
                  text="Deux univers visuels coherents, immersifs et modernes."
                />
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-[0_30px_80px_rgba(2,8,23,0.35)] backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-300">
                      Mission Control
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">Vue professeur</h2>
                  </div>
                  <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-200">
                    Live
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">Examen Final Web</p>
                        <p className="text-xs text-slate-400">12 etudiants en attente</p>
                      </div>
                      <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300">
                        Actif
                      </div>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400" />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-blue-500/10 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-200">
                        Alertes
                      </p>
                      <p className="mt-3 text-4xl font-black text-white">03</p>
                      <p className="mt-2 text-sm text-slate-300">
                        Sorties fullscreen, perte de focus, onglets quittes.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-fuchsia-500/10 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-200">
                        Corrections
                      </p>
                      <p className="mt-3 text-4xl font-black text-white">18</p>
                      <p className="mt-2 text-sm text-slate-300">
                        Copies finalisees avec rapport PDF professionnel.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-300">
                      Experience etudiant
                    </p>
                    <p className="mt-3 text-xl font-black text-white">
                      Plein ecran, timer, surveillance, rendu propre.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function FeatureCard({ title, text }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_32px_rgba(2,8,23,0.18)] backdrop-blur-xl">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
    </div>
  );
}
