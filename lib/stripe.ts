import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe() {
  if (stripeClient) return stripeClient
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  stripeClient = new Stripe(key, {
    // Use account default API version; pin if you prefer
  })
  return stripeClient
}

