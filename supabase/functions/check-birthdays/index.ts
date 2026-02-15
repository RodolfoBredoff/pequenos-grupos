import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: groups, error: groupsError } = await supabaseClient
      .from("groups")
      .select("id");

    if (groupsError) {
      console.error("Error fetching groups:", groupsError);
      throw groupsError;
    }

    let birthdaysFound = 0;

    for (const group of groups || []) {
      const { data: birthdays, error: birthdaysError } = await supabaseClient
        .rpc("get_birthdays_today", {
          group_uuid: group.id,
        });

      if (birthdaysError) {
        console.error(`Error checking birthdays for group ${group.id}:`, birthdaysError);
        continue;
      }

      for (const person of birthdays || []) {
        // Verificar se já existe uma notificação de hoje para evitar duplicatas
        const today = new Date().toISOString().split('T')[0];
        const { data: existingNotifications } = await supabaseClient
          .from("notifications")
          .select("id")
          .eq("group_id", group.id)
          .eq("member_id", person.id)
          .eq("notification_type", "birthday")
          .gte("created_at", today);

        if (!existingNotifications || existingNotifications.length === 0) {
          const { error: notificationError } = await supabaseClient
            .from("notifications")
            .insert({
              group_id: group.id,
              notification_type: "birthday",
              member_id: person.id,
              message: `Hoje é aniversário de ${person.full_name}!`,
            });

          if (notificationError) {
            console.error(`Error creating birthday notification for ${person.id}:`, notificationError);
          } else {
            birthdaysFound++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked birthdays for ${groups?.length || 0} groups`,
        birthdays_found: birthdaysFound,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in check-birthdays function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
