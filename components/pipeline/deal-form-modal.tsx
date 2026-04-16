'use client'

import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ETAPES, type Deal, type Etape } from '@/lib/api'

const PROBA_AUTO: Record<Etape, number> = {
  Prospect:      10,
  Qualification: 25,
  Proposition:   50,
  Négociation:   75,
  Gagné:        100,
  Perdu:          0,
}

interface DealFormModalProps {
  deal?: Deal | null
  onSave:   (data: Partial<Deal>) => Promise<void>
  onDelete?: () => Promise<void>
  onClose:  () => void
}

interface FormErrors {
  nom?: string
  client?: string
  montant?: string
}

export function DealFormModal({ deal, onSave, onDelete, onClose }: DealFormModalProps) {
  const isEdit = !!deal

  const [nom,          setNom]          = useState(deal?.nom          ?? '')
  const [client,       setClient]       = useState(deal?.client       ?? '')
  const [montant,      setMontant]      = useState(String(deal?.montant ?? ''))
  const [etape,        setEtape]        = useState<Etape>((deal?.etape as Etape) ?? 'Prospect')
  const [probabilite,  setProbabilite]  = useState(deal?.probabilite  ?? PROBA_AUTO['Prospect'])
  const [dateCloture,  setDateCloture]  = useState(deal?.date_cloture ?? '')
  const [commercial,   setCommercial]   = useState(deal?.commercial   ?? '')
  const [notes,        setNotes]        = useState(deal?.notes        ?? '')
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(false)
  const [errors,       setErrors]       = useState<FormErrors>({})

  // Auto-proba quand l'étape change (sauf si édition avec proba existante)
  useEffect(() => {
    if (!isEdit) setProbabilite(PROBA_AUTO[etape])
  }, [etape, isEdit])

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!nom.trim())    e.nom    = 'Le nom est obligatoire.'
    if (!client.trim()) e.client = 'Le client est obligatoire.'
    const m = parseFloat(montant)
    if (isNaN(m) || m < 0) e.montant = 'Montant invalide (≥ 0).'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await onSave({
        nom,
        client,
        montant:     parseFloat(montant),
        etape,
        probabilite,
        date_cloture: dateCloture || null,
        commercial:  commercial || null,
        notes:       notes || null,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    try { await onDelete() } finally { setDeleting(false) }
  }

  const inputCls = (err?: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
      err ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Modifier le deal' : 'Nouveau deal'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Nom + Client */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Nom du deal <span className="text-red-500">*</span>
              </label>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Contrat annuel Acme"
                className={inputCls(errors.nom)}
              />
              {errors.nom && <p className="text-xs text-red-500">{errors.nom}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Client <span className="text-red-500">*</span>
              </label>
              <input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Acme Corp"
                className={inputCls(errors.client)}
              />
              {errors.client && <p className="text-xs text-red-500">{errors.client}</p>}
            </div>
          </div>

          {/* Montant + Étape */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Montant <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="0"
                  className={`${inputCls(errors.montant)} pr-6`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
              </div>
              {errors.montant && <p className="text-xs text-red-500">{errors.montant}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Étape <span className="text-red-500">*</span>
              </label>
              <select
                value={etape}
                onChange={(e) => setEtape(e.target.value as Etape)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {ETAPES.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Probabilité */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex justify-between">
              <span>Probabilité</span>
              <span className="text-teal-600 font-bold">{probabilite}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={probabilite}
              onChange={(e) => setProbabilite(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
          </div>

          {/* Date clôture + Commercial */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date de clôture</label>
              <input
                type="date"
                value={dateCloture}
                onChange={(e) => setDateCloture(e.target.value)}
                className={inputCls()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Commercial</label>
              <input
                value={commercial}
                onChange={(e) => setCommercial(e.target.value)}
                placeholder="Prénom NOM"
                className={inputCls()}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Remarques, contexte, prochaine étape…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              {isEdit && onDelete && !confirmDel && (
                <button
                  type="button"
                  onClick={() => setConfirmDel(true)}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              )}
              {confirmDel && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Confirmer ?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-red-600 font-semibold hover:text-red-800"
                  >
                    {deleting ? 'Suppression…' : 'Oui, supprimer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Non
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Annuler</Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le deal'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
