
import { createClient } from '@supabase/supabase-js';
import { PlayerData, Profile, HUDSettings, AudioSettings, DailyScore } from './types';

// ATENÇÃO: Chave atualizada v1.7.5
const supabaseUrl = 'https://hkjnqyvxzphzkpgnlbwx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhram5xeXZ4enBoemtwZ25sYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDI1MzEsImV4cCI6MjA4NTI3ODUzMX0.I3xJx2oiEaOGh45xJZmPXKVAipL7v9GvCJdIhJC8bXo';

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const LOCAL_STORAGE_KEY = 'sg_arcade_save';

const DEFAULT_HUD: HUDSettings = {
  opacity: 0.7,
  scale: 1.0,
  leftHanded: false,
  joystickPos: { x: 15, y: 75 },
  skillBtnPos: { x: 85, y: 75 }
};

const DEFAULT_AUDIO: AudioSettings = {
  masterVolume: 0.5,
  musicVolume: 0.5,
  sfxVolume: 0.5
};

export const ensureAuthenticated = async () => {
  if (!supabase) return null;
  try {
    // Reduzi o timeout para 1.5s. Na Itch.io, os jogadores querem "Instant Play".
    // Se a conexão falhar (comum se o domínio itch.io não estiver na whitelist do Supabase),
    // ele cai para o modo offline (localStorage) rapidamente.
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout na conexão')), 1500));
    const sessionPromise = supabase.auth.getSession();
    const result: any = await Promise.race([sessionPromise, timeout]);
    const { data: { session }, error } = result;

    if (error) throw error;
    if (session) return session.user;

    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError) throw anonError;
    return anonData.user;
  } catch (err) {
    console.warn("Offline mode: Auth unavailable", err);
    return null;
  }
};

interface LoadResult {
  data: PlayerData;
  isOnline: boolean;
}

export const getPlayerData = async (): Promise<LoadResult> => {
  const defaultData: PlayerData = { 
    username: 'ROOKIE', 
    scrap: 0, 
    darkMatter: 0,
    highScore: 0, 
    inventory: [],
    level: 1,
    currentXp: 0,
    maxWave: 0,
    lastSeenVersion: '0.0.0',
    language: 'pt',
    hudSettings: DEFAULT_HUD,
    audioSettings: DEFAULT_AUDIO,
    modules: { inventory: [], equipped: {} },
    shipMastery: {}
  };

  if (supabase) {
    try {
      const user = await ensureAuthenticated();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*') 
          .eq('id', user.id)
          .single();
        
        if (error && error.code === 'PGRST116') {
           const initialData = { 
             id: user.id, 
             username: 'ROOKIE', 
             scrap: 0, 
             dark_matter: 0,
             high_score: 0, 
             inventory: [],
             level: 1,
             current_xp: 0,
             max_wave: 0,
             language: 'pt',
             last_seen_version: '0.0.0',
             hud_settings: DEFAULT_HUD,
             audio_settings: DEFAULT_AUDIO,
             modules: { inventory: [], equipped: {} },
             ship_mastery: {}
           };
           await supabase.from('profiles').insert(initialData);
           return { data: defaultData, isOnline: true };
        }

        if (data) {
          const loadedHud = (data.hud_settings as HUDSettings) || DEFAULT_HUD;
          const mergedHud = { ...DEFAULT_HUD, ...loadedHud };
          
          const loadedAudio = (data.audio_settings as AudioSettings) || DEFAULT_AUDIO;
          const mergedAudio = { ...DEFAULT_AUDIO, ...loadedAudio };

          const loadedModules = data.modules || { inventory: [], equipped: {} };
          const loadedMastery = data.ship_mastery || {};

          return {
            data: {
              username: data.username || `PILOT-${user.id.substring(0,4).toUpperCase()}`,
              scrap: data.scrap || 0,
              darkMatter: data.dark_matter || 0,
              highScore: data.high_score || 0,
              inventory: Array.isArray(data.inventory) ? data.inventory : [],
              level: data.level || 1,
              currentXp: data.current_xp || 0,
              maxWave: data.max_wave || 0,
              lastSeenVersion: data.last_seen_version || '0.0.0',
              language: data.language || 'pt',
              hudSettings: mergedHud,
              audioSettings: mergedAudio,
              modules: loadedModules,
              shipMastery: loadedMastery
            },
            isOnline: true
          };
        }
      }
    } catch (error) {
      console.warn('Switching to local save due to network error');
    }
  }

  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      const parsed = JSON.parse(localData);
      if (!parsed.hudSettings) parsed.hudSettings = DEFAULT_HUD;
      if (!parsed.audioSettings) parsed.audioSettings = DEFAULT_AUDIO;
      if (!parsed.modules) parsed.modules = { inventory: [], equipped: {} };
      if (!parsed.shipMastery) parsed.shipMastery = {};
      if (parsed.darkMatter === undefined) parsed.darkMatter = 0;
      return { 
        data: { ...defaultData, ...parsed }, 
        isOnline: false
      };
    }
  } catch (error) {
    console.warn('Erro ao ler LocalStorage', error);
  }

  return { 
    data: defaultData,
    isOnline: false
  };
};

