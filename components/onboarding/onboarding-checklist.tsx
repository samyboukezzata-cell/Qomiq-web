'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, CheckCircle2, Circle, Upload, Brain, Rocket } from 'lucide-react'
import { authApi } from '@/lib/api'
import type { HasData } from '@/types/api'

interface OnboardingChecklistProps {
  hasData: HasData
  onComplete: () => void
  onDismiss: () => void
}

interface Step {
  label: string
  done: boolean
  cta?: { label: string; href: string; icon: React.ElementType }
}

export function OnboardingChecklist({ hasData, onComplete, onDismiss }: OnboardingChecklistProps) {
  const [confirmDismiss, setConfirmDismiss] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const router = useRouter()

  const steps: Step[] = [
    { label: 'Créer votre compte', done: true },
    {
      label: 'Importer votre pipeline',
      done: hasData.pipeline,
      cta: { label: 'Importer →', href: '/import', icon: Upload },
    },
    {
      label: 'Importer votre CA mensuel',
      done: hasData.ca_mensuel,
      cta: { label: 'Importer →', href: '/import', icon: Upload },
    },
    {
      label: "Générer votre 1ère analyse",
      done: hasData.has_generated_analysis,
      cta: { label: 'Coach IA →', href: '/coach', icon: Brain },
    },
  ]

  const completedCount = steps.filter((s) => s.done).length
  const pct = Math.round((completedCount / steps.length) * 100)
  const allDone = completedCount === steps.length

  const handleDismiss = async () => {
    try {
      await authApi.completeOnboarding()
    } catch {
      // non bloquant
    }
    setDismissed(true)
    onDismiss()
  }

  // Auto-complétion quand tout est fait
  if (allDone && !dismissed) {
    authApi.completeOnboarding().catch(() => null)
    setTimeout(() => {
      setDismissed(true)
      onComplete()
    }, 3000)
  }

  if (dismissed) return null

  return (
    <div className="rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-white shadow-sm mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-teal-600" />
          <span className="font-semibold text-gray-800 text-sm">Démarrez avec Qomiq</span>
          {allDone && (
            <span className="text-xs text-emerald-600 font-semibold animate-in fade-in duration-500">
              Parfait ! Vous maîtrisez Qomiq !
            </span>
          )}
        </div>
        {!confirmDismiss ? (
          <button
            onClick={() => setConfirmDismiss(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Masquer le guide ?</span>
            <button
              onClick={handleDismiss}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              Oui
            </button>
            <button
              onClick={() => setConfirmDismiss(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Non
            </button>
          </div>
        )}
      </div>

      {/* Progression */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>{completedCount}/{steps.length} étapes complétées</span>
          <span className="font-semibold text-teal-600">{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Étapes */}
      <div className="px-5 pb-4 space-y-2">
        {steps.map((step) => (
          <div
            key={step.label}
            className="flex items-center justify-between py-1"
          >
            <div className="flex items-center gap-2.5">
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-300 shrink-0" />
              )}
              <span className={`text-sm ${step.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {step.label}
              </span>
            </div>
            {!step.done && step.cta && (
              <button
                onClick={() => router.push(step.cta!.href)}
                className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-800 transition-colors"
              >
                <step.cta.icon className="h-3.5 w-3.5" />
                {step.cta.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
