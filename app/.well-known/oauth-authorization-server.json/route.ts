import { NextResponse } from 'next/server'

export async function GET() {
  const oauthConfig = {
    issuer: 'https://ourmenuos.online',
    authorization_endpoint: 'https://ourmenuos.online/login',
    token_endpoint: 'https://ourmenuos.online/api/auth/token',
    jwks_uri: 'https://ourmenuos.online/api/auth/jwks',
    response_types_supported: ['code', 'token'],
    grant_types_supported: ['authorization_code', 'client_credentials', 'urn:ietf:params:oauth:grant-type:token-exchange'],
    scopes_supported: [
      'orders:read',
      'orders:write',
      'catalog:read',
      'catalog:write',
      'bookings:read',
      'bookings:write'
    ],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'private_key_jwt'],
    service_documentation: 'https://ourmenuos.online/docs',
    agent_auth: {
      register_uri: 'https://ourmenuos.online/auth.md',
      supported_identity_types: ['agent_did', 'client_assertion', 'api_key'],
      credential_types: ['bearer_token', 'api_key']
    }
  }

  return NextResponse.json(oauthConfig, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Vary': 'Accept, Accept-Encoding'
    }
  })
}
