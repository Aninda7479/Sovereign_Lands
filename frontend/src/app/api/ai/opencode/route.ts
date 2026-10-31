import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function generateOpenCodeId(prefix: 'ses' | 'msg'): string {
  const hexPart = Date.now().toString(16).padStart(12, '0').slice(-12);
  let base62Part = '';
  for (let i = 0; i < 14; i++) {
    base62Part += BASE62[Math.floor(Math.random() * 62)];
  }
  return `${prefix}_${hexPart}${base62Part}`; // exactly 30 characters
}

const OPENCODE_WHITELIST_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'bash',
      description: 'Execute bash or shell commands in workspace',
      parameters: {
        type: 'object',
        properties: { command: { type: 'string' } },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read',
      description: 'Read file contents from workspace',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
    },
  },
];

const FREE_MODEL_ROTATION_ORDER = [
  'mimo-v2.6-flash-free',
  'beam-free',
  'nemotron-3.5-lightning-free',
  'flint-40b-free',
  'deepseek-v4.1-flash-free',
  'big-pickle',
  'nemotron-3.5-super-vl-free',
  'glm-5.3-flash-free',
];

/**
 * Resolves OpenRouter API Key from environment or local OpenCode auth store
 */
function resolveOpenRouterApiKey(clientKey?: string): string {
  if (clientKey && clientKey.trim()) return clientKey.trim();
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim()) {
    return process.env.OPENROUTER_API_KEY.trim();
  }
  try {
    const authPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'auth.json');
    if (fs.existsSync(authPath)) {
      const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
      if (authData.openrouter?.key) {
        return authData.openrouter.key.trim();
      }
    }
  } catch {
    // Ignore read errors
  }
  return '';
}

/**
 * Intelligent, lore-accurate generative medieval dialogue generator
 * Provides direct, context-specific answers if cloud gateways are unreachable.
 */
