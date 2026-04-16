'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, User, Lock, Info, Eye, EyeOff, Rocket } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { authApi } from '@/lib/api'
import type { UserResponse } from '@/types/api'

// ── Constantes ────────────────────────────────────────────────────────────────

const SECTEURS = [
  'BTP',
  'Retail / Commerce',
  'Tech / SaaS',
  'Industrie',
  'Services',
  'Santé',
  'HCR',
  'Audiovisuel',
]

// ── Indicateur de force du mot de passe ──────────────────────────────────────

function passwordStrength(pwd: string): { label: string; color: string; width: string } {
  if (!pwd) return { label: '', color: 'bg-gray-200', width: 'w-0' }
  const hasLength  = pwd.length >= 8
  const hasDigit   = /\d/.test(pwd)
  const hasUpper   = /[A-Z]/.test(pwd)
  const score = [hasLength, hasDigit, hasUpper].filter(Boolean).length
  if (score === 3) return { label: 'Fort',  color: 'bg-emerald-500', width: 'w-full' }
  if (score === 2) return { label: 'Moyen', color: 'bg-amber-400',   width: 'w-2/3'  }
  return              { label: 'Faible', color: 'bg-red-400',     width: 'w-1/3'  }
}

// ── Formatage date française ──────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserResponse | null>(null)

  // Profil
  const [nom,     setNom]     = useState('')
  const [prenom,  setPrenom]  = useState('')
  const [secteur, setSecteur] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Mot de passe
  const [currentPwd,  setCurrentPwd]  = useState('')
  const [newPwd,      setNewPwd]      = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingPwd,   setSavingPwd]   = useState(false)
  const [resettingOnboarding, setResettingOnboarding] = useState(false)

  useEffect(() => {
    authApi.me().then((u) => {
      setUser(u)
      setNom(u.nom ?? '')
      setPrenom(u.prenom ?? '')
      setSecteur(u.secteur ?? '')
    }).catch(() => null)
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const updated = await authApi.updateProfile({
        nom:     nom     || undefined,
        prenom:  prenom  || undefined,
        secteur: secteur || undefined,
      })
      setUser(updated)
      toast({ title: 'Profil mis à jour', description: 'Vos informations ont été enregistrées.' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: (err as Error).message })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPwd(true)
    try {
      await authApi.changePassword({
        current_password:  currentPwd,
        new_password:      newPwd,
        confirm_password:  confirmPwd,
      })
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      toast({ title: 'Mot de passe modifié', description: 'Votre mot de passe a été mis à jour.' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: (err as Error).message })
    } finally {
      setSavingPwd(false)
    }
  }

  const handleResetOnboarding = async () => {
    setResettingOnboarding(true)
    try {
      await authApi.resetOnboarding()
      localStorage.removeItem('qomiq_welcome_seen')
      router.push('/dashboard')
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: (err as Error).message })
      setResettingOnboarding(false)
    }
  }

  const strength = passwordStrength(newPwd)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
      </div>

      {/* ── Section 1 : Profil ─────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <User className="h-4 w-4 text-teal-600" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Prénom</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Marie"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Nom</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Dupont"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                  text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400">L'adresse email ne peut pas être modifiée.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Secteur d'activité</label>
              <select
                value={secteur}
                onChange={(e) => setSecteur(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                  bg-white"
              >
                <option value="">— Sélectionner un secteur —</option>
                {SECTEURS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={savingProfile}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {savingProfile ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Section 2 : Sécurité ───────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Lock className="h-4 w-4 text-teal-600" />
            Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Mot de passe actuel */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Mot de passe actuel</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm
                    focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm
                    focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPwd && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                  </div>
                  <p className={`text-xs font-medium ${
                    strength.label === 'Fort'  ? 'text-emerald-600' :
                    strength.label === 'Moyen' ? 'text-amber-500'   : 'text-red-500'
                  }`}>
                    Force : {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirmation */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Confirmer le nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  required
                  className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm
                    focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                    ${confirmPwd && confirmPwd !== newPwd
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-300'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPwd && confirmPwd !== newPwd && (
                <p className="text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                variant="outline"
                disabled={savingPwd || (!!confirmPwd && confirmPwd !== newPwd)}
              >
                {savingPwd ? 'Modification…' : 'Changer le mot de passe'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Section 3 : Informations du compte ────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Info className="h-4 w-4 text-teal-600" />
            Informations du compte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <dt className="text-gray-500 font-medium">Email</dt>
              <dd className="text-gray-800 font-medium">{user?.email ?? '—'}</dd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <dt className="text-gray-500 font-medium">Membre depuis</dt>
              <dd className="text-gray-800">{user?.created_at ? fmtDate(user.created_at) : '—'}</dd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <dt className="text-gray-500 font-medium">Secteur</dt>
              <dd className="text-gray-800">{user?.secteur || '—'}</dd>
            </div>
            <div className="flex justify-between items-center py-2">
              <dt className="text-gray-500 font-medium">Accès</dt>
              <dd>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                  bg-teal-100 text-teal-700 border border-teal-200">
                  Accès Bêta
                </span>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* ── Section 4 : Onboarding ─────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Rocket className="h-4 w-4 text-teal-600" />
            Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Relancer le guide d'accueil</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Réaffiche la checklist et le modal de bienvenue sur le tableau de bord.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetOnboarding}
              disabled={resettingOnboarding}
            >
              {resettingOnboarding ? 'Redirection…' : 'Relancer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
