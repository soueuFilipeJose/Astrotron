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
    invulnerabilityTime: 1.15
  },

  bullet: {
    radius: 3.5,
    lifetime: 0.9
  },

  asteroid: {
    large: 51,
    medium: 33,
    small: 20,
    minSplitRadius: 25
  },

  debris: {
    phaseOneAmount: 22,
    phaseOneDriftSpeed: 18
  },

  centipede: {
    radius: 18,
    speed: 115,
    turnSpeed: 2.4,
    attachDuration: 2,
    attachDamage: 14,
    health: 2,
    phaseTwoAmount: 7
  },

  economy: {
    repairCost: 120,
    stationInterval: 2,
    upgradeBaseCost: 160,
    upgradeCostGrowth: 90
  },

  progression: {
    firstXpGoal: 170,
    xpGrowth: 1.35,
    xpMultiplier: 0.7
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

const IMAGE_ASSETS = Object.freeze({
  player: "assets/img/nave-astrotron-sprite.png",
  backgroundPhaseOne: "assets/img/fase1-background.png",

  asteroids: [
    "assets/img/asteroides/asteroide1.png",
    "assets/img/asteroides/asteroide2.png",
    "assets/img/asteroides/asteroide3.png",
    "assets/img/asteroides/asteroide4pequeno.png",
    "assets/img/asteroides/asteroide4pequenodireita.png",
    "assets/img/asteroides/asteroide5.png",
    "assets/img/asteroides/asteroide5esquerda.png"
  ],

  debris: [
    "assets/img/detritos/detrito1nave.png",
    "assets/img/detritos/detrito2bola.png",
    "assets/img/detritos/detrito3barra.png",
    "assets/img/detritos/detrito4constructo.png",
    "assets/img/detritos/detrito5canhao.png",
    "assets/img/detritos/detrito5canhaoesquerda.png",
    "assets/img/detritos/detrito5coracaodireita.png",
    "assets/img/detritos/detrito6coracao.png"
  ],

  centipedesRight: [
    "assets/img/centopeias/centopeia1dir.png",
    "assets/img/centopeias/centopeia2dir.png"
  ],

  centipedesLeft: [
    "assets/img/centopeias/centopeia1esq.png",
    "assets/img/centopeias/centopeia2esq.png"
  ]
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
