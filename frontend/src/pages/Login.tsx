import { LockKeyhole } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import type { SubmitEvent } from "react";

export default function Login() {
  const {login, loading}=useAuth();
  const navigate=useNavigate();
  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const loggedIn=await login({ email, password });
    if(loggedIn.error){
      alert("Erreur de connexion : "+loggedIn.error.message);
      return;
    }
    navigate("/app", { replace: true });
  };
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <LockKeyhole className="size-6" aria-hidden="true" />
          </div>
          <p className="mb-2 text-sm font-semibold tracking-wide text-blue-600">SKULLVI · Talent Engine</p>
          <h1 className="text-2xl font-semibold text-slate-950">Connexion</h1>
          <p className="mt-2 text-sm text-slate-500">Accédez à votre espace de gestion des candidatures.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-950">
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="vous@exemple.com"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-950">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </section>
    </main>
  );
}
