import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Grid, Float, Stars } from "@react-three/drei";
import { AuthContext } from "../context/AuthContext";

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
        className="relative h-16 rounded-full overflow-hidden border border-white/20 bg-black/30 shadow-2xl backdrop-blur-xl"
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
      <Stars
        radius={100}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={0.8}
      />
      <Environment preset="night" />
    </>
  );
};

export default function Profile() {
  const { user, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    title: user?.title || "Professeur Responsable",
    bio: user?.bio || "J'organise des examens structures, lisibles et surveilles avec ExamPlatform.",
    avatar: user?.avatar || "",
  });

  const initials = useMemo(() => {
    const source = form.name || user?.name || "P";
    return source
      .split(" ")
      .map((item) => item[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [form.name, user?.name]);

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, avatar: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (event) => {
    event.preventDefault();
    updateProfile(form);
    setMessage("Profil mis a jour avec succes.");
    window.setTimeout(() => setMessage(""), 2500);
  };

  const navItems = [
    { label: "Accueil", href: "/welcome" },
    { label: "Exams", href: "/dashboard" },
    { label: "Profile", href: "/profile" },
  ];

  const handleNavClick = (item) => {
    navigate(item.href);
  };

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

      <div className="relative z-10 min-h-screen overflow-y-auto">
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
              {form.avatar ? (
                <img src={form.avatar} alt="avatar" className="h-11 w-11 rounded-[1rem] object-cover" />
              ) : (
                <div className="grid h-11 w-11 place-items-center rounded-[1rem] bg-gradient-to-br from-cyan-400 to-emerald-400 font-black text-slate-950">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-black text-white">
                  {form.name || "Professeur"}
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
              Déconnexion
            </button>
          </div>
        </div>

        <div className="flex justify-center pt-6">
          <SpotlightNavbar
            items={navItems}
            defaultActiveIndex={2}
            onItemClick={handleNavClick}
          />
        </div>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-12 text-center">
            <FlipText className="text-5xl font-black text-white md:text-7xl" delay={0}>
              Mon Profil
            </FlipText>
            <p className="mt-4 text-lg text-slate-200">
              Personnalisez votre identite et vos informations.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-5">
                {form.avatar ? (
                  <img src={form.avatar} alt="avatar" className="h-28 w-28 rounded-2xl object-cover shadow-lg" />
                ) : (
                  <div className="grid h-28 w-28 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 text-4xl font-black text-white shadow-lg">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-purple-300">
                    Identite
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-white">
                    {form.name || "Votre nom"}
                  </h2>
                  <p className="mt-2 text-slate-300">{form.title}</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-purple-300">
                  Bio
                </p>
                <p className="mt-3 leading-8 text-slate-300">{form.bio}</p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <MiniStat label="Interface" value="Mission Control" />
                <MiniStat label="Avatar" value={form.avatar ? "Personnalise" : "Initiales"} />
              </div>
            </div>

            <form onSubmit={handleSave} className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
              <h2 className="mb-6 text-2xl font-black text-white">Modifier mon profil</h2>
              <div className="grid gap-5">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-200">Nom affiche</span>
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-purple-400"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-200">Titre</span>
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-purple-400"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-200">Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-slate-300"
                    onChange={handleImage}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-200">Bio</span>
                  <textarea
                    rows="5"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-purple-400"
                    value={form.bio}
                    onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                  />
                </label>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-6 py-3 font-black text-white shadow-lg transition hover:scale-105"
                >
                  Enregistrer
                </button>
                {message ? <span className="text-sm font-bold text-emerald-300">{message}</span> : null}
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <span className="text-xs font-black uppercase tracking-wider text-purple-300">
        {label}
      </span>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
