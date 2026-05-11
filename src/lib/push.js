import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

function hasPushConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
  )
}

function configureWebPush() {
  if (!hasPushConfig()) return false

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@logbook.local',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  return true
}

export async function sendPushToUser(userId, payload) {
  if (!configureWebPush()) {
    console.warn('Configuration VAPID manquante : notification push non envoyée.')
    return
  }

  const admin = createAdminClient()
  const { data: subscriptions, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) {
    console.error('Lecture des abonnements push impossible', error)
    return
  }

  await Promise.all(
    (subscriptions ?? []).map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify(payload)
        )
      } catch (error) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await admin
            .from('push_subscriptions')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', subscription.id)
        } else {
          console.error('Notification push non envoyée', error)
        }
      }
    })
  )
}