export const savePlayerData = async (data: PlayerData) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erro no LocalStorage save', error);
  }

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        await supabase.from('profiles').upsert({
          id: session.user.id,
          username: data.username,
          scrap: data.scrap,
          dark_matter: data.darkMatter,
          high_score: data.highScore,
          inventory: data.inventory,
          level: data.level,
          current_xp: data.currentXp,
          max_wave: data.maxWave,
          language: data.language,
          last_seen_version: data.lastSeenVersion,
          hud_settings: data.hudSettings,
          audio_settings: data.audioSettings,
          modules: data.modules,
          ship_mastery: data.shipMastery
        });
      }
    } catch (error) {
      // Silencioso se offline
    }
  }
};

export const getLeaderboard = async (): Promise<Profile[]> => {
  if (!supabase) return [];
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Leaderboard')), 2000));
    const query = supabase
      .from('profiles')
      .select('id, username, high_score, scrap, level')
      .order('high_score', { ascending: false })
      .limit(10);
      
    const { data, error } = await Promise.race([query, timeout]) as any;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.log("Leaderboard offline or unreachable."); 
    return [];
  }
};

// --- DAILY OPS ---

export const submitDailyScore = async (score: number, wave: number, shipId: string) => {
    if (!supabase) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // Formato YYYY-MM-DD
        const today = new Date().toISOString().slice(0, 10);

        // Verifica se já existe pontuação hoje. Se sim, atualiza SÓ se for maior.
        // Como não temos acesso direto à estrutura SQL, assumimos uma tabela 'daily_scores'
        // Se ela não existir, isso vai falhar silenciosamente no console.
        const { data: existing } = await supabase
            .from('daily_scores')
            .select('score')
            .eq('user_id', session.user.id)
            .eq('date', today)
            .single();

        if (existing && existing.score >= score) {
            return; // Score atual é menor ou igual
        }

        // Upsert logic (se tabela tiver constraints corretas) ou Insert/Update manual
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
        
        await supabase.from('daily_scores').upsert({
            user_id: session.user.id,
            date: today,
            username: profile?.username || 'PILOT',
            score: score,
            wave: wave,
            ship_id: shipId
        }, { onConflict: 'user_id, date' });

    } catch (e) {
        console.warn("Daily score submission failed", e);
    }
};

export const getDailyLeaderboard = async (): Promise<DailyScore[]> => {
    if (!supabase) return [];
    try {
        const today = new Date().toISOString().slice(0, 10);
        const { data, error } = await supabase
            .from('daily_scores')
            .select('*')
            .eq('date', today)
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.log("Daily Leaderboard unavailable");
        return [];
    }
};