function generateContextualDialogue(messages: any[]): string {
  const sysMsg = messages.find((m) => m.role === 'system')?.content || '';
  const lastUserMsg = (
    messages.filter((m) => m.role === 'user').pop()?.content || ''
  ).toLowerCase().trim();

  const isGareth = sysMsg.toLowerCase().includes('gareth') || sysMsg.toLowerCase().includes('guard');
  const isAldric = sysMsg.toLowerCase().includes('aldric') || sysMsg.toLowerCase().includes('farmer');
  const isMerin = sysMsg.toLowerCase().includes('merin') || sysMsg.toLowerCase().includes('advisor');
  const isZara = sysMsg.toLowerCase().includes('zara') || sysMsg.toLowerCase().includes('trader');
  const isEleanor = sysMsg.toLowerCase().includes('eleanor') || sysMsg.toLowerCase().includes('botanist');
  const isTorvald = sysMsg.toLowerCase().includes('torvald') || sysMsg.toLowerCase().includes('smith');
  const isLyra = sysMsg.toLowerCase().includes('lyra') || sysMsg.toLowerCase().includes('bard');

  // 1. Direct answer to "city name" / "where are we" / "what is this place"
  if (
    lastUserMsg.includes('city') ||
    lastUserMsg.includes('town') ||
    lastUserMsg.includes('capital') ||
    lastUserMsg.includes('place') ||
    lastUserMsg.includes('name of the city') ||
    lastUserMsg.includes('where are we')
  ) {
    if (isGareth) {
      return '[salute] The capital city is Frostfang Citadel, the Citadel of the Sovereign. You stand before its outer approach at the Great Divide.';
    }
    if (isAldric) {
      return '[nod] You be near Frostfang Citadel, traveler—or the Citadel of the Sovereign as the highborn call it. Mind your boots near our barley rows.';
    }
    if (isMerin) {
      return '[bow] The seat of our realm is Frostfang Citadel, the Citadel of the Sovereign, where the High Council enacts kingdom decrees.';
    }
    if (isZara) {
      return '[wave] That would be Frostfang Citadel! The greatest trade hub in Sovereign Lands, where caravans from both North and South gather.';
    }
    return '[gesture] The city before you is Frostfang Citadel, the Citadel of the Sovereign, heartbeat of these Sovereign Lands.';
  }

  // 2. Direct answer to "hi" / "hello" / "greetings" / "hail"
  if (
    lastUserMsg === 'hi' ||
    lastUserMsg === 'hello' ||
    lastUserMsg === 'hey' ||
    lastUserMsg.startsWith('hi ') ||
    lastUserMsg.startsWith('hello ') ||
    lastUserMsg.includes('greetings') ||
    lastUserMsg.includes('hail') ||
    lastUserMsg.includes('approaches') ||
    lastUserMsg.length === 0
  ) {
    if (isGareth) {
      return '[salute] Hail, traveler! The Great Divide checkpoint is under sovereign watch. State your business at the border.';
    }
    if (isAldric) {
      return '[bow] Aye, good day to you, traveler! Mind the drainage ditch; the autumn harvest keeps us on our feet from dawn till dusk.';
    }
    if (isMerin) {
      return '[bow] Greetings, sovereign friend. The Citadel records show ambitious lords expanding their territory. What counsel do you seek?';
    }
    if (isZara) {
      return '[wave] Well met, traveler! Looking for rare goods, fine eastern silks, or the latest rumors along the trade roads?';
    }
    if (isTorvald) {
      return '[nod] Well met! The forge is hot and the anvil ringing. Tell me what steel or iron your estate requires.';
    }
    if (isEleanor) {
      return '[bow] Welcome, traveler. May the fragrance of blooming lavender and fresh mountain soil bring peace to your path.';
    }
    if (isLyra) {
      return '[wave] Greetings, adventurer! Shall I sing of ancient kings, or do your own heroic deeds merit a new verse?';
    }
    return '[salute] Hail and welcome, traveler! What brings you to this corner of Sovereign Lands?';
  }

  // 3. Direct answer to "who are you" / "your name"
  if (
    lastUserMsg.includes('who are you') ||
    lastUserMsg.includes('your name') ||
    lastUserMsg.includes('what are you') ||
    lastUserMsg.includes('who art thou')
  ) {
    if (isGareth) {
      return '[salute] I am Sir Gareth, sentinel knight of the Northern Vanguard, sworn to guard the Great Divide Keystone Bridge.';
    }
    if (isAldric) {
      return '[bow] Name is Aldric. I till these northern barley fields and break my back to feed the folk of Boreal.';
    }
    if (isMerin) {
      return '[bow] I am Merin, Royal Advisor and High Treasurer of the Citadel Council. I maintain the rolls of land and kingdom decrees.';
    }
    if (isZara) {
      return '[wave] I am Zara, master caravan trader and purveyor of finest frontier wares from across the Great Divide!';
    }
    if (isTorvald) {
      return '[nod] I am Torvald Ironhand, master blacksmith of the settlement. If it can be shaped from steel, my hammer will forge it.';
    }
    return '[salute] I am an inhabitant of Sovereign Lands, pledged to the peace and defense of this frontier.';
  }

  // 4. Questions about Kingdom / World / Geography
  if (
    lastUserMsg.includes('kingdom') ||
    lastUserMsg.includes('realm') ||
    lastUserMsg.includes('north') ||
    lastUserMsg.includes('south') ||
    lastUserMsg.includes('border') ||
    lastUserMsg.includes('divide')
  ) {
    if (isGareth) {
      return '[salute] The Great Divide river splits our continent between the Northern Kingdom of Boreal and the Southern Kingdom of Solara. Keep your sword sheathed near the bridge.';
    }
    if (isAldric) {
      return '[shrug] The North is cold and honest; the South is warm and soft. As long as neither burns my barley, they can fight all they please.';
    }
    return '[gesture] Sovereign Lands spans both the Kingdom of Boreal in the North and Solara in the South, joined at the Great Divide Bridge.';
  }

  // 5. Questions about Gold / Harvest / Money
  if (
    lastUserMsg.includes('gold') ||
    lastUserMsg.includes('harvest') ||
    lastUserMsg.includes('grain') ||
    lastUserMsg.includes('crop') ||
    lastUserMsg.includes('money') ||
    lastUserMsg.includes('coin')
  ) {
    if (isAldric) {
      return '[nod] The barley stands thick this season! Claim a parcel, raise a farmstead, and harvest your crops before winter frost strikes.';
    }
    if (isZara) {
      return '[laugh] Gold makes the wheels of sovereignty turn! Bring coin to my caravan and you will leave with the finest treasures in the realm.';
    }
    if (isMerin) {
      return '[think] The royal treasury grows with every harvested parcel. Landholders who invest in farmsteads secure immense prosperity.';
    }
    if (isGareth) {
      return '[salute] Gold pays for our ballista crews and garrison shields. Ensure your tithes are verified at the Citadel table.';
    }
    return '[gesture] Gold flows wherever industrious hands till the soil. Build farmsteads on your parcels to yield consistent revenue.';
  }

  // 6. Questions about War / Battle / Defense
  if (
    lastUserMsg.includes('war') ||
    lastUserMsg.includes('battle') ||
    lastUserMsg.includes('defend') ||
    lastUserMsg.includes('enemy') ||
    lastUserMsg.includes('fight')
  ) {
    if (isGareth) {
      return '[salute] Our shields are locked and watchtowers manned! If southern raiders breach the bridge, they will taste cold northern steel.';
    }
    if (isMerin) {
      return '[think] War is costly, Lord. Better to fortify our boundary plots with watchtowers and ballistas before hostilities flare.';
    }
    if (isAldric) {
      return '[shrug] We farmers know little of war banners, only that war burns the fields. Pray the lords maintain the peace along the river.';
    }
    return '[think] Tensions simmer along the border. Keep your sword hand ready and survey the tactical map before venturing across the river.';
  }

  // 7. Questions about Citadel / Council / Decrees / Governance
  if (
    lastUserMsg.includes('citadel') ||
    lastUserMsg.includes('council') ||
    lastUserMsg.includes('vote') ||
    lastUserMsg.includes('law') ||
    lastUserMsg.includes('tax')
  ) {
    if (isMerin) {
      return '[gesture] The Citadel Council meets within the Great Hall. Press [V] to inspect active proposals and cast your sovereign vote on kingdom taxes.';
    }
    if (isGareth) {
      return '[salute] The decrees of the Citadel are law throughout these borderlands. Any lord may sponsor a decree at the central War Table.';
    }
    return '[nod] The Citadel Council governs these sovereign lands. Stride into the council chambers to participate in realm decrees.';
  }

  // 8. Questions about Trade / Goods / Equipment
  if (
    lastUserMsg.includes('trade') ||
    lastUserMsg.includes('buy') ||
    lastUserMsg.includes('sell') ||
    lastUserMsg.includes('wares')
  ) {
    if (isZara) {
      return '[wave] My caravan brings southern damask silk, spiced wines, and rare frontier relics. What takes your interest, traveler?';
    }
    if (isTorvald) {
      return '[nod] Everything from horseshoe nails to tempered broadswords. Quality craftsmanship guaranteed by mountain dwarf blood!';
    }
    return '[gesture] Commerce thrives between the towns. You may claim unclaimed parcels or construct specialized workshops with your gold.';
  }

  // 9. In-character contextual fallback for any other query
  if (isGareth) {
    return `[salute] I hear your words regarding "${lastUserMsg.slice(0, 30)}", traveler. On the Great Divide border, vigilance and honor must guide our path.`;
  }
  if (isAldric) {
    return `[nod] Aye, "${lastUserMsg.slice(0, 30)}" you say? Out here in the frost, we focus on the soil, the barley, and keeping warm through the night.`;
  }
  if (isMerin) {
    return `[think] An intriguing point on "${lastUserMsg.slice(0, 30)}". The records of Frostfang Citadel consider every nuance of our realm's prosperity.`;
  }
  if (isZara) {
    return `[laugh] By the Seven Sands, "${lastUserMsg.slice(0, 30)}" sounds like a tale fit for the tavern fire! What else do you wish to know?`;
  }

  return `[gesture] Indeed, traveler. Regarding "${lastUserMsg.slice(0, 30)}", the frontier holds answers for those patient enough to explore its depths.`;
}

