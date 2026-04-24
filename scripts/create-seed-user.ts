import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load env vars from .env.local
function loadEnv() {
  const envPath = resolve(__dirname, "..", ".env.local");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEED_EMAIL = "seedbot@testkitchenos.com";
const SEED_USERNAME = "Test Kitchen";
const SEED_PASSWORD = "seed-bot-password-2024!";

async function main() {
  console.log("Creating seed user...");

  // Check if user already exists by listing users and filtering
  const { data: existingUsers, error: listError } =
    await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("Error listing users:", listError.message);
    process.exit(1);
  }

  const existing = existingUsers.users.find((u) => u.email === SEED_EMAIL);

  if (existing) {
    console.log(`Seed user already exists with id: ${existing.id}`);
    console.log("Checking profile...");

    // Ensure profile exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", existing.id)
      .single();

    if (!profile) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: existing.id,
        username: SEED_USERNAME,
      });
      if (profileError) {
        console.error("Error creating profile:", profileError.message);
        process.exit(1);
      }
      console.log("Profile created for existing user.");
    } else {
      console.log(`Profile exists: @${profile.username}`);
    }

    console.log(`\nSeed user ID: ${existing.id}`);
    return;
  }

  // Create new user
  const { data: newUser, error: createError } =
    await supabase.auth.admin.createUser({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { username: SEED_USERNAME },
    });

  if (createError) {
    console.error("Error creating user:", createError.message);
    process.exit(1);
  }

  console.log(`User created: ${newUser.user.id}`);

  // Ensure profile is created (trigger should handle this, but just in case)
  await new Promise((r) => setTimeout(r, 1000));

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", newUser.user.id)
    .single();

  if (!profile) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: newUser.user.id,
      username: SEED_USERNAME,
    });
    if (profileError) {
      console.error("Error creating profile:", profileError.message);
      process.exit(1);
    }
    console.log("Profile created manually.");
  } else {
    console.log(`Profile auto-created: @${profile.username}`);
  }

  console.log(`\nSeed user ready!`);
  console.log(`  Email: ${SEED_EMAIL}`);
  console.log(`  ID: ${newUser.user.id}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
