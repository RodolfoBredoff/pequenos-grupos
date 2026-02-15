import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Verificar secret de autorização
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Chamar Edge Functions
    const results = await Promise.all([
      fetch(`${supabaseUrl}/functions/v1/check-absences`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }),
      fetch(`${supabaseUrl}/functions/v1/check-birthdays`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }),
    ]);

    const [absencesResult, birthdaysResult] = await Promise.all(
      results.map((r) => r.json())
    );

    return NextResponse.json({
      success: true,
      absences: absencesResult,
      birthdays: birthdaysResult,
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
