

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

let bgmInterval: number | null = null;
let bgmSource: AudioBufferSourceNode | null = null;
let currentTrackId: string | null = null; // Nova variável para rastrear a música atual
let isMuted = false;

// Volumes
let volMaster = 0.5;
let volMusic = 0.5;
let volSfx = 0.5;

let cachedNoiseBuffer: AudioBuffer | null = null;

// --- ASSET MANAGER ---
const buffers: Record<string, AudioBuffer> = {};
let packLoaded = false; // Flag para UI

// Nomes dos arquivos (sem caminho, apenas o nome)
const SOUND_FILES = {
    'shoot': 'shoot.mp3',
    'explosion': 'explosion.mp3',
    'hit': 'hit.mp3',
    'collect': 'collect.mp3',
    'powerup': 'powerup.mp3',
    'game_over': 'gameover.mp3',
    'ultimate_use': 'ultimate.mp3',
    'ui_click': 'click.mp3',
    'bgm_game': 'music_game.mp3',
    'bgm_menu': 'music_menu.mp3'
};

const initAudio = () => {
  if (!audioCtx) {
    // @ts-ignore
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    masterGain = audioCtx.createGain();
    masterGain.gain.value = volMaster;
    masterGain.connect(audioCtx.destination);
    
    musicGain = audioCtx.createGain();
    musicGain.gain.value = volMusic;
    musicGain.connect(masterGain);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = volSfx;
    sfxGain.connect(masterGain);

    // Buffer de ruído para fallback
    const bufferSize = audioCtx.sampleRate * 2.0; 
    cachedNoiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = cachedNoiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

// Helper Seguro para Base URL (Evita crash se import.meta for undefined)
const getBaseUrl = (): string => {
  try {
    // @ts-ignore
    const meta = import.meta as any;
    const base = meta && meta.env && meta.env.BASE_URL;

    if (typeof base === "string" && base.length > 0) {
      return base.endsWith("/") ? base : base + "/";
    }
  } catch (e) {
    // Ignora erro e usa fallback
  }
  return "/";
};

// Carrega arquivo com retry em diferentes caminhos
const fetchAudioWithRetry = async (filename: string): Promise<ArrayBuffer> => {
    const baseUrl = getBaseUrl();
    
    // Lista de caminhos para tentar
    const pathsToTry = [
        `${baseUrl}sounds/${filename}`, // Caminho via Vite Base URL
        `/sounds/${filename}`,          // Caminho absoluto padrão
        `sounds/${filename}`            // Caminho relativo
    ];

    // Remove duplicatas (caso baseUrl seja /)
    const uniquePaths = [...new Set(pathsToTry)];

    for (const path of uniquePaths) {
        try {
            const response = await fetch(path);
            // Verifica se ok e se não é um redirect para index.html (comum em SPAs 404)
            const contentType = response.headers.get('content-type');
            if (response.ok && (!contentType || !contentType.includes('text/html'))) {
                return await response.arrayBuffer();
            }
        } catch (e) {
            // Tenta o próximo
        }
    }
    throw new Error(`Could not load audio file: ${filename}`);
};

// Carrega um único som
const loadSound = async (key: string, filename: string) => {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    try {
        const arrayBuffer = await fetchAudioWithRetry(filename);
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        buffers[key] = audioBuffer;
        packLoaded = true; // Se carregou pelo menos um, consideramos ativo
    } catch (error) {
        // Silencioso: se falhar, usaremos o sintetizador
        console.warn(`Failed to load sound: ${key}`, error);
    }
};

// Carrega todos os sons definidos
export const loadAllSounds = async () => {
    const promises = Object.entries(SOUND_FILES).map(([key, filename]) => loadSound(key, filename));
    await Promise.allSettled(promises);
};

const setMasterVolume = (val: number) => {
    volMaster = Math.max(0, Math.min(1, val));
    if (masterGain) masterGain.gain.setTargetAtTime(volMaster, audioCtx?.currentTime || 0, 0.1);
}

const setMusicVolume = (val: number) => {
    volMusic = Math.max(0, Math.min(1, val));
    if (musicGain) musicGain.gain.setTargetAtTime(volMusic, audioCtx?.currentTime || 0, 0.1);
}

const setSfxVolume = (val: number) => {
    volSfx = Math.max(0, Math.min(1, val));
    if (sfxGain) sfxGain.gain.setTargetAtTime(volSfx, audioCtx?.currentTime || 0, 0.1);
}

// Toca um buffer se existir
const playBuffer = (key: string, vol: number = 1.0, loop: boolean = false): boolean => {
    if (isMuted || !audioCtx || !sfxGain || !buffers[key]) return false;

    // Se for loop (música)
    if (loop) {
        // Se a música já está tocando, não reinicia
        if (currentTrackId === key && bgmSource) {
            return true;
        }

        // Se for uma música diferente, para a anterior
        if (bgmSource) {
             try { bgmSource.stop(); } catch(e) {}
             bgmSource = null;
        }
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffers[key];
    source.loop = loop;

    const gain = audioCtx.createGain();
    gain.gain.value = vol;

    source.connect(gain);
    // Se for loop (música), conecta no musicGain, senão no sfxGain
    gain.connect(loop ? musicGain! : sfxGain!);
    
    source.start();
    
    if (loop) {
        bgmSource = source;
        currentTrackId = key;
    }

    return true;
};

// --- SINTETIZADORES (FALLBACK) ---

const playTone = (freq: number, type: OscillatorType, duration: number, slideTo: number | null = null, vol: number = 0.5) => {
  if (isMuted) return;
  if (!audioCtx || !sfxGain) initAudio();
  if (!audioCtx || !sfxGain) return;

  try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
      }

      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
  } catch(e) {
      // Ignore errors on suspended context
  }
};

const playNoise = (duration: number, vol: number = 0.5) => {
    if (isMuted) return;
    if (!audioCtx || !sfxGain || !cachedNoiseBuffer) initAudio();
    if (!audioCtx || !sfxGain || !cachedNoiseBuffer) return;

    try {
        const noise = audioCtx.createBufferSource();
        noise.buffer = cachedNoiseBuffer;

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(vol, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        noise.connect(noiseGain);
        noiseGain.connect(sfxGain);
        
        noise.start(0, 0, duration);
    } catch(e) {
        // Ignore errors
    }
};

// --- CONTROLES PÚBLICOS ---

export const music = {
  playGame: () => {
    initAudio();
    
    // Para qualquer sintetizador rodando
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }

    // Tenta tocar arquivo de música do jogo
    if (playBuffer('bgm_game', 0.8, true)) return;

    // Fallback: Música Sintetizada (Apenas para o jogo)
    
    let beat = 0;
    const playStep = () => {
      if (!audioCtx || !musicGain || isMuted) return;
      
      const t = audioCtx.currentTime;
      
      // Kick
      if (beat % 4 === 0) {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
        g.gain.setValueAtTime(0.6, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(g); g.connect(musicGain!);
        osc.start(); osc.stop(t + 0.1);
      }
      
      // Bass
      const bassFreqs = [55, 55, 41, 41, 48, 48, 36, 36];
      const freq = bassFreqs[Math.floor(beat/4) % bassFreqs.length];
      if (beat % 2 === 0) {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(g); g.connect(musicGain!);
        osc.start(); osc.stop(t + 0.12);
      }

      // Snare
      if (beat % 8 === 4 && cachedNoiseBuffer) {
        const n = audioCtx.createBufferSource();
        n.buffer = cachedNoiseBuffer;
        const ng = audioCtx.createGain();
        ng.gain.setValueAtTime(0.2, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        n.connect(ng); ng.connect(musicGain!);
        n.start(t, 0, 0.2);
      }
      
      // Melody
      if (beat % 4 === 2) {
        const melody = [440, 523, 659, 783];
        const mFreq = melody[Math.floor(beat/8) % melody.length];
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(mFreq, t);
        osc.frequency.exponentialRampToValueAtTime(mFreq * 0.5, t + 0.2);
        g.gain.setValueAtTime(0.05, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(g); g.connect(musicGain!);
        osc.start(); osc.stop(t + 0.2);
      }

      beat = (beat + 1) % 32;
    };

    bgmInterval = window.setInterval(playStep, 125);
  },
  playMenu: () => {
      initAudio();
      // Para sintetizador se estiver rodando
      if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
      
      // Tenta tocar música do menu
      playBuffer('bgm_menu', 0.6, true);
  },
  stop: () => {
    if (bgmSource) {
        try { bgmSource.stop(); } catch(e) {}
        bgmSource = null;
    }
    currentTrackId = null;
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  },
  setVolume: setMusicVolume
};

export const sfx = {
  shoot: () => {
      if (!playBuffer('shoot', 0.6)) playTone(800, 'square', 0.1, 400, 0.2);
  },
  explosion: () => {
      if (!playBuffer('explosion', 0.7)) playNoise(0.4, 0.5);
  },
  hit: () => {
      if (!playBuffer('hit', 0.8)) playTone(150, 'sawtooth', 0.1, 50, 0.4);
  },
  collect: () => {
    if (!playBuffer('collect', 0.6)) {
        playTone(1200, 'sine', 0.1, 1800, 0.3); 
        setTimeout(() => playTone(1800, 'sine', 0.2, null, 0.3), 50);
    }
  },
  powerup: () => {
    if (!playBuffer('powerup', 0.7)) playTone(400, 'square', 0.1, 800, 0.3);
  },
  gameOver: () => {
      if (!playBuffer('game_over', 1.0)) playTone(300, 'sawtooth', 1.0, 50, 0.5);
  },
  ultimateReady: () => {
    playTone(400, 'sine', 0.1, 800, 0.5);
  },
  ultimateUse: () => {
    if (!playBuffer('ultimate_use', 1.0)) {
        playNoise(1.5, 0.7);
        playTone(100, 'sawtooth', 1.0, 10, 0.8);
    }
  },
  uiClick: () => {
      if (!playBuffer('ui_click', 0.5)) playTone(2000, 'sine', 0.05, 3000, 0.08);
  },
  init: initAudio,
  loadAllSounds: loadAllSounds,
  setVolume: setSfxVolume,
  setMasterVolume: setMasterVolume,
  isPackLoaded: () => packLoaded
};
