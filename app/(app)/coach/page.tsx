'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Brain, Send, Loader2, ChevronDown, ChevronUp,
  BarChart2, TrendingUp, Compass, Shield, History, MessageSquare,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { coachApi, type AnalysisType, type ChatMessage, type HistoryEntry } from '@/lib/api'

// ── Constantes ────────────────────────────────────────────────────────────────

const ANALYSES: { type: AnalysisType; label: string; desc: string; icon: React.ElementType }[] = [
  { type: 'pestel', label: 'PESTEL',   desc: 'Analyse macro-environnementale',          icon: Compass   },
  { type: 'bcg',    label: 'BCG',      desc: 'Matrice portefeuille produits/segments',  icon: BarChart2 },
  { type: 'ansoff', label: 'Ansoff',   desc: 'Stratégies de croissance',                icon: TrendingUp},
  { type: 'porter', label: 'Porter',   desc: 'Forces concurrentielles (5 forces)',      icon: Shield    },
]

// ── Sous-composants ───────────────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-gray max-w-none
      prose-headings:font-semibold prose-headings:text-gray-800
      prose-h2:text-base prose-h3:text-sm
      prose-p:text-gray-600 prose-p:leading-relaxed
      prose-li:text-gray-600
      prose-strong:text-gray-800
      prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}

function AnalysisCard({
  entry,
  defaultOpen = false,
}: {
  entry: HistoryEntry
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const meta = ANALYSES.find(a => a.type === entry.type)
  const Icon = meta?.icon ?? Brain

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-teal-600" />
          <span className="font-semibold text-sm text-gray-800">{meta?.label ?? entry.type.toUpperCase()}</span>
          <span className="text-xs text-gray-400">— {entry.created_at}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <MarkdownContent content={entry.content} />
        </div>
      )}
    </div>
  )
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? 'bg-teal-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {isUser
          ? <p>{msg.content}</p>
          : <MarkdownContent content={msg.content} />
        }
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

type Tab = 'analyze' | 'chat' | 'history'

export default function CoachPage() {
  const [tab, setTab] = useState<Tab>('analyze')

  // ── Analyze tab ──
  const [analyzing, setAnalyzing] = useState<AnalysisType | null>(null)
  const [result, setResult] = useState<{ type: AnalysisType; content: string } | null>(null)

  const handleAnalyze = async (type: AnalysisType) => {
    setAnalyzing(type)
    setResult(null)
    try {
      const data = await coachApi.analyze(type)
      setResult({ type: data.analysis_type, content: data.content })
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur Coach IA', description: (e as Error).message })
    } finally {
      setAnalyzing(null)
    }
  }

  // ── Chat tab ──
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || chatLoading) return
    setInput('')
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setChatLoading(true)
    try {
      const reply = await coachApi.chat(text, messages)
      setMessages(prev => [...prev, reply])
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur Chat IA', description: (e as Error).message })
      // Retirer le message utilisateur si erreur
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setChatLoading(false)
    }
  }

  // ── History tab ──
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [histLoading, setHistLoading] = useState(false)

  const loadHistory = async () => {
    setHistLoading(true)
    try {
      const data = await coachApi.history()
      setHistory(data)
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: (e as Error).message })
    } finally {
      setHistLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab])

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'analyze',  label: 'Analyser',   icon: Brain          },
    { id: 'chat',     label: 'Chat libre', icon: MessageSquare  },
    { id: 'history',  label: 'Historique', icon: History        },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="h-6 w-6 text-teal-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coach IA</h1>
          <p className="text-sm text-gray-500">Analyses stratégiques et recommandations personnalisées</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab Analyser ── */}
      {tab === 'analyze' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {ANALYSES.map(a => {
              const Icon = a.icon
              const isRunning = analyzing === a.type
              return (
                <button
                  key={a.type}
                  onClick={() => handleAnalyze(a.type)}
                  disabled={!!analyzing}
                  className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all ${
                    isRunning
                      ? 'border-teal-300 bg-teal-50'
                      : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm'
                  } disabled:opacity-60`}
                >
                  <div className="flex items-center gap-2">
                    {isRunning
                      ? <Loader2 className="h-4 w-4 text-teal-600 animate-spin" />
                      : <Icon className="h-4 w-4 text-teal-600" />
                    }
                    <span className="font-semibold text-sm text-gray-800">{a.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{a.desc}</p>
                </button>
              )
            })}
          </div>

          {analyzing && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-teal-50 border border-teal-200">
              <Loader2 className="h-5 w-5 text-teal-600 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-teal-800">Analyse en cours…</p>
                <p className="text-xs text-teal-600">Claude analyse vos données (10-20 secondes)</p>
              </div>
            </div>
          )}

          {result && !analyzing && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  {(() => { const m = ANALYSES.find(a => a.type === result.type); const I = m?.icon ?? Brain; return <I className="h-4 w-4 text-teal-600" /> })()}
                  Analyse {ANALYSES.find(a => a.type === result.type)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownContent content={result.content} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab Chat ── */}
      {tab === 'chat' && (
        <div className="flex flex-col" style={{ height: '60vh' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <MessageSquare className="h-10 w-10 opacity-30" />
                <p className="text-sm text-center text-gray-500">
                  Posez une question sur votre pipeline,<br />vos performances ou votre stratégie.
                </p>
              </div>
            ) : (
              messages.map((m, i) => <ChatBubble key={i} msg={m} />)
            )}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Posez votre question…"
              disabled={chatLoading}
              className="flex-1 h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm
                focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || chatLoading}
              className="bg-teal-600 hover:bg-teal-700 text-white h-10 w-10 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Tab Historique ── */}
      {tab === 'history' && (
        <div className="space-y-3">
          {histLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <History className="h-10 w-10 opacity-30" />
              <p className="text-sm text-gray-500">Aucune analyse générée pour l&apos;instant</p>
            </div>
          ) : (
            history.map((entry, i) => (
              <AnalysisCard key={i} entry={entry} defaultOpen={i === 0} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
