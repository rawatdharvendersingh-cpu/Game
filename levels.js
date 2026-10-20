// 10 Staged Progression Levels with Distinct Visuals & Wave Spawns
const LEVELS = [
  {
    id: 1,
    title: 'STAGE 1',
    subtitle: 'DOWNTOWN NEON ALLEY',
    theme: 'city_neon',
    arenaWidth: 2200,
    floorY: 340,
    floorHeight: 180,
    skyGradient: ['#090d16', '#1e1b4b', '#311042'],
    groundColor: '#171717',
    groundLineColor: '#262626',
    ambientColor: 'rgba(236, 72, 153, 0.08)',
    musicTempo: 155,
    waves: [
      { triggerX: 0, enemies: ['punk_grunt', 'punk_grunt'] },
      { triggerX: 350, enemies: ['punk_grunt', 'pipe_wielder', 'punk_grunt'] },
      { triggerX: 800, enemies: ['pipe_wielder', 'punk_grunt', 'mohawk_raider'] }
    ]
  },
  {
    id: 2,
    title: 'STAGE 2',
    subtitle: 'ABANDONED WAREHOUSE',
    theme: 'warehouse',
    arenaWidth: 2300,
    floorY: 340,
    floorHeight: 180,
    skyGradient: ['#090a0f', '#1c1917', '#292524'],
    groundColor: '#1c1917',
    groundLineColor: '#44403c',
    ambientColor: 'rgba(234, 179, 8, 0.06)',
    musicTempo: 150,
    waves: [
      { triggerX: 0, enemies: ['pipe_wielder', 'pipe_wielder'] },
      { triggerX: 400, enemies: ['punk_grunt', 'mohawk_raider', 'pipe_wielder'] },
      { triggerX: 900, enemies: ['heavy_crusher', 'punk_grunt'] }
    ]
  },
  {
    id: 3,
    title: 'STAGE 3',
    subtitle: 'ROOFTOP TERRACE',
    theme: 'rooftop_terrace',
    arenaWidth: 2400,
    floorY: 340,
    floorHeight: 180,
    skyGradient: ['#1e1b4b', '#9a3412', '#ea580c'], // Sunset skyscraper glow!
    groundColor: '#334155',
    groundLineColor: '#475569',
    ambientColor: 'rgba(249, 115, 22, 0.12)',
    musicTempo: 145,
    waves: [
      { triggerX: 0, enemies: ['mohawk_raider', 'mohawk_raider'] },
      { triggerX: 450, enemies: ['punk_grunt', 'pipe_wielder', 'mohawk_raider'] },
      { triggerX: 950, enemies: ['heavy_crusher', 'mohawk_raider', 'punk_grunt'] }
    ]
  },
  {
    id: 4,
    title: 'STAGE 4',
    subtitle: 'SUBWAY STATION PLATFORM',
    theme: 'subway',
    arenaWidth: 2400,
    floorY: 340,
    floorHeight: 180,
    skyGradient: ['#020617', '#0f172a', '#1e293b'],
    groundColor: '#262626',
    groundLineColor: '#eab308', // Safety yellow subway line
    ambientColor: 'rgba(56, 189, 248, 0.08)',
    musicTempo: 145,
    unlockReward: 'viper',
    waves: [
      { triggerX: 0, enemies: ['pipe_wielder', 'punk_grunt', 'pipe_wielder'] },
      { triggerX: 450, enemies: ['mohawk_raider', 'mohawk_raider', 'heavy_crusher'] },
      { triggerX: 950, enemies: ['heavy_crusher', 'heavy_crusher'] }
    ]
  },
  {
    id: 5,
    title: 'STAGE 5',
    subtitle: 'TOXIC CARGO DOCKS',
    theme: 'docks',
    arenaWidth: 2500,
    floorY: 340,
    floorHeight: 180,
    skyGradient: ['#022c22', '#064e3b', '#065f46'],
    groundColor: '#1e293b',
    groundLineColor: '#334155',
    ambientColor: 'rgba(16, 185, 129, 0.10)',
    musicTempo: 140,
    waves: [
      { triggerX: 0, enemies: ['pipe_wielder', 'mohawk_raider'] },
      { triggerX: 500, enemies: ['heavy_crusher', 'pipe_wielder', 'punk_grunt'] },
      { triggerX: 1000, enemies: ['cyber_soldier', 'heavy_crusher'] }
    ]
  },
  {
    id: 6,
    title: 'STAGE 6',
    subtitle: 'JUNGLE OUTSKIRTS PERIMETER',
    theme: 'jungle',
    arenaWidth: 2500,
    floorY: 340,
    floorHeight: 180,
    skyGradient: ['#052e16', '#14532d', '#15803d'],
    groundColor: '#3f2e16',
    groundLineColor: '#5a411e',
    ambientColor: 'rgba(34, 197, 94, 0.1)',
    musicTempo: 145,
    waves: [
      { triggerX: 0, enemies: ['mohawk_raider', 'mohawk_raider', 'punk_grunt'] },
      { triggerX: 500, enemies: ['mohawk_raider', 'cyber_soldier'] },
      { triggerX: 1000, enemies: ['heavy_crusher', 'cyber_soldier', 'mohawk_raider'] }
    ]
  },
  {
    id: 7,
    title: 'STAGE 7',
    subtitle: 'ANCIENT RUINS OUTPOST',
    theme: 'ruins',
    arenaWidth: 2500,
    floorY: 340,
    floorHeight: 180,
    skyGradient: ['#1c1917', '#44403c', '#78716c'],
    groundColor: '#44403c',
    groundLineColor: '#292524',
    ambientColor: 'rgba(245, 158, 11, 0.08)',
    musicTempo: 140,
    unlockReward: 'goliath',
    waves: [
      { triggerX: 0, enemies: ['cyber_soldier', 'cyber_soldier'] },
      { triggerX: 500, enemies: ['heavy_crusher', 'cyber_soldier', 'heavy_crusher'] },
      { triggerX: 1050, enemies: ['cyber_soldier', 'cyber_soldier', 'mohawk_raider'] }
    ]
  },
  {
    id: 8,
    title: 'STAGE 8',
    subtitle: 'SECRET CYBER FACILITY',
    theme: 'tech_lab',
    arenaWidth: 2600,
    floorY: 340,
    floorHeight: 180,
    skyGradient: ['#030712', '#0f172a', '#1e1b4b'],
    groundColor: '#0f172a',
    groundLineColor: '#06b6d4',
    ambientColor: 'rgba(6, 182, 212, 0.14)',
    musicTempo: 135,
    waves: [
      { triggerX: 0, enemies: ['cyber_soldier', 'cyber_soldier', 'pipe_wielder'] },
      { triggerX: 500, enemies: ['cyber_soldier', 'heavy_crusher', 'cyber_soldier'] },
      { triggerX: 1100, enemies: ['heavy_crusher', 'heavy_crusher', 'cyber_soldier'] }
    ]
  },
  {
    id: 9,
    title: 'STAGE 9',
    subtitle: 'SKYBRIDGE & PENTHOUSE',
    theme: 'skybridge',
    arenaWidth: 2700,
    floorY: 340,
    floorHeight: 180,
    skyGradient: ['#0f051d', '#3b0764', '#581c87'],
    groundColor: '#1e1b4b',
    groundLineColor: '#a855f7',
    ambientColor: 'rgba(168, 85, 247, 0.15)',
    musicTempo: 135,
    waves: [
      { triggerX: 0, enemies: ['cyber_soldier', 'mohawk_raider', 'cyber_soldier'] },
      { triggerX: 550, enemies: ['heavy_crusher', 'cyber_soldier', 'heavy_crusher'] },
      { triggerX: 1150, enemies: ['cyber_soldier', 'cyber_soldier', 'heavy_crusher', 'mohawk_raider'] }
    ]
  },
  {
    id: 10,
    title: 'STAGE 10 (FINAL)',
    subtitle: 'CITADEL HELIPAD APEX',
    theme: 'helipad_boss',
    arenaWidth: 2400,
    floorY: 340,
    floorHeight: 180,
    skyGradient: ['#020617', '#0f172a', '#1e293b'],
    groundColor: '#0f172a',
    groundLineColor: '#e11d48',
    ambientColor: 'rgba(225, 29, 72, 0.15)',
    musicTempo: 130,
    waves: [
      { triggerX: 0, enemies: ['cyber_soldier', 'heavy_crusher'] },
      { triggerX: 450, enemies: ['warlord_malakai', 'cyber_soldier', 'mohawk_raider'] }
    ]
  }
];
