import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Grid, Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import { getExams, deleteExam } from "../api/exams";
import { useAuth } from "../context/AuthContext";

// ------------------------------
// Composant FlipText (animation de texte)
// ------------------------------
const FlipText = ({ children, className, duration = 2.2, delay = 0 }) => {
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

// ------------------------------
// Composant SpotlightNavbar (barre de navigation avec spot) - VERSION AGRANDIE
// ------------------------------
const SpotlightNavbar = ({
  items,
  className,
  onItemClick,
  defaultActiveIndex = 0,
}) => {
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
        className="relative h-16 rounded-full overflow-hidden bg-black/30 backdrop-blur-xl border border-white/20 shadow-2xl"
        style={{
          "--spotlight-x": "0px",
          "--ambience-x": "0px",
        }}
      >
        <ul className="relative flex items-center h-full px-5 gap-3 z-10">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="relative h-full flex items-center justify-center"
            >
              <a
                href={item.href}
                data-index={idx}
                onClick={(e) => {
                  e.preventDefault();
                  handleClick(item, idx);
                }}
                className={`px-6 py-2.5 text-lg font-bold transition-all duration-200 rounded-full ${
                  activeIndex === idx
                    ? "text-white bg-white/20 shadow-lg"
                    : "text-neutral-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Lueur qui suit la souris (violet/cyan) */}
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            opacity: hoverX !== null ? 1 : 0,
            background: `radial-gradient(220px circle at var(--spotlight-x) 100%, rgba(139, 92, 246, 0.3) 0%, transparent 70%)`,
          }}
        />

        {/* Lueur de l'élément actif (cyan) */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-full h-[3px] z-10"
          style={{
            background: `radial-gradient(140px circle at var(--ambience-x) 0%, rgba(0, 255, 255, 0.9) 0%, transparent 100%)`,
          }}
        />

        {/* Ligne de base */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/20 z-0" />
      </nav>
    </div>
  );
};

// ------------------------------
// Composant 3D : Grille en perspective (fond animé) avec couleurs améliorées
// ------------------------------
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
            cellColor="#a855f7" // violet
            sectionSize={3}
            sectionThickness={1.2}
            sectionColor="#06b6d4" // cyan
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

// ------------------------------
// Composant principal
// ------------------------------
const Page1_ExamList = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copyId, setCopyId] = useState(null);
  const [latestExamLink, setLatestExamLink] = useState(
    localStorage.getItem("latest_exam_link") || "",
  );
  const [latestExamTitle, setLatestExamTitle] = useState(
    localStorage.getItem("latest_exam_title") || "",
  );
  const navigate = useNavigate();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      const res = await getExams();
      const data = res.data?.data || res.data || [];
      setExams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur chargement examens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet examen ?")) return;
    try {
      await deleteExam(id);
      await loadExams();
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  };

  const copyToClipboard = async (value, id) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyId(id);
      setTimeout(() => setCopyId(null), 1800);
    } catch {
      alert("Impossible de copier le lien");
    }
  };

  const dismissLatestExamLink = () => {
    localStorage.removeItem("latest_exam_link");
    localStorage.removeItem("latest_exam_title");
    setLatestExamLink("");
    setLatestExamTitle("");
  };

  const stats = useMemo(() => {
    const published = exams.filter(
      (exam) => exam.status === "published",
    ).length;
    const drafts = exams.filter((exam) => exam.status !== "published").length;
    return { total: exams.length, published, drafts };
  }, [exams]);

  const navItems = [
    { label: "Accueil", href: "/" },
    { label: "Exams", href: "/dashboard" },
    { label: "Profile", href: "/profile" },
    { label: "Déconnexion", href: "/logout" },
  ];

  const handleNavClick = (item) => {
    if (item.href === "/logout") {
      navigate("/logout");
    } else {
      navigate(item.href);
    }
  };

  // Animation 3D pour les cartes (effet tilt)
  const Card3D = ({ children, ...props }) => {
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
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          transformPerspective: 1000,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </motion.div>
    );
  };

  return (
    <>
      {/* Fond 3D amélioré */}
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

      {/* Contenu principal */}
      <div id="top" className="relative z-10 min-h-screen overflow-y-auto">
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
                  {getInitials(user?.name)}
                </div>
              )}
              <div>
                <p className="text-sm font-black text-white">
                  {user?.name || "Professeur"}
                </p>
                <p className="text-xs text-slate-300">
                  {user?.title || user?.email || "Compte connecté"}
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

        {/* Spotlight Navbar agrandie */}
        <div className="flex justify-center pt-6">
          <SpotlightNavbar
            items={navItems.filter((item) => item.href !== "/logout")}
            defaultActiveIndex={1}
            onItemClick={handleNavClick}
          />
        </div>

        <main className="container mx-auto px-4 py-8">
          {/* Titre animé avec nouvelles couleurs */}
          <div className="mb-12 text-center">
            <FlipText
              className="text-5xl md:text-7xl font-black text-white"
              duration={2.2}
              delay={0}
            >
              Tableau de bord
            </FlipText>
            <p className="mt-4 text-slate-200 text-lg">
              Gérez vos examens, suivez les résultats et partagez les liens
              étudiants.
            </p>
          </div>

          {/* Cartes statistiques */}
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total examens"
              value={stats.total}
              accent="purple"
            />
            <StatCard label="Publiés" value={stats.published} accent="cyan" />
            <StatCard label="Brouillons" value={stats.drafts} accent="amber" />
          </div>

          {/* Dernier examen créé */}
          {latestExamLink && (
            <div className="mb-12">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 p-6 backdrop-blur-lg border border-purple-400/30">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-purple-300">
                      Dernier examen créé
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                      {latestExamTitle || "Nouvel examen"}
                    </h3>
                    <p className="mt-2 break-all font-mono text-sm text-cyan-100">
                      {latestExamLink}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => copyToClipboard(latestExamLink, "latest")}
                      className="rounded-full bg-white/90 px-6 py-2 text-sm font-bold text-slate-900 transition hover:scale-105 hover:shadow-[0_0_15px_white]"
                    >
                      {copyId === "latest" ? "Copié ✓" : "Copier le lien"}
                    </button>
                    <button
                      onClick={dismissLatestExamLink}
                      className="rounded-full border border-white/30 bg-white/10 px-6 py-2 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Liste des examens */}
          <div id="exams" className="relative rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-3xl font-black text-white">Mes examens</h2>
              <Link
                to="/exams/create"
                className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-6 py-2 text-sm font-black text-white shadow-lg transition hover:shadow-xl hover:scale-105"
              >
                + Créer un examen
              </Link>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center text-slate-300">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              </div>
            ) : exams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950/30 p-12 text-center">
                <p className="text-xl font-bold text-white">
                  Aucun examen pour le moment.
                </p>
                <p className="mt-2 text-slate-400">
                  Commencez par créer votre premier examen.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {exams.map((exam) => {
                  const url = `${window.location.origin}/exam/${exam.private_token}`;
                  return (
                    <Card3D key={exam.id}>
                      <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-purple-400/50 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="mb-2 flex flex-wrap gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                                  exam.status === "published"
                                    ? "bg-emerald-400/20 text-emerald-300"
                                    : "bg-amber-400/20 text-amber-300"
                                }`}
                              >
                                {exam.status === "published"
                                  ? "Publié"
                                  : "Brouillon"}
                              </span>
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                                {exam.module?.name || "Sans module"}
                              </span>
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                                {exam.group?.name || "Sans groupe"}
                              </span>
                            </div>
                            <h3 className="text-2xl font-bold text-white">
                              {exam.title || "Sans titre"}
                            </h3>
                            <p className="mt-2 text-sm text-slate-400">
                              Créé le {formatDate(exam.created_at)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <ActionButton
                              to={`/exams/${exam.id}/edit`}
                              label="Éditer"
                              tone="neutral"
                            />
                            <ActionButton
                              to={`/exams/${exam.id}/control`}
                              label="Contrôle"
                              tone="purple"
                            />
                            <ActionButton
                              to={`/exams/${exam.id}/results`}
                              label="Résultats"
                              tone="cyan"
                            />
                            <ActionButton
                              to={`/exams/${exam.id}/reports`}
                              label="Rapports"
                              tone="amber"
                            />
                            <button
                              onClick={() => copyToClipboard(url, exam.id)}
                              className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-slate-900 transition hover:scale-105 hover:shadow-[0_0_10px_white]"
                            >
                              {copyId === exam.id ? "Copié ✓" : "Lien"}
                            </button>
                            <button
                              onClick={() => handleDelete(exam.id)}
                              className="rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-300 transition hover:bg-rose-400/20 hover:shadow-[0_0_10px_#ff3366]"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card3D>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

// ------------------------------------------------------------
// Composants utilitaires
// ------------------------------------------------------------
function StatCard({ label, value, accent }) {
  const accentMap = {
    purple:
      "from-purple-600/20 to-purple-800/10 border-purple-500/30 text-purple-100",
    cyan: "from-cyan-600/20 to-cyan-800/10 border-cyan-500/30 text-cyan-100",
    amber:
      "from-amber-600/20 to-amber-800/10 border-amber-500/30 text-amber-100",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${accentMap[accent]} p-6 backdrop-blur-lg border transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(139,92,246,0.4)]`}
    >
      <p className="text-xs font-black uppercase tracking-wider text-slate-300">
        {label}
      </p>
      <p className="mt-3 text-5xl font-black">{value}</p>
    </div>
  );
}

function ActionButton({ to, label, tone }) {
  const tones = {
    neutral: "bg-white/10 text-white border-white/20 hover:bg-white/20",
    purple:
      "bg-purple-500/20 text-purple-200 border-purple-400/30 hover:bg-purple-500/30",
    cyan: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30 hover:bg-cyan-500/30",
    amber:
      "bg-amber-500/20 text-amber-200 border-amber-400/30 hover:bg-amber-500/30",
  };

  return (
    <Link
      to={to}
      className={`rounded-full border px-4 py-2 text-sm font-bold transition-all hover:scale-105 hover:shadow-[0_0_8px_currentColor] ${tones[tone]}`}
    >
      {label}
    </Link>
  );
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function getInitials(name) {
  return (name || "PR")
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default Page1_ExamList;
