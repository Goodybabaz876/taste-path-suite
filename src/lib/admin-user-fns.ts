/**
 * Admin server functions for user management.
 * These run server-side using the Supabase service-role key.
 * Extracted from admin/users.tsx to keep that file manageable.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Create a new user account */
export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: unknown) =>
      d as { email: string; password: string; full_name: string; phone: string }
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Access denied");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: { full_name: data.full_name, phone: data.phone || null },
      email_confirm: true,
    });
    if (error) throw new Error(error.message);

    if (created.user) {
      await supabaseAdmin.from("profiles").upsert({
        id: created.user.id,
        full_name: data.full_name,
        phone: data.phone || null,
        updated_at: new Date().toISOString(),
      });
    }
    return { success: true };
  });

/** Update an existing user's profile (name + phone) */
export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: unknown) =>
      d as { userId: string; full_name: string; phone: string }
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Access denied");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      user_metadata: { full_name: data.full_name, phone: data.phone || null },
    });

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.userId);

    if (error) throw new Error(error.message);
    return { success: true };
  });

/** Delete a user account entirely */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => d as { userId: string })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Access denied");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });
