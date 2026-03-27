import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PerspectiveBackground, SpotlightNavbar } from "./ExperienceUI";

const NAV_ITEMS = [
  { label: "Accueil", to: "/welcome" },
  { label: "Examens", to: "/dashboard" },
  { label: "Creer Examen", to: "/exams/create" },
  { label: "Profile", to: "/profile" },
];

export default function ProfessorShell({ title, subtitle, actions, children, activeIndex }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initials = (user?.name || "PR")
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const derivedActiveIndex =
    typeof activeIndex === "number"
      ? activeIndex
      : NAV_ITEMS.findIndex((item) =>
          item.to === "/dashboard"
            ? location.pathname === "/dashboard"
            : location.pathname.startsWith(item.to)
        );

  const getInitials = (name) =>
    (name || "PR")
      .split(" ")
      .map((item) => item[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <>
      <PerspectiveBackground />
      <div id="top" className="relative z-10 min-h-screen overflow-y-auto text-white">
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
              {actions}

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

          <SpotlightNavbar
            items={NAV_ITEMS.map((item) => ({ label: item.label, href: item.to }))}
            defaultActiveIndex={Math.max(derivedActiveIndex, 0)}
            onItemClick={(item) => navigate(item.href)}
          />

          {(title || subtitle) ? (
            <div className="mt-8 mb-6 text-white">
              {title ? <h1 className="text-4xl font-black text-white">{title}</h1> : null}
              {subtitle ? <p className="mt-2 text-sm text-slate-300">{subtitle}</p> : null}
            </div>
          ) : null}

          <div>{children}</div>
        </div>
      </div>
    </>
  );
}
