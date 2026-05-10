const GAME_CONFIG = Object.freeze({
 player: {
  radius: 16,
  maxHull: 100,
  thrust: 340,
  maxSpeed: 440,
  rotationSpeed: 4.8,
  friction: 0.992,
  fireRate: 0.22,
  bulletSpeed: 680,
  bulletDamage: 1,
  invulnerabilityTime: 1.4
  },

  bullet: {
    radius: 3.5,
    lifetime: 0.9
  },

  asteroid: {
    large: 46,
    medium: 28,
    small: 17,
    minSplitRadius: 22
  },

  economy: {
    repairCost: 120,
    stationInterval: 2
  },

  progression: {
    firstXpGoal: 120,
    xpGrowth: 1.28
  },

  colors: {
    player: "#66d9ff",
    playerSecondary: "#8c6dff",
    bullet: "#ffdf7e",
    asteroid: "#c9d7e8",
    danger: "#ff4b5f",
    success: "#7dffb2",
    particle: "#ffffff"
  }
});

const UPGRADE_OPTIONS = Object.freeze([
  {
    type: "shield",
    icon: "✚",
    name: "Placas de Casco Vivo",
    description: "Aumenta a vida máxima e regenera parte do casco da ASTROTRON."
  },
  {
    type: "cannon",
    icon: "⚡",
    name: "Canhão de Arco",
    description: "Reduz o tempo entre disparos e aumenta o dano dos tiros."
  },
  {
    type: "engine",
    icon: "➤",
    name: "Motor de Vácuo",
    description: "Aumenta aceleração, velocidade máxima e resposta da nave."
  }
]);