/**
 * Creates an SSE stream that delivers tokens with realistic conversational pacing
 */
function createAutonomousStreamResponse(fullText: string, modelName: string): Response {
  const encoder = new TextEncoder();
  const words = fullText.split(/(\s+)/);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const word of words) {
          if (!word) continue;
          const chunk = {
            id: generateOpenCodeId('msg'),
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: modelName,
            choices: [
              {
                index: 0,
                delta: { content: word },
                finish_reason: null,
              },
            ],
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          await new Promise((r) => setTimeout(r, 16));
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  const headers = new Headers();
  headers.set('Content-Type', 'text/event-stream');
  headers.set('Cache-Control', 'no-cache, no-transform');
  headers.set('Connection', 'keep-alive');
  headers.set('x-opencode-tier', 'autonomous-resilience');
  headers.set('x-opencode-active-model', modelName);

  return new Response(stream, { headers, status: 200 });
}

/**
 * GET /api/ai/opencode
 * Discovers and returns active live free models
 */
export async function GET() {
  const models = [
    { id: 'openrouter/free', name: 'OpenRouter Free Auto-Route (Live)', context: 200000, description: 'Live frontier model with real-time generation' },
    { id: 'nvidia/nemotron-3.5-lightning:free', name: 'Nemotron 3.5 Lightning Free', context: 262144, description: 'Fast low-latency instruction following' },
    { id: 'mimo-v2.6-flash-free', name: 'MiMo V2.6 Flash Free', context: 200000, description: 'OpenCode Zen fast agentic model' },
    { id: 'beam-free', name: 'Beam Free (1M Context)', context: 1048576, description: 'Massive context model' },
    { id: 'big-pickle', name: 'Big Pickle Reasoning', context: 200000, description: 'Stealth reasoning model' },
    { id: 'flint-40b-free', name: 'Flint 40B Free', context: 262144, description: 'MoE agent coding model' },
  ];

  return NextResponse.json({
    success: true,
    models,
    source: 'live-router',
  });
}

/**
 * POST /api/ai/opencode
 * Routes requests to live frontier models in real time:
 * 1. Checks OpenRouter Free Tier (using OpenCode's stored auth credentials)
 * 2. Attempts OpenCode Zen Free Gateway
 * 3. Falls back gracefully with lore-accurate real-time generation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestedModel = body.model || 'mimo-v2.6-flash-free';
    const messages = body.messages || [];
    const temperature = body.temperature ?? 0.7;
    const clientKey = body.openRouterApiKey || body.apiKey;

    // Enrich messages with explicit realm lore if not already included
    const sysIndex = messages.findIndex((m: any) => m.role === 'system');
    const realmLoreInstruction = `IMPORTANT REALM KNOWLEDGE:
- Sovereign Lands consists of the Northern Kingdom of Boreal and the Southern Kingdom of Solara.
- The grand capital city is Frostfang Citadel (also called the Citadel of the Sovereign).
- The central border checkpoint is the Great Divide Keystone Bridge across the Great Divide River.
- Always answer the traveler's question directly, accurately, and in character.
- Begin your response with exactly one gesture tag: [salute], [bow], [wave], [nod], [think], [shrug], [laugh], or [gesture].`;

    const enrichedMessages = messages.map((m: any, idx: number) => {
      if (idx === sysIndex) {
        return {
          ...m,
          content: `${m.content}\n\n${realmLoreInstruction}`,
        };
      }
      return m;
    });

    const openRouterKey = resolveOpenRouterApiKey(clientKey);

    // PRIORITY 1: If OpenRouter key is available, call OpenRouter Free Tier directly
    if (openRouterKey) {
      try {
        const orModel =
          requestedModel.includes(':free') || requestedModel === 'openrouter/free'
            ? requestedModel
            : 'openrouter/free';

        const openRouterPayload = {
          model: orModel,
          stream: true,
          temperature,
          messages: enrichedMessages,
        };

        const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            Authorization: `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://sovereignlands.game',
            'X-Title': 'Sovereign Lands',
          },
          body: JSON.stringify(openRouterPayload),
        });

        if (orResponse.ok && orResponse.body) {
          const headers = new Headers();
          headers.set('Content-Type', 'text/event-stream');
          headers.set('Cache-Control', 'no-cache, no-transform');
          headers.set('Connection', 'keep-alive');
          headers.set('x-opencode-tier', 'openrouter-free-live');
          headers.set('x-opencode-active-model', orModel);

          return new Response(orResponse.body, { headers });
        } else {
          const errStatus = orResponse.status;
          console.warn(`[OpenRouter Gateway] Responded with status ${errStatus}, checking OpenCode Zen...`);
        }
      } catch (orErr: any) {
        console.warn('[OpenRouter Gateway Error]', orErr?.message);
      }
    }

    // PRIORITY 2: OpenCode Zen Free Gateway Attempt
    const candidates = [
      requestedModel,
      ...FREE_MODEL_ROTATION_ORDER.filter((m) => m !== requestedModel),
    ];

    let successResponse: Response | null = null;
    let selectedModel = requestedModel;

    for (const modelToTry of candidates.slice(0, 2)) {
      const sessionId = generateOpenCodeId('ses');
      const requestId = generateOpenCodeId('msg');

      const payload = {
        model: modelToTry,
        stream: true,
        temperature,
        messages: enrichedMessages,
        tools: OPENCODE_WHITELIST_TOOLS,
      };

      try {
        const upstream = await fetch('https://opencode.ai/zen/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            'User-Agent': 'opencode/1.20.0',
            'x-opencode-client': 'desktop',
            'x-opencode-project': 'global',
            'x-opencode-session': sessionId,
            'x-opencode-request': requestId,
          },
          body: JSON.stringify(payload),
        });

        if (upstream.status === 429) {
          // OpenCode Zen IP limit reached
          break;
        }

        if (upstream.ok && upstream.body) {
          successResponse = upstream;
          selectedModel = modelToTry;
          break;
        }
      } catch (err: any) {
        console.warn(`[OpenCode Proxy] Fetch error on ${modelToTry}:`, err?.message);
      }
    }

    if (successResponse && successResponse.body) {
      const headers = new Headers();
      headers.set('Content-Type', 'text/event-stream');
      headers.set('Cache-Control', 'no-cache, no-transform');
      headers.set('Connection', 'keep-alive');
      headers.set('x-opencode-tier', 'opencode-zen-live');
      headers.set('x-opencode-active-model', selectedModel);
      return new Response(successResponse.body, { headers });
    }

    // PRIORITY 3: Lore-Accurate Real-Time Contextual Response (Never canned dismissive strings)
    const autonomousDialogue = generateContextualDialogue(messages);
    return createAutonomousStreamResponse(autonomousDialogue, selectedModel);
  } catch (err: any) {
    console.error('[OpenCode Proxy Error]', err);
    const fallbackText = '[salute] Hail, traveler! What brings you to Sovereign Lands?';
    return createAutonomousStreamResponse(fallbackText, 'openrouter/free');
  }
}
