'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, Loader2, CheckCircle2, AlertCircle, AlertTriangle,
  ChevronRight, ChevronLeft, FileText, Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { importApi } from '@/lib/api'
import { getToken } from '@/lib/auth'

// ── Constantes ────────────────────────────────────────────────────────────────

const DATA_TYPES = [
  { value: 'pipeline',   label: 'Pipeline commercial' },
  { value: 'ca_mensuel', label: 'CA Mensuel' },
  { value: 'contacts',   label: 'Contacts' },
  { value: 'budget',     label: 'Budget' },
  { value: 'produits',   label: 'Produits' },
]

const REQUIRED_FIELDS: Record<string, string[]> = {
  pipeline:   ['nom'],
  ca_mensuel: ['mois', 'ca_realise'],
  contacts:   ['nom'],
  budget:     ['ligne', 'budget'],
  produits:   ['nom'],
}

const CANONICAL_FIELDS: Record<string, string[]> = {
  pipeline:   ['nom', 'client', 'montant', 'date_cloture', 'statut', 'date_modification'],
  ca_mensuel: ['mois', 'ca_realise', 'annee', 'ca_objectif', 'nb_commandes', 'nb_nouveaux_clients', 'periode'],
  contacts:   ['nom', 'email', 'telephone', 'societe', 'poste'],
  budget:     ['ligne', 'budget', 'reel', 'ecart', 'periode'],
  produits:   ['nom', 'marque', 'ca', 'ventes', 'stock'],
}

const TEMPLATES = [
  { type: 'pipeline',   label: 'Pipeline' },
  { type: 'ca_mensuel', label: 'CA Mensuel' },
  { type: 'contacts',   label: 'Contacts' },
  { type: 'budget',     label: 'Budget' },
]

// ── Types internes ────────────────────────────────────────────────────────────

interface ParseResult {
  headers: string[]
  detected_type: string
  detection_confidence: number
  suggested_mapping: Record<string, string | null>
  preview_values: Record<string, string>
  row_count: number
  rows: Record<string, unknown>[]
}

interface ValidationResult {
  valid_rows: Record<string, unknown>[]
  invalid_rows: Record<string, unknown>[]
  warnings: string[]
  stats: { total: number; valid: number; invalid: number }
}

