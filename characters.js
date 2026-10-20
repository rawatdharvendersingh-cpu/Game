// Player Characters & Progression System
const CHARACTERS = {
  leo: {
    id: 'leo',
    name: 'LEO',
    title: 'The Street Striker',
    unlockedAtStage: 1, // Starter
    speed: 4.6,
    maxHp: 100,
    attackPower: 18,
    specialCost: 20,
    colorScheme: {
      head: '#e0ac69',
      hair: '#3e2723',
      vest: '#dc2626',      // Red vest
      shirt: '#18181b',     // Dark undershirt
      pants: '#4d5b36',     // Olive khaki combat pants
      shoes: '#991b1b',     // Red high-tops
      bandages: '#f4f4f5'   // Hand wraps
    },
    comboHits: [
      { name: 'Jab', damage: 14, range: 45, duration: 10, reachX: 30, reachY: 15, stun: 14 },
      { name: 'Cross', damage: 18, range: 50, duration: 12, reachX: 36, reachY: 18, stun: 18 },
      { name: 'Uppercut', damage: 28, range: 55, duration: 16, reachX: 42, reachY: 22, stun: 30, knockdown: true }
    ],
    kickMove: { name: 'Jump Kick', damage: 24, range: 60, duration: 14, reachX: 48, reachY: 20, knockdown: true },
    superMove: { name: 'Tornado Strike', damage: 55, range: 90, duration: 25, knockdown: true, screenShake: 12 }
  },

  viper: {
    id: 'viper',
    name: 'VIPER',
    title: 'Shadow Infiltrator',
    unlockedAtStage: 4, // Unlocks after Stage 3
    speed: 6.0,
    maxHp: 85,
    attackPower: 15,
    specialCost: 15,
    colorScheme: {
      head: '#f2c99a',
      hair: '#0f172a',
      vest: '#06b6d4',      // Neon cyan stealth gear
      shirt: '#0f172a',     // Dark navy tactical suit
      pants: '#0e7490',     // Cyan-accented tactical pants
      shoes: '#0891b2',     // Agility boots
      bandages: '#22d3ee'   // Cyan glowing wraps
    },
    comboHits: [
      { name: 'Swift Palm', damage: 12, range: 42, duration: 8, reachX: 32, reachY: 14, stun: 12 },
      { name: 'Elbow Spike', damage: 14, range: 45, duration: 9, reachX: 35, reachY: 16, stun: 15 },
      { name: 'Double Strike', damage: 18, range: 50, duration: 10, reachX: 40, reachY: 18, stun: 18 },
      { name: 'Sonic Blast', damage: 26, range: 65, duration: 14, reachX: 50, reachY: 24, stun: 30, knockdown: true }
    ],
    kickMove: { name: 'Flash Flip', damage: 26, range: 62, duration: 12, reachX: 52, reachY: 24, knockdown: true },
    superMove: { name: 'Shadow Blitz', damage: 60, range: 110, duration: 24, knockdown: true, screenShake: 14 }
  },

  goliath: {
    id: 'goliath',
    name: 'GOLIATH',
    title: 'Iron Bruiser',
    unlockedAtStage: 7, // Unlocks after Stage 6
    speed: 3.8,
    maxHp: 140,
    attackPower: 32,
    specialCost: 25,
    colorScheme: {
      head: '#d4a373',
      hair: '#d97706',      // Blonde/orange mohawk & beard
      vest: '#475569',      // Heavy slate plate vest
      shirt: '#000000',     // Black muscle tee
      pants: '#1e293b',     // Heavy dark denim
      shoes: '#78350f',     // Heavy steel-toe work boots
      bandages: '#ea580c'   // Spiked orange knuckle guards
    },
    comboHits: [
      { name: 'Heavy Hammer', damage: 26, range: 55, duration: 14, reachX: 42, reachY: 20, stun: 20 },
      { name: 'Megaton Hook', damage: 42, range: 65, duration: 18, reachX: 55, reachY: 26, stun: 35, knockdown: true }
    ],
    kickMove: { name: 'Earth Stomp', damage: 34, range: 70, duration: 18, reachX: 50, reachY: 30, knockdown: true },
    superMove: { name: 'Seismic Tremor', damage: 75, range: 120, duration: 30, knockdown: true, screenShake: 20 }
  }
};
