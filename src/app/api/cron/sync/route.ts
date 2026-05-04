import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchRiotAccountStats } from '@/lib/riot/client';

// Endpoint para el Vercel Cron Job que actulizará periódicamente los Tiers y ranks.
export async function GET() {
  try {
    // Temporalmente comentado para pruebas locales sin CRON_SECRET
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //  return new NextResponse('Unauthorized', { status: 401 });
    // }

    // Instanciar cliente Supabase Service Role (con bypass de RLS) para tareas de backend.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Note: Using service role key for cron!
    
    if(!supabaseUrl || !supabaseServiceKey) {
      console.warn("Faltan variables para el Cron Job");
      return new NextResponse('Missing Config', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Obtener todas las cuentas que necesitan actualización (ej. ordenadas por la fecha más lejana de suceso o limitadas/paginadas)
    // Extraemos unas cuantas por pasada (Vercel cron limit is ~10s-15s for free tier, so process low batches)
    const { data: accounts, error } = await supabase
      .from('riot_accounts')
      .select('id, game_name, tag_line')
      .order('last_synced_at', { ascending: true, nullsFirst: true })
      .limit(5);

    if (error || !accounts) {
       console.error("Cron fetch error:", error);
       return new NextResponse('DB Error', { status: 500 });
    }

    // 2. Iterar e invocar Api de Riot
    for (const acc of accounts) {
      const stats = await fetchRiotAccountStats(acc.game_name, acc.tag_line);
      
      if (stats) {
        await supabase
          .from('riot_accounts')
          .update({
            tier: stats.tier,
            rank: stats.rank,
            lp: stats.lp,
            win_rate: stats.winRate,
            routing_platform: stats.routingPlatform ?? null,
            last_synced_at: new Date().toISOString()
          })
          .eq('id', acc.id);
      }
    }

    return NextResponse.json({ success: true, accountsProcessed: accounts.length });
  } catch (error) {
    console.error("Cron error:", error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
