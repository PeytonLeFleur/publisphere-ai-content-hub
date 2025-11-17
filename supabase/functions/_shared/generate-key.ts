/**
 * Utility to generate encryption key
 * Run with: deno run supabase/functions/_shared/generate-key.ts
 */

function generateEncryptionKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

console.log('\n🔐 Generated Encryption Key (64 hex chars):');
console.log(generateEncryptionKey());
console.log('\n📝 Add this to your Supabase Edge Function secrets:');
console.log('   supabase secrets set ENCRYPTION_SECRET=<key_above>');
console.log('\n');
