const GAME_CONFIG = Object.freeze({
  player: {
    radius: 17,
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

  progression: {
    firstXpGoal: 120,
    xpGrowth: 1.28
  },

  colors: {
    player: "#57e8ff",
    playerSecondary: "#9d6bff",
    bullet: "#ffeb8a",
    asteroid: "#d9e3ff",
    danger: "#ff5577",
    success: "#6effb5",
    particle: "#ffffff"
  }
});

const UPGRADE_OPTIONS = Object.freeze([
  {
    type: "shield",
    icon: "🛡️",
    name: "Casco Reforçado",
    description: "Aumenta a vida máxima da nave e recupera parte do casco."
  },
  {
    type: "cannon",
    icon: "⚡",
    name: "Canhão de Plasma",
    description: "Diminui o intervalo entre tiros e aumenta o dano dos disparos."
  },
  {
    type: "engine",
    icon: "🚀",
    name: "Motor Íon",
    description: "Aumenta aceleração, velocidade máxima e controle da nave."
  }
]);
