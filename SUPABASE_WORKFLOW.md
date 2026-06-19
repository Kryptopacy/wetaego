# Supabase Workflow Instructions

## Environment Details
When applying Supabase migrations or performing database operations, please keep the following in mind:
- **Connection Details:** The Supabase access token, DB password, and project ID (as well as role keys) are available in the local environment file (`apps/web/.env.local`).
- **Migrations & Operations:** You should be able to handle all Supabase needs (such as applying migrations or running queries) directly using the PostgreSQL connection string. You can avoid using the Supabase CLI where a direct connection is sufficient. For instance, you can use `apply_migration.js` to execute `.sql` files directly to the remote server.
- **Server Region:** Our database uses the EU West (Ireland) region pooler `aws-0-eu-west-1.pooler.supabase.com`. Ensure you connect to this endpoint instead of the US-based one.

## Supabase Skills
- Specialized agent skills and instructions for Supabase are located in the `D:\.agents` directory. You can reference them for best practices and any required workflows.
