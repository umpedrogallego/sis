/**
 * CONFIGURAÇÃO DA APRESENTAÇÃO (Final)
 */
const APRESENTACAO = [
  {
    id: "obra-01",
    titulo: "Ficção de personalidade",
    ano: "2014",
    tipo: "video-sequenciado",
    provedor: "youtube",
    videoId: "zujWETunt7U",
    aspectRatio: "16:9",
    qualidade: "hd1080",
    desabilitarLegenda: true,
    segmentos: [
      { start: 3, end: 20 },
      { start: 226, end: 391 },
      { start: 1483, end: 1620 }
    ],
    fadeColor: "#000000"
  },
  {
    id: "obra-02",
    titulo: "acordo de Emergência",
    ano: "2020",
    tipo: "video-continuo",
    provedor: "youtube",
    videoId: "aBOofS3Oy94",
    aspectRatio: "16:9",
    qualidade: "hd1080",
    desabilitarLegenda: true,
    inicio: 0,
    fim: null,
    fadeColor: "#002d85" 
  },
  {
    id: "obra-03",
    titulo: "Torcida",
    ano: "2025",
    tipo: "galeria-horizontal",
    gap: 88,
    imagens: [
      "https://umpedrogallego.github.io/site/thumb/25-torcida-a.avif",
      "https://umpedrogallego.github.io/site/thumb/25-torcida-d.avif",
      "https://umpedrogallego.github.io/site/thumb/25-torcida-c.avif",
      "https://umpedrogallego.github.io/site/thumb/25-torcida-e.avif",
      "https://umpedrogallego.github.io/site/thumb/25-torcida-b.avif"
    ],
    fadeColor: "#000000"
  },
  {
    id: "obra-04",
    titulo: "Nada machuca nem cansa",
    ano: "2022",
    tipo: "video-continuo",
    provedor: "youtube",
    videoId: "8v-c49j2dks",
    aspectRatio: "4:3",
    qualidade: "hd720",
    desabilitarLegenda: true,
    inicio: 0,
    fim: null,
    fadeColor: "#ff0000"
  },
  {
    id: "obra-05",
    titulo: "Domingo Maior",
    ano: "2013",
    tipo: "publicacao-galeria",
    gap: 88,
    imagens: [
      "https://umpedrogallego.github.io/site/thumb/13-dm-a.avif",
      "https://umpedrogallego.github.io/site/thumb/13-dm-b.avif",
      "https://umpedrogallego.github.io/site/thumb/13-dm-c.avif"
    ]
    // A última obra dita o fim do ciclo (Shift+Seta para direita volta à Tela Inicial)
  },
  {
    titulo: "Screensaver",
    ano: "2017 —",
    provedor: "vimeo",
    vimeoId: "1217454502",
    fadeColor: "#5d665a"
  }
];
