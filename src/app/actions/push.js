'use server'

import { createClient } from '@/lib/supabase/server'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Authentification requise.')
  }

  return { supabase, user }
}

export async function savePushSubscription(subscription, userAgent) {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireUser())
  } catch (error) {
    return { error: error.message }
  }

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return { error: 'Abonnement push invalide.' }
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: userAgent || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  )

  if (error) return { error: error.message }
  return { success: true }
}
