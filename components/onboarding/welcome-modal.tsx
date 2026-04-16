'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Rocket, Upload, CheckCircle2, TrendingUp, Bell, Brain } from 'lucide-react'

interface WelcomeModalProps {
  prenom?: string | null
  onClose: () => void
}

export function WelcomeModal({ prenom, onClose }: WelcomeModalProps) {
  const [slide, setSlide] = useState(0)
  const router = useRouter()

  const goImport = () => {
    onClose()
    router.push('/import')
  }

  const goLater = () => {
    setSlide(2)
  }

  const close = () => {
    localStorage.setItem('qomiq_welcome_seen', '1')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Bouton passer */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xs font-medium flex items-center gap-1 z-10"
        >
          <X className="h-3.5 w-3.5" />
          Passer
        </button>

        {/* Slide 1 — Bienvenue */}
        {slide === 0 && (
          <div className="p-8 text-center animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-center mb-5">
              <div className="h-16 w-16 bg-teal-100 rounded-2xl flex items-center justify-center">
                <Rocket className="h-8 w-8 text-teal-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenue sur Qomiq{prenom ? `, ${prenom}` : ''}&nbsp;!
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Votre cockpit commercial IA est prêt
            </p>
            <ul className="text-left space-y-3 mb-8">
              {[
                { icon: TrendingUp, text: 'Piloter votre performance en temps réel' },
                { icon: Bell,       text: 'Recevoir des alertes proactives' },
                { icon: Brain,      text: 'Générer des analyses stratégiques en 1 clic' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="h-7 w-7 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-teal-600" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setSlide(1)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              Commencer →
            </button>
          </div>
        )}

        {/* Slide 2 — Importer des données */}
        {slide === 1 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-center mb-5">
              <div className="h-16 w-16 bg-teal-100 rounded-2xl flex items-center justify-center">
                <Upload className="h-8 w-8 text-teal-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Première étape : importez vos données
            </h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Qomiq analyse vos vraies données commerciales
            </p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-6 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0" />
                Formats acceptés : CSV, Excel (XLSX)
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0" />
                Types : Pipeline, CA mensuel, Contacts, Budget
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0" />
                Mapping automatique des colonnes par IA
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={goImport}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Importer maintenant →
              </button>
              <button
                onClick={goLater}
                className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 rounded-xl transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
        )}

        {/* Slide 3 — Plus tard */}
        {slide === 2 && (
          <div className="p-8 text-center animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-center mb-5">
              <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pas de souci !</h2>
            <p className="text-sm text-gray-500 mb-6">
              Retrouvez ces étapes dans la checklist du dashboard.<br />
              Elle vous guidera pas à pas au rythme qui vous convient.
            </p>
            <button
              onClick={close}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              Compris
            </button>
          </div>
        )}

        {/* Indicateur de progression */}
        <div className="flex justify-center gap-2 pb-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === slide ? 'w-6 bg-teal-600' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