// ── Indicateur d'étapes ───────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Upload' },
    { n: 2, label: 'Mapping' },
    { n: 3, label: 'Import' },
  ]
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const done    = s.n < current
        const active  = s.n === current
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                done   ? 'bg-teal-600 text-white' :
                active ? 'bg-teal-600 text-white ring-4 ring-teal-100' :
                         'bg-gray-100 text-gray-400'
              }`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : s.n}
              </div>
              <span className={`mt-1 text-xs font-medium ${active ? 'text-teal-700' : done ? 'text-teal-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-16 mx-2 mb-4 rounded ${s.n < current ? 'bg-teal-600' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Étape 1 — Upload ──────────────────────────────────────────────────────────

function Step1({
  onNext,
}: {
  onNext: (result: ParseResult) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }, [])

  const handleNext = async () => {
    if (!file) return
    setLoading(true)
    try {
      const data = await importApi.upload(file) as unknown as ParseResult
      onNext(data)
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur upload', description: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = (type: string) => {
    const token = getToken()
    const url = importApi.templateUrl(type)
    const a = document.createElement('a')
    a.href = url
    // Les templates nécessitent auth — fetch puis blob
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        a.href = URL.createObjectURL(blob)
        a.download = `${type}_template.csv`
        a.click()
      })
  }

  return (
    <div className="space-y-5">
      {/* Zone de drop */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          dragging ? 'border-teal-400 bg-teal-50' :
          file     ? 'border-teal-300 bg-teal-50/50' :
                     'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
        }`}
      >
        <label className="absolute inset-0 cursor-pointer">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {file ? (
          <div className="flex flex-col items-center gap-1 pointer-events-none">
            <FileText className="h-8 w-8 text-teal-600" />
            <p className="font-medium text-sm text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} Ko</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 pointer-events-none">
            <Upload className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Glissez un fichier ici ou cliquez pour sélectionner</p>
            <p className="text-xs text-gray-400">.csv, .xlsx, .xls</p>
          </div>
        )}
      </div>

      {/* Templates */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Télécharger un template
        </p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map(t => (
            <button
              key={t.type}
              onClick={() => downloadTemplate(t.type)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
        disabled={!file || loading}
        onClick={handleNext}
      >
        {loading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyse en cours…</>
        ) : (
          <>Suivant <ChevronRight className="ml-1 h-4 w-4" /></>
        )}
      </Button>
      {loading && (
        <p className="text-xs text-gray-400 text-center">
          Première requête ? Le serveur peut prendre 30 secondes à répondre…
        </p>
      )}
    </div>
  )
}

// ── Étape 2 — Mapping ─────────────────────────────────────────────────────────

function Step2({
  parseResult,
  onBack,
  onNext,
}: {
  parseResult: ParseResult
  onBack: () => void
  onNext: (mapping: Record<string, string>, dataType: string) => void
}) {
  const [dataType, setDataType] = useState(
    DATA_TYPES.find(d => d.value === parseResult.detected_type)?.value ?? 'pipeline'
  )
  // mapping: { header_csv → canonical_field | '' }
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    // suggested_mapping is { canonical: header | null }
    // We need { header: canonical }
    for (const [canonical, header] of Object.entries(parseResult.suggested_mapping)) {
      if (header) m[header] = canonical
    }
    return m
  })

  const confidence = parseResult.detection_confidence
  const confBanner = confidence >= 0.8
    ? { bg: 'bg-green-50 border-green-200 text-green-800', icon: <CheckCircle2 className="h-4 w-4" />, text: `Type détecté : ${dataType}` }
    : confidence >= 0.5
    ? { bg: 'bg-amber-50 border-amber-200 text-amber-800', icon: <AlertTriangle className="h-4 w-4" />, text: 'Type probable — vérifiez le mapping' }
    : { bg: 'bg-red-50 border-red-200 text-red-700', icon: <AlertCircle className="h-4 w-4" />, text: 'Type non reconnu — sélectionnez manuellement' }

  const canonicalOptions = CANONICAL_FIELDS[dataType] ?? []

  const handleValidate = () => {
    const required = REQUIRED_FIELDS[dataType] ?? []
    const mappedCanonicals = Object.values(mapping).filter(Boolean)
    const missing = required.filter(r => !mappedCanonicals.includes(r))
    if (missing.length) {
      toast({
        variant: 'destructive',
        title: 'Champs requis manquants',
        description: `Veuillez mapper : ${missing.join(', ')}`,
      })
      return
    }
    onNext(mapping, dataType)
  }

  return (
    <div className="space-y-5">
      {/* Bandeau confiance */}
      <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${confBanner.bg}`}>
        {confBanner.icon}
        {confBanner.text}
      </div>

      {/* Sélecteur de type */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 shrink-0">Type de données</label>
        <select
          value={dataType}
          onChange={e => setDataType(e.target.value)}
          className="flex-1 h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {DATA_TYPES.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Tableau de mapping */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Colonne CSV</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aperçu</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Correspond à</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {parseResult.headers.map(header => (
              <tr key={header} className="hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-medium text-gray-800">{header}</td>
                <td className="px-4 py-2.5 text-gray-500 max-w-[120px] truncate">
                  {parseResult.preview_values[header] ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-2.5">
                  <select
                    value={mapping[header] ?? ''}
                    onChange={e => {
                      const val = e.target.value
                      setMapping(prev => {
                        const next = { ...prev }
                        if (val) next[header] = val
                        else delete next[header]
                        return next
                      })
                    }}
                    className="w-full h-8 rounded-md border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">— Ignorer —</option>
                    {canonicalOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronLeft className="mr-1 h-4 w-4" />Retour
        </Button>
        <Button onClick={handleValidate} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
          Valider le mapping <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Étape 3 — Validation + Import ─────────────────────────────────────────────

function Step3({
  parseResult,
  mapping,
  dataType,
  onBack,
  onDone,
}: {
  parseResult: ParseResult
  mapping: Record<string, string>
  dataType: string
  onBack: () => void
  onDone: () => void
}) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [validating, setValidating] = useState(false)
  const [validationDone, setValidationDone] = useState(false)
  const [onlyValid, setOnlyValid] = useState(true)
  const [importing, setImporting] = useState(false)

  const handleValidate = async () => {
    setValidating(true)
    try {
      const result = await importApi.validate({
        mapping,
        data_type: dataType,
        rows: parseResult.rows as Record<string, unknown>[],
      })
      setValidationResult(result)
      setValidationDone(true)
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur validation', description: (e as Error).message })
    } finally {
      setValidating(false)
    }
  }

  const handleImport = async () => {
    if (!validationResult) return
    const rows = onlyValid
      ? validationResult.valid_rows
      : [...validationResult.valid_rows, ...validationResult.invalid_rows.map(({ _errors: _, ...r }) => r)]
    setImporting(true)
    try {
      const result = await importApi.save({ data_type: dataType, rows, merge_strategy: 'replace' })
      toast({ title: 'Import réussi', description: `${result.imported_count} lignes importées avec succès !` })
      onDone()
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur import', description: (e as Error).message })
    } finally {
      setImporting(false)
    }
  }

  const importCount = validationResult
    ? (onlyValid ? validationResult.valid_rows.length : validationResult.stats.total)
    : 0

  return (
    <div className="space-y-5">
      {!validationDone ? (
        <>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-800 mb-1">Prêt à valider</p>
            <p>{parseResult.row_count} lignes · type : <strong>{dataType}</strong></p>
          </div>
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            onClick={handleValidate}
            disabled={validating}
          >
            {validating
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validation en cours…</>
              : 'Valider les données'}
          </Button>
          <Button variant="outline" onClick={onBack} className="w-full">
            <ChevronLeft className="mr-1 h-4 w-4" />Retour au mapping
          </Button>
        </>
      ) : validationResult && (
        <>
          {/* Résumé */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700">{validationResult.stats.valid}</p>
              <p className="text-xs text-green-600">lignes valides</p>
            </div>
            <div className={`rounded-lg border p-3 text-center ${validationResult.stats.invalid > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <AlertCircle className={`h-5 w-5 mx-auto mb-1 ${validationResult.stats.invalid > 0 ? 'text-red-500' : 'text-gray-300'}`} />
              <p className={`text-xl font-bold ${validationResult.stats.invalid > 0 ? 'text-red-700' : 'text-gray-400'}`}>{validationResult.stats.invalid}</p>
              <p className={`text-xs ${validationResult.stats.invalid > 0 ? 'text-red-600' : 'text-gray-400'}`}>erreurs</p>
            </div>
            <div className={`rounded-lg border p-3 text-center ${validationResult.warnings.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
              <AlertTriangle className={`h-5 w-5 mx-auto mb-1 ${validationResult.warnings.length > 0 ? 'text-amber-500' : 'text-gray-300'}`} />
              <p className={`text-xl font-bold ${validationResult.warnings.length > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{validationResult.warnings.length}</p>
              <p className={`text-xs ${validationResult.warnings.length > 0 ? 'text-amber-600' : 'text-gray-400'}`}>avertissements</p>
            </div>
          </div>

          {/* Avertissements */}
          {validationResult.warnings.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1">
              {validationResult.warnings.slice(0, 5).map((w, i) => (
                <p key={i} className="text-xs text-amber-700">⚠ {w}</p>
              ))}
            </div>
          )}

          {/* Erreurs */}
          {validationResult.invalid_rows.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-red-700 mb-2">Lignes en erreur :</p>
              {validationResult.invalid_rows.slice(0, 10).map((row, i) => (
                <div key={i} className="text-xs text-red-600">
                  <span className="font-medium">Ligne {i + 1} :</span>{' '}
                  {(row._errors as string[]).join(' · ')}
                </div>
              ))}
              {validationResult.invalid_rows.length > 10 && (
                <p className="text-xs text-red-500">…et {validationResult.invalid_rows.length - 10} autres erreurs</p>
              )}
            </div>
          )}

          {/* Option n'importer que les lignes valides */}
          {validationResult.invalid_rows.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyValid}
                onChange={e => setOnlyValid(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">
                Importer uniquement les <strong>{validationResult.valid_rows.length}</strong> lignes valides
              </span>
            </label>
          )}

          {/* Aperçu */}
          {validationResult.valid_rows.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Aperçu — 5 premières lignes valides
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {Object.keys(validationResult.valid_rows[0])
                        .filter(k => k !== '_errors')
                        .slice(0, 6)
                        .map(k => (
                          <th key={k} className="text-left px-3 py-2 font-semibold text-gray-500">{k}</th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {validationResult.valid_rows.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {Object.entries(row)
                          .filter(([k]) => k !== '_errors')
                          .slice(0, 6)
                          .map(([k, v]) => (
                            <td key={k} className="px-3 py-2 text-gray-700 max-w-[100px] truncate">
                              {String(v ?? '')}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              <ChevronLeft className="mr-1 h-4 w-4" />Retour
            </Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              disabled={importCount === 0 || importing}
              onClick={handleImport}
            >
              {importing
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Import en cours…</>
                : <>Importer {importCount} ligne{importCount > 1 ? 's' : ''} <ChevronRight className="ml-1 h-4 w-4" /></>
              }
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function ImportPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [dataType, setDataType] = useState('pipeline')

  const reset = () => {
    setStep(1)
    setParseResult(null)
    setMapping({})
    setDataType('pipeline')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Upload className="h-5 w-5 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-900">Import données</h1>
      </div>

      <StepIndicator current={step} />

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-800">
            {step === 1 && 'Sélection du fichier'}
            {step === 2 && 'Correspondance des colonnes'}
            {step === 3 && 'Validation et import'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <Step1
              onNext={result => {
                setParseResult(result)
                setStep(2)
              }}
            />
          )}
          {step === 2 && parseResult && (
            <Step2
              parseResult={parseResult}
              onBack={() => setStep(1)}
              onNext={(m, dt) => {
                setMapping(m)
                setDataType(dt)
                setStep(3)
              }}
            />
          )}
          {step === 3 && parseResult && (
            <Step3
              parseResult={parseResult}
              mapping={mapping}
              dataType={dataType}
              onBack={() => setStep(2)}
              onDone={() => {
                reset()
                router.push('/dashboard')
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
