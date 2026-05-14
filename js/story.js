const STORY = Object.freeze({
  intro: {
    chapter: "Capítulo 01",
    place: "Cinturão Orfeu",
    lines: [
      {
        speaker: "Nyx Varela",
        text: "Gravação iniciada. Se alguém encontrar isso, meu nome é Nyx Varela. Piloto da ASTROTRON."
      },
      {
        speaker: "Nyx Varela",
        text: "A Máquina apareceu onde não deveria existir nada. Uma cidade morta atravessando o espaço como um cadáver de metal."
      },
      {
        speaker: "IA da Nave",
        text: "Alerta: fragmentos estruturais, rochas energizadas e destroços mecânicos em rota de colisão. Recomendação: recuar."
      },
      {
        speaker: "Nyx Varela",
        text: "Recuar não paga minhas dívidas. Abre os canhões."
      }
    ]
  },

  phaseTwo: {
    chapter: "Capítulo 02",
    place: "Véu Biomecânico",
    lines: [
      {
        speaker: "IA da Nave",
        text: "Densidade de asteroides reduzida. O setor está estranhamente limpo."
      },
      {
        speaker: "Nyx Varela",
        text: "Espaço vazio nunca é uma boa notícia."
      },
      {
        speaker: "IA da Nave",
        text: "Movimento orgânico detectado. Pequenas formas segmentadas se aproximam em múltiplos vetores."
      },
      {
        speaker: "Voz Desconhecida",
        text: "A CARNE DA MÁQUINA PROCURA CALOR."
      },
      {
        speaker: "Nyx Varela",
        text: "Certo. Agora temos vermes de metal no espaço. Eu odeio este trabalho."
      }
    ]
  },

  station: {
    chapter: "Interlúdio",
    place: "Posto Estelar",
    lines: [
      {
        speaker: "Mecânico do Posto",
        text: "Essa nave não devia estar inteira. O que você atravessou lá fora?"
      },
      {
        speaker: "Nyx Varela",
        text: "Primeiro, um cemitério orbital. Depois, alguma coisa viva demais para estar no vácuo."
      },
      {
        speaker: "Mecânico do Posto",
        text: "Então conserte o casco, compre módulos e não morra antes de pagar."
      }
    ]
  }
});

const STATIONS = Object.freeze([
  {
    name: "Posto Velha Íris",
    description: "Uma estação torta presa a uma lua rachada. O cheiro de óleo queimado atravessa até o filtro do capacete."
  },
  {
    name: "Ancoragem Santo Vácuo",
    description: "Um porto clandestino iluminado por letreiros quebrados, onde pilotos trocam peças, dívidas e segredos."
  },
  {
    name: "Refúgio Nove-Dentes",
    description: "Um depósito militar abandonado. Ainda há marcas de batalha nas paredes e vozes antigas no rádio."
  }
]);
