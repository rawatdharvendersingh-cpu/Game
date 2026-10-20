// Enemy Archetypes with distinct visual styling, colors, and behaviors
const ENEMY_TYPES = {
  punk_grunt: {
    name: 'Street Punk',
    type: 'grunt',
    maxHp: 45,
    speed: 2.8,
    attackPower: 8,
    attackCooldown: 60,
    reachX: 35,
    reachY: 15,
    scoreValue: 150,
    colors: {
      head: '#fbcfe8',
      hair: '#ec4899',       // Bright pink mohawk!
      jacket: '#7e22ce',     // Purple punk biker jacket
      shirt: '#ffffff',      // White skull t-shirt
      pants: '#2563eb',      // Torn bright blue denim
      shoes: '#1e1b4b',      // Black creepers
      accessory: '#fbbf24'   // Gold chain
    },
    scale: 0.95
  },

  pipe_wielder: {
    name: 'Wrench Thug',
    type: 'weapon',
    maxHp: 65,
    speed: 2.3,
    attackPower: 12,
    attackCooldown: 75,
    reachX: 42,
    reachY: 16,
    scoreValue: 250,
    colors: {
      head: '#fed7aa',
      hair: '#78350f',       // Brown hair under cap
      jacket: '#eab308',     // Bright yellow work tank
      shirt: '#ca8a04',      // Dirty yellow vest
      pants: '#15803d',      // Green mechanic cargo pants
      shoes: '#451a03',      // Heavy brown boots
      accessory: '#94a3b8'   // Steel pipe / wrench in hand
    },
    scale: 1.05
  },

  mohawk_raider: {
    name: 'Spike Raider',
    type: 'agile',
    maxHp: 55,
    speed: 3.6,
    attackPower: 10,
    attackCooldown: 50,
    reachX: 38,
    reachY: 15,
    scoreValue: 300,
    colors: {
      head: '#fbcfe8',
      hair: '#f97316',       // Fiery orange spiked hair
      jacket: '#18181b',     // Black studded leather vest
      shirt: '#dc2626',      // Red bandana mask
      pants: '#475569',      // Dark grey combat trousers
      shoes: '#b91c1c',      // Red studded boots
      accessory: '#f87171'
    },
    scale: 1.0
  },

  heavy_crusher: {
    name: 'Crusher Brute',
    type: 'heavy',
    maxHp: 130,
    speed: 1.6,
    attackPower: 22,
    attackCooldown: 90,
    reachX: 46,
    reachY: 22,
    scoreValue: 600,
    colors: {
      head: '#fed7aa',
      hair: '#fed7aa',       // Bald / shaved head with tattoo
      jacket: '#1e3a8a',     // Dark blue denim overalls
      shirt: '#0f172a',      // Black muscle shirt
      pants: '#1e3a8a',      // Overalls pants
      shoes: '#1c1917',      // Heavy combat boots
      accessory: '#cbd5e1'   // Heavy iron chain on torso
    },
    scale: 1.35
  },

  cyber_soldier: {
    name: 'Cyber Enforcer',
    type: 'elite',
    maxHp: 90,
    speed: 3.2,
    attackPower: 16,
    attackCooldown: 60,
    reachX: 42,
    reachY: 18,
    scoreValue: 500,
    colors: {
      head: '#38bdf8',       // Glowing cyber visor
      hair: '#0f172a',       // Tactical helmet
      jacket: '#334155',     // Armored vest
      shirt: '#0f172a',      // Black tech weave
      pants: '#0369a1',      // Deep navy armored pants
      shoes: '#0284c7',      // Mag-boots
      accessory: '#38bdf8'   // Electric stun baton
    },
    scale: 1.1
  },

  warlord_malakai: {
    name: 'WARLORD MALAKAI',
    type: 'boss',
    maxHp: 280,
    speed: 2.6,
    attackPower: 26,
    attackCooldown: 50,
    reachX: 55,
    reachY: 25,
    scoreValue: 2500,
    colors: {
      head: '#fed7aa',
      hair: '#f8fafc',       // Silver slicked hair & goatee
      jacket: '#991b1b',     // Crimson military general trenchcoat
      shirt: '#450a0a',      // Dark blood-red vest
      pants: '#18181b',      // Officer black pants
      shoes: '#09090b',      // Polished officer boots
      accessory: '#facc15'   // Gold general epaulets & saber
    },
    scale: 1.4
  }
};
