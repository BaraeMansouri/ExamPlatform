import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FlipText, PerspectiveBackground, PublicHeader, TiltCard } from "../components/ExperienceUI";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const success = await login(email, password);
      if (success) navigate("/welcome");
      else setError("Identifiants invalides");
    } catch (err) {
      setError(err.response?.data?.message || "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PerspectiveBackground />
      <div className="relative z-10 min-h-screen overflow-y-auto py-6 text-white">
        <PublicHeader navigate={navigate} activeIndex={1} />

        <div className="mx-auto mt-10 max-w-7xl px-4">
          <div className="grid items-center gap-8 lg:grid-cols-[.95fr_1.05fr]">
            <TiltCard className="order-2 rounded-[2rem] border border-white/10 bg-black/30 p-8 shadow-[0_30px_90px_rgba(2,8,23,0.35)] backdrop-blur-2xl lg:order-1">
              <form onSubmit={handleSubmit}>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Connexion</p>
                <h2 className="mt-3 text-3xl font-black text-white">Bienvenue de retour</h2>

                {error ? (
                  <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
                    {error}
                  </div>
                ) : null}

                <div className="mt-6 space-y-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-white outline-none transition focus:border-cyan-300/40"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-white outline-none transition focus:border-cyan-300/40"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-6 py-4 text-base font-black text-white shadow-lg transition hover:scale-[1.01] disabled:opacity-70"
                >
                  {loading ? "Connexion..." : "Connexion"}
                </button>

                <Link to="/register" className="mt-5 block text-center text-sm font-bold text-cyan-200 hover:text-white">
                  Creer un compte professeur
                </Link>
              </form>
            </TiltCard>

            <div className="order-1 lg:order-2">
              <FlipText className="text-5xl font-black text-white md:text-7xl">
                Connectez-vous
              </FlipText>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Le header reprend maintenant la meme presentation que la page d'accueil
                avant connexion, avec la fiche de login deplacee pour etre plus directe.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.7rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
                    Acces rapide
                  </p>
                  <p className="mt-3 text-lg font-black text-white">
                    Email et mot de passe sont visibles des l'arrivee sur la page.
                  </p>
                </div>
                <div className="rounded-[1.7rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-200">
                    Meme header public
                  </p>
                  <p className="mt-3 text-lg font-black text-white">
                    L'utilisateur retrouve l'accueil, la connexion et l'inscription au meme endroit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
