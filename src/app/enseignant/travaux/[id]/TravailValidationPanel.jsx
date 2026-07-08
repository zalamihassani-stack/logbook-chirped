'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { validateTravail, refuseTravail } from '@/app/actions/enseignant'
import { getTravailValidationActionLabel } from '@/lib/travaux'
import AppCard from '@/components/ui/AppCard'
import { toast } from 'sonner'
import { useServerAction } from '@/hooks/useServerAction'

export default function TravailValidationPanel({ travail }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState('')
  const [pendingAction, setPendingAction] = useState('')
  const [isPending, startTransition] = useTransition()
  const { execute, error, setError } = useServerAction()

  function runAction(action) {
    if (action === 'refuse' && !feedback.trim()) {
      setError('La justification est obligatoire pour demander des corrections.')
      return
    }
    const actionFn = action === 'validate' ? validateTravail : refuseTravail
    setPendingAction(action)
    startTransition(async () => {
      const res = await execute(actionFn, travail.id, feedback)
      setPendingAction('')
      if (!res?.error) {
        toast.success(action === 'validate' ? 'Travail validé avec succès.' : 'Corrections demandées — résident notifié.')
        setFeedback('')
        router.refresh()
      }
    })
  }

  return (
    <AppCard className="p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Traitement de la demande</p>
        <p className="mt-1 text-xs text-slate-500">
          Validez le travail ou demandez des corrections avec une justification.
        </p>
      </div>

      <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-navy)' }}>
        Commentaire / justification
      </label>
      <textarea
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        rows={4}
        placeholder="Optionnel pour valider, obligatoire pour refuser"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
      />

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => runAction('refuse')}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 disabled:opacity-60"
        >
          <XCircle size={16} strokeWidth={1.8} />
          {pendingAction === 'refuse' ? 'Refus...' : 'Demander des corrections'}
        </button>
        <button
          type="button"
          onClick={() => runAction('validate')}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          <CheckCircle2 size={16} strokeWidth={1.8} />
          {pendingAction === 'validate' ? 'Validation...' : getTravailValidationActionLabel(travail.validation_status)}
        </button>
      </div>
    </AppCard>
  )
}
