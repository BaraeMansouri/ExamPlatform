import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FlipText, PerspectiveBackground, PublicHeader, TiltCard } from "../components/ExperienceUI";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (form.password !== form.password_confirmation) {
      setError("La confirmation du mot de passe ne correspond pas");
      setLoading(false);
      return;
    }
    try {
      const success = await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (!success) {
        setError("Impossible de creer le compte");
        return;
      }
      navigate("/welcome");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors || {}).flat()[0] ||
        "Erreur lors de l'inscription";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PerspectiveBackground />
      <div className="relative z-10 min-h-screen overflow-y-auto py-6 text-white">
        <PublicHeader navigate={navigate} activeIndex={2} />

        <div className="mx-auto mt-10 max-w-7xl px-4">
          <div className="grid items-center gap-8 lg:grid-cols-[.95fr_1.05fr]">
            <TiltCard className="order-2 rounded-[2rem] border border-white/10 bg-black/30 p-8 shadow-[0_30px_90px_rgba(2,8,23,0.35)] backdrop-blur-2xl lg:order-1">
              <form onSubmit={handleSubmit}>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Inscription</p>
                <h2 className="mt-3 text-3xl font-black text-white">Creer votre espace</h2>

                {error ? (
                  <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
                    {error}
                  </div>
                ) : null}

                <div className="mt-6 space-y-4">
                  <input type="text" name="name" placeholder="Nom complet" value={form.name} onChange={handleChange} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-white outline-none transition focus:border-cyan-300/40" required />
                  <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-white outline-none transition focus:border-cyan-300/40" required />
                  <input type="password" name="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-white outline-none transition focus:border-cyan-300/40" required minLength={6} />
                  <input type="password" name="password_confirmation" placeholder="Confirmer le mot de passe" value={form.password_confirmation} onChange={handleChange} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-white outline-none transition focus:border-cyan-300/40" required minLength={6} />
                </div>

                <button className="mt-6 w-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-6 py-4 text-base font-black text-white shadow-lg transition hover:scale-[1.01] disabled:opacity-70" disabled={loading}>
                  {loading ? "Inscription..." : "S'inscrire"}
                </button>

                <p className="mt-5 text-center text-sm">
                  <Link to="/login" className="font-bold text-cyan-200 hover:text-white">Deja un compte ? Connexion</Link>
                </p>
              </form>
            </TiltCard>

            <div className="order-1 lg:order-2">
              <FlipText className="text-5xl font-black text-white md:text-7xl">
                Creez votre compte
              </FlipText>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Le header est maintenant identique a celui de l'accueil avant login, et
                la fiche avec nom, email et mots de passe a ete repositionnee pour etre
                plus evidente.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.7rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
                    Formulaire prioritaire
                  </p>
                  <p className="mt-3 text-lg font-black text-white">
                    La fiche d'inscription apparait desormais en premier sur grand ecran.
                  </p>
                </div>
                <div className="rounded-[1.7rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-200">
                    Parcours coherent
                  </p>
                  <p className="mt-3 text-lg font-black text-white">
                    Le meme header public guide l'utilisateur entre accueil, login et register.
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

export default Register;
