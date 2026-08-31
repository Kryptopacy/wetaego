import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 86400

const METADATA = {
  issuer: 'https://ourmenuos.online',
  authorization_endpoint: 'https://ourmenuos.online/login',
  token_endpoint: 'https://ourmenuos.online/api/auth/token',
  userinfo_endpoint: 'https://ourmenuos.online/api/auth/userinfo',
  jwks_uri: 'https://ourmenuos.online/api/auth/jwks',
  response_types_supported: ['code', 'token', 'id_token'],
  subject_types_supported: ['public'],
  id_token_signing_alg_values_supported: ['RS256', 'ES256'],
  scopes_supported: ['openid', 'profile', 'email', 'orders:read', 'orders:write', 'catalog:read', 'catalog:write'],
  token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'private_key_jwt'],
  claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'email', 'name']
}

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
  'Vary': 'Accept, Accept-Encoding'
}

export async function GET() {
  return NextResponse.json(METADATA, {
    status: 200,
    headers: HEADERS
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: HEADERS
  })
}
