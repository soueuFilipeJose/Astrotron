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
        text: "Alerta: fragmentos estruturais em rota de colisão. Recomendação: recuar."
      },
      {
        speaker: "Nyx Varela",
        text: "Recuar não paga minhas dívidas. Abre os canhões."
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
        text: "Só o começo. A Máquina está me puxando para dentro."
      },
      {
        speaker: "Mecânico do Posto",
        text: "Então conserte o casco, compre módulos e não morra antes de pagar."
      }
    ]
  },

  sectorThree: {
    chapter: "Capítulo 02",
    place: "Órbita da Lua Partida",
    lines: [
      {
        speaker: "IA da Nave",
        text: "Detectei sinais biológicos dentro dos destroços. Isso é estatisticamente impossível."
      },
      {
        speaker: "Nyx Varela",
        text: "Impossível é só uma palavra que cientista usa antes de pedir mais verba."
      },
      {
        speaker: "Voz Desconhecida",
        text: "NYX... RETORNE AO NÚCLEO."
      },
      {
        speaker: "Nyx Varela",
        text: "Você também ouviu isso?"
      }
    ]
  }
});

const STATIONS = Object.freeze([
  {
    name: "Posto Velha Íris",
    description:
      "Uma estação torta presa a uma lua rachada. O cheiro de óleo queimado atravessa até o filtro do capacete."
  },
  {
    name: "Ancoragem Santo Vácuo",
    description:
      "Um porto clandestino iluminado por letreiros quebrados, onde pilotos trocam peças, dívidas e segredos."
  },
  {
    name: "Refúgio Nove-Dentes",
    description:
      "Um depósito militar abandonado. Ainda há marcas de batalha nas paredes e vozes antigas no rádio."
  }
]);
