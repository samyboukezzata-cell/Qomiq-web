"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { authApi } from "@/lib/api";
import { setToken } from "@/lib/auth";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8 caractères minimum", ok: password.length >= 8 },
    { label: "Une majuscule", ok: /[A-Z]/.test(password) },
    { label: "Un chiffre", ok: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {checks.map(c => (
        <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? "text-[#0d9488]" : "text-gray-400"}`}>
          <CheckCircle2 className={`h-3.5 w-3.5 ${c.ok ? "text-[#0d9488]" : "text-gray-300"}`} />
          {c.label}
        </li>
      ))}
    </ul>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast({ variant: "destructive", title: "Champs requis", description: "E-mail et mot de passe sont obligatoires." });
      return;
    }
    if (password.length < 8) {
      toast({ variant: "destructive", title: "Mot de passe trop court", description: "Au moins 8 caractères requis." });
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ email, password, full_name: fullName || undefined });
      // Auto-login après inscription
      const tokenData = await authApi.login({ email, password });
      setToken(tokenData.access_token);
      toast({ title: "Compte créé", description: "Bienvenue sur Qomiq !" });
      router.replace("/dashboard");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Inscription échouée",
        description: err instanceof Error ? err.message : "Erreur inconnue.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold text-gray-900">Créer un compte</CardTitle>
        <CardDescription className="text-gray-500">
          Commencez gratuitement — aucune carte bancaire requise
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-gray-700">
              Nom complet <span className="text-gray-400 font-normal">(facultatif)</span>
            </Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Marie Dupont"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoComplete="name"
              disabled={loading}
              className="border-gray-200 focus-visible:ring-[#0d9488]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@entreprise.fr"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              className="border-gray-200 focus-visible:ring-[#0d9488]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                className="border-gray-200 focus-visible:ring-[#0d9488] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-medium mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création du compte…
              </>
            ) : (
              "Créer mon compte"
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-[#0d9488] hover:underline">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
