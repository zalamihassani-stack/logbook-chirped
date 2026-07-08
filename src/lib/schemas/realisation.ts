import { z } from 'zod'

export const realisationSchema = z.object({
  procedure_id: z.string().min(1, 'Sélectionnez un geste.'),
  enseignant_id: z.string().min(1, 'Sélectionnez un enseignant.'),
  activity_type: z.enum(['expose', 'supervise', 'autonome'], {
    error: "Sélectionnez un type d'activité.",
  }),
  performed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de réalisation invalide.'),
  ipp_patient: z.string().max(64, 'IPP patient trop long (64 caractères max).').optional(),
  compte_rendu: z.string().optional(),
  commentaire: z.string().optional(),
  superviseur_resident_id: z.string().optional(),
})

export type RealisationInput = z.infer<typeof realisationSchema>

export function validateRealisation(data: unknown): string {
  const result = realisationSchema.safeParse(data)
  if (!result.success) return result.error.issues[0].message
  return ''
}
