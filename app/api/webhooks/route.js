import { Webhook } from 'svix'
import { headers } from 'next/headers'
import connectToDB from '@/utils/database'
import User from '@/models/user'

// GET handler so you can hit https://<ngrok>/api/webhooks in a browser to confirm the route is reachable
export async function GET() {
  console.log('[webhook] GET ping received — route is reachable')
  return new Response('Webhook endpoint alive', { status: 200 })
}

export async function POST(req) {
  console.log('\n========== [webhook] POST received ==========')
  console.log('[webhook] timestamp:', new Date().toISOString())

  const SIGNING_SECRET = process.env.SIGNING_SECRET
  console.log('[webhook] SIGNING_SECRET loaded:', SIGNING_SECRET ? `yes (${SIGNING_SECRET.slice(0, 8)}...)` : 'NO — env var missing')

  if (!SIGNING_SECRET) {
    console.error('[webhook] ABORT: SIGNING_SECRET env var not set')
    return new Response('Error: SIGNING_SECRET not configured', { status: 500 })
  }

  const wh = new Webhook(SIGNING_SECRET)

  // Headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')
  console.log('[webhook] svix headers:', {
    'svix-id': svix_id || 'MISSING',
    'svix-timestamp': svix_timestamp || 'MISSING',
    'svix-signature': svix_signature ? `${svix_signature.slice(0, 20)}...` : 'MISSING',
  })

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('[webhook] ABORT: missing svix headers')
    return new Response('Error: Missing Svix headers', { status: 400 })
  }

  // Raw body (must not be re-serialized — svix verifies against exact bytes)
  const body = await req.text()
  console.log('[webhook] body length:', body.length, 'bytes')
  console.log('[webhook] body preview:', body.slice(0, 200) + (body.length > 200 ? '...' : ''))

  let evt
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
    console.log('[webhook] ✓ signature verified')
  } catch (err) {
    console.error('[webhook] ✗ signature verification FAILED:', err.message)
    console.error('[webhook]   → secret in env may not match the Clerk endpoint that sent this event')
    return new Response('Error: Verification error', { status: 400 })
  }

  const { id } = evt.data
  const eventType = evt.type
  console.log(`[webhook] event: ${eventType}, user_id: ${id}`)

  if (eventType === 'user.created' || eventType === 'user.updated') {
    try {
      console.log('[webhook] connecting to DB...')
      await connectToDB()
      console.log('[webhook] ✓ DB connected')

      const email = evt.data.email_addresses?.[0]?.email_address
      console.log('[webhook] extracted email:', email || 'NONE')

      if (!email) {
        console.warn('[webhook] skipping — no email on payload (likely a Clerk test event)')
        return new Response('Skipped: no email', { status: 200 })
      }

      // On create: seed everything from Clerk.
      // On update: sync Clerk-managed fields (email, avatar, username — Clerk owns username
      // uniqueness). first_name/last_name are DB-only.
      const update =
        eventType === 'user.created'
          ? {
              $setOnInsert: {
                clerk_id: evt.data.id,
                email_address: email,
                username: evt.data.username,
                first_name: evt.data.first_name,
                last_name: evt.data.last_name,
                avatar: evt.data.image_url,
              },
            }
          : {
              $set: {
                email_address: email,
                avatar: evt.data.image_url,
                username: evt.data.username,
              },
            }

      console.log(`[webhook] ${eventType === 'user.created' ? 'upserting' : 'updating'} user...`)
      const user = await User.findOneAndUpdate(
        { clerk_id: evt.data.id },
        update,
        { upsert: true, new: true }
      )
      console.log(`[webhook] ✓ user ${eventType === 'user.created' ? 'upserted' : 'updated'}: _id=${user._id} email=${email}`)
    } catch (err) {
      console.error('[webhook] ✗ DB error:', err)
      return new Response('DB error', { status: 500 })
    }
  } else {
    console.log(`[webhook] event type "${eventType}" not handled — returning 200`)
  }

  console.log('========== [webhook] done ==========\n')
  return new Response('Webhook received', { status: 200 })
}
