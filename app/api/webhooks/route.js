import { Webhook } from 'svix'
import { headers } from 'next/headers'
import connectToDB from '@/utils/database'
import User from '@/models/user'


export async function POST(req) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET)

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  let evt;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) 
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response('Error: Verification error', {
      status: 400,
    })
  }

  // Do something with payload
  // For this guide, log payload to console
  const { id } = evt.data
  const eventType = evt.type
  if (evt.type === 'user.created') {
    
    await connectToDB();
    const user = {
      username:evt.data.username,
      email_address: evt.data.email_addresses[0].email_address,
      first_name:evt.data.first_name,
      last_name: evt.data.last_name,
      avatar: evt.data.image_url,
      clerk_id:evt.data.id
    }
    await User.create(user);
  }
  console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
  // console.log('Webhook payload:', body)

  return new Response('Webhook received', { status: 200 })
}