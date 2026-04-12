'use client'

import { useState } from 'react'
import { Upload, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://qomiq-api.onrender.com'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ row_count: number; detected_type: string } | null>(null)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    const token = localStorage.getItem('qomiq_token')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(`${API_URL}/import/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? 'Erreur upload')
      }
      const data = await res.json()
      setResult({ row_count: data.row_count, detected_type: data.detected_type })
      toast({ title: 'Fichier analysé', description: `${data.row_count} lignes détectées (${data.detected_type})` })
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Upload className="h-5 w-5 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-900">Import données</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Importer un fichier CSV ou XLSX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
            <Upload className="h-6 w-6 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">
              {file ? file.name : 'Cliquer pour choisir un fichier'}
            </span>
            <span className="text-xs text-gray-400 mt-1">.csv, .xlsx, .xls</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null) }}
            />
          </label>

          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            disabled={!file || loading}
            onClick={handleUpload}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyse en cours…</>
            ) : (
              'Analyser le fichier'
            )}
          </Button>

          {result && (
            <div className="flex items-center gap-2 text-sm text-teal-700 bg-teal-50 rounded-lg p-3">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                <strong>{result.row_count}</strong> lignes · type détecté : <strong>{result.detected_type}</strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
