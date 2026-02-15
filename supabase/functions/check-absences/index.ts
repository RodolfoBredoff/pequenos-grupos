import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar todos os grupos ativos
    const { data: groups, error: groupsError } = await supabaseClient
      .from("groups")
      .select("id");

    if (groupsError) {
      console.error("Error fetching groups:", groupsError);
      throw groupsError;
    }

    let alertsCreated = 0;

    for (const group of groups || []) {
      // Buscar membros do grupo
      const { data: members, error: membersError } = await supabaseClient
        .from("members")
        .select("id, full_name, group_id")
        .eq("group_id", group.id)
        .eq("is_active", true);

      if (membersError) {
        console.error(`Error fetching members for group ${group.id}:`, membersError);
        continue;
      }

      for (const member of members || []) {
        // Verificar últimas 3 presenças
        const { data: recentAttendance, error: attendanceError } = await supabaseClient
          .rpc("get_consecutive_absences", {
            member_uuid: member.id,
            limit_count: 3,
          });

        if (attendanceError) {
          console.error(`Error checking absences for member ${member.id}:`, attendanceError);
          continue;
        }

        // Se as últimas 3 foram faltas (is_present = false)
        if (
          recentAttendance?.length === 3 &&
          recentAttendance.every((a: any) => !a.is_present)
        ) {
          // Verificar se já existe uma notificação recente para evitar duplicatas
          const { data: existingNotifications } = await supabaseClient
            .from("notifications")
            .select("id")
            .eq("group_id", member.group_id)
            .eq("member_id", member.id)
            .eq("notification_type", "absence_alert")
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          if (!existingNotifications || existingNotifications.length === 0) {
            // Criar notificação
            const { error: notificationError } = await supabaseClient
              .from("notifications")
              .insert({
                group_id: member.group_id,
                notification_type: "absence_alert",
                member_id: member.id,
                message: `${member.full_name} teve 3 faltas consecutivas. Considere entrar em contato.`,
              });

            if (notificationError) {
              console.error(`Error creating notification for member ${member.id}:`, notificationError);
            } else {
              alertsCreated++;
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked absences for ${groups?.length || 0} groups`,
        alerts_created: alertsCreated,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in check-absences function:", error);
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
