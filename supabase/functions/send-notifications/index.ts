// =============================================
// Jaddidha - Send Push Notifications Edge Function
// Sends to ALL registered devices via Expo Push API
// =============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, body, data } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all active push tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('is_active', true);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tokens', details: tokensError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens registered');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No devices registered' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending to ${tokens.length} devices`);

    // Build messages for Expo Push API
    // Send in batches of 100 (Expo limit)
    const BATCH_SIZE = 100;
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      const messages = batch.map((t) => ({
        to: t.token,
        title,
        body,
        sound: 'default',
        data: data || {},
        priority: 'high',
        channelId: 'jaddidha',
      }));

      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });

        const result = await response.json();
        console.log('Expo Push API response:', JSON.stringify(result));

        if (result.data) {
          result.data.forEach((ticket: any) => {
            if (ticket.status === 'ok') {
              totalSent++;
            } else {
              totalFailed++;
              console.warn('Failed ticket:', ticket);
              // Mark invalid tokens as inactive
              if (ticket.details?.error === 'DeviceNotRegistered') {
                const tokenStr = batch[result.data.indexOf(ticket)]?.token;
                if (tokenStr) {
                  supabase.from('push_tokens').update({ is_active: false }).eq('token', tokenStr);
                }
              }
            }
          });
        }
      } catch (batchError) {
        console.error('Batch send error:', batchError);
        totalFailed += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: tokens.length,
        sent: totalSent,
        failed: totalFailed,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
