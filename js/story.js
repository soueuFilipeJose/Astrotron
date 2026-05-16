const STORY = Object.freeze({
  intro: {
    chapter: "Capítulo 01",
    place: "Setor Orfeu",
    lines: [
      {
        speaker: "IA da Polícia do Setor Orfeu",
        text: "Nyx Varela. Ex-mercenária. Histórico de operações ilegais nas rotas exteriores."
      },
      {
        speaker: "IA da Polícia do Setor Orfeu",
        text: "Sua sentença foi suspensa temporariamente. Em troca, você pilotará a ASTROTRON em uma missão de patrulha profunda."
      },
      {
        speaker: "Nyx Varela",
        text: "Então essa é a minha chance de redenção?"
      },
      {
        speaker: "IA da Polícia do Setor Orfeu",
        text: "Correção: esta é sua chance de utilidade."
      },
      {
        speaker: "IA da Polícia do Setor Orfeu",
        text: "A ASTROTRON é um protótipo policial equipado com um núcleo capaz de absorver energia dissipada do ambiente."
      },
      {
        speaker: "IA da Polícia do Setor Orfeu",
        text: "Destroços destruídos, radiação residual, matéria instável e fragmentos tecnológicos ativos podem alimentar a nave."
      },
      {
        speaker: "IA da Polícia do Setor Orfeu",
        text: "Sua primeira missão é investigar o Setor Orfeu após a suposta colisão entre um meteoro e uma antiga base policial."
      },
      {
        speaker: "Nyx Varela",
        text: "Suposta colisão. Sempre adoro quando vocês usam essa expressão."
      },
      {
        speaker: "IA da Polícia do Setor Orfeu",
        text: "Entre na zona de destroços. Limpe a rota. Recupere dados. Sobreviva."
      },
      {
        speaker: "Nyx Varela",
        text: "Certo. Se querem uma piloto suicida, escolheram a pessoa certa."
      }
    ]
  },

  phaseTwo: {
    chapter: "Capítulo 02",
    place: "Ruínas Vivas",
    lines: [
      {
        speaker: "IA da ASTROTRON",
        text: "Cinturão principal parcialmente limpo. Assinaturas biológicas detectadas entre os destroços."
      },
      {
        speaker: "Nyx Varela",
        text: "Biológicas? No meio desse ferro todo?"
      },
      {
        speaker: "IA da ASTROTRON",
        text: "Confirmado. Organismos biomecânicos de pequeno porte. Padrão de movimento hostil."
      },
      {
        speaker: "Nyx Varela",
        text: "Ótimo. Asteroides assassinos eu entendo. Insetos espaciais, nem tanto."
      },
      {
        speaker: "IA da ASTROTRON",
        text: "Aviso adicional: sinais de patrulha não identificada se aproximando do setor."
      },
      {
        speaker: "Nyx Varela",
        text: "Então a festa nem começou."
      }
    ]
  },

  phaseThree: {
    chapter: "Capítulo 03",
    place: "O Anel da Máquina",
    lines: [
      {
        speaker: "IA da ASTROTRON",
        text: "Setor imediato estabilizado. Detectando estrutura orbital à frente."
      },
      {
        speaker: "Nyx Varela",
        text: "Isso não parece uma base policial comum."
      },
      {
        speaker: "IA da ASTROTRON",
        text: "Correção: parte da estrutura corresponde aos arquivos da Polícia do Setor Orfeu."
      },
      {
        speaker: "Nyx Varela",
        text: "Parte?"
      },
      {
        speaker: "IA da ASTROTRON",
        text: "O restante é anterior à ocupação humana do setor."
      },
      {
        speaker: "Voz Desconhecida",
        text: "ASTROTRON... RETORNE AO ANEL."
      },
      {
        speaker: "Nyx Varela",
        text: "Eu não gosto quando máquinas sabem meu nome. Gosto menos ainda quando sabem o nome da minha nave."
      },
      {
        speaker: "IA da ASTROTRON",
        text: "Aviso: múltiplos sistemas defensivos em ativação."
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
