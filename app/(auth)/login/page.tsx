"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { authApi } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast({ variant: "destructive", title: "Champs requis", description: "Veuillez remplir tous les champs." });
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      setToken(data.access_token);
      router.replace("/dashboard");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Connexion échouée",
        description: err instanceof Error ? err.message : "Erreur inconnue.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold text-gray-900">Connexion</CardTitle>
        <CardDescription className="text-gray-500">
          Entrez vos identifiants pour accéder à votre tableau de bord
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="current-password"
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
          </div>

          <Button
            type="submit"
            className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours…
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
          {loading && (
            <p className="text-sm text-gray-500 text-center">
              Première connexion ? Le serveur peut mettre 30 secondes à répondre…
            </p>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-[#0d9488] hover:underline">
            Créer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
