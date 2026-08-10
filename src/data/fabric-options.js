// 本檔由 scripts/build-fabric-data.py 依 相關文件資料/資料內容.xlsx 與 Pattern 生成API 資料/Pattern_API.xlsx 自動產生，請勿手動編輯。


// Specs2VS 支援的布種。LF（貼合）本次未交付素材，僅保留代碼。
export const fabricCategories = [
  {
    "value": "WO",
    "text": "梭織"
  },
  {
    "value": "CW",
    "text": "圓編"
  },
  {
    "value": "WK",
    "text": "經編"
  },
  {
    "value": "LF",
    "text": "貼合"
  }
];

// 交付素材涵蓋的布種（供 UI 下拉使用）
export const fabricTypes = fabricCategories.filter((item) => item.value !== 'LF');

// 組織選項。標記 provisional 者為資料內容.xlsx 有列出但客戶尚未給代碼。
export const fabricationsByType = {
  "CW": [
    {
      "value": "CWD020",
      "text": "雙面PK布"
    },
    {
      "value": "CWD050",
      "text": "雙面羅紋"
    },
    {
      "value": "CWD070",
      "text": "雙面洞洞布"
    },
    {
      "value": "CWS010",
      "text": "單面平紋"
    },
    {
      "value": "CWS060",
      "text": "單面刷毛布"
    },
    {
      "value": "CWS070",
      "text": "單面組織布"
    },
    {
      "value": "CWS080",
      "text": "單面洞洞布"
    }
  ],
  "WO": [
    {
      "value": "WOS010",
      "text": "平紋"
    },
    {
      "value": "WOS020",
      "text": "斜紋"
    },
    {
      "value": "WOS030",
      "text": "緞紋"
    },
    {
      "value": "WOS040",
      "text": "泡泡布",
      "provisional": true
    }
  ],
  "WK": [
    {
      "value": "WKS010",
      "text": "經編平紋"
    },
    {
      "value": "WKS020",
      "text": "經編網布"
    }
  ]
};

export const compositions = [
  {
    "value": "NF010",
    "text": "棉",
    "name": "Cotton",
    "group": "天然纖維Natural fibres"
  },
  {
    "value": "NF011",
    "text": "有機棉",
    "name": "Organic Cotton",
    "group": "天然纖維Natural fibres"
  },
  {
    "value": "NF020",
    "text": "亞麻",
    "name": "Linen",
    "group": "天然纖維Natural fibres"
  },
  {
    "value": "NF030",
    "text": "苧麻",
    "name": "Ramie",
    "group": "天然纖維Natural fibres"
  },
  {
    "value": "NF031",
    "text": "漢麻",
    "name": "Hemp",
    "group": "天然纖維Natural fibres"
  },
  {
    "value": "NF040",
    "text": "絲",
    "name": "Silk",
    "group": "天然纖維Natural fibres"
  },
  {
    "value": "NF050",
    "text": "羊毛",
    "name": "Wool",
    "group": "天然纖維Natural fibres"
  },
  {
    "value": "NF060",
    "text": "木棉",
    "name": "Kapok",
    "group": "天然纖維Natural fibres"
  },
  {
    "value": "NF070",
    "text": "回收羊毛",
    "name": "Recycled Wool",
    "group": "天然纖維Natural fibres"
  },
  {
    "value": "NF080",
    "text": "回收棉",
    "name": "Recycled Cotton",
    "group": "天然纖維Natural fibres"
  },
  {
    "value": "NF090",
    "text": "紙纖維",
    "name": "Paper fiber",
    "group": "天然纖維Natural fibres"
  },
  {
    "value": "RE010",
    "text": "黏液嫘縈",
    "name": "Viscose Rayon",
    "group": "再生纖維regenerated fiber"
  },
  {
    "value": "RE020",
    "text": "萊賽爾",
    "name": "Lyocell",
    "group": "再生纖維regenerated fiber"
  },
  {
    "value": "RE030",
    "text": "酮氨嫘縈",
    "name": "Cupro Rayon",
    "group": "再生纖維regenerated fiber"
  },
  {
    "value": "SS010",
    "text": "醋酸纖維",
    "name": "Acetate",
    "group": "半合成纖維Semi-synthetic fiber"
  },
  {
    "value": "SS020",
    "text": "三醋酸纖維",
    "name": "Triacetate",
    "group": "半合成纖維Semi-synthetic fiber"
  },
  {
    "value": "SY010",
    "text": "耐隆",
    "name": "Nylon",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY020",
    "text": "耐隆66",
    "name": "Nylon66",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY030",
    "text": "回收耐隆",
    "name": "Recycled Nylon",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY031",
    "text": "回收耐隆66",
    "name": "Recycled Nylon66",
    "group": "化學纖維Chemical fibres"
  },
  {
    "value": "SY040",
    "text": "陽離子可染耐隆",
    "name": "CD Nylon",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY050",
    "text": "聚酯",
    "name": "Polyester",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY060",
    "text": "回收聚酯",
    "name": "Recycled Polyester",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY070",
    "text": "陽離子可染聚酯",
    "name": "CD Polyester",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY080",
    "text": "陽離子可染回收聚酯",
    "name": "Recycled CD Polyester",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY090",
    "text": "聚丙烯腈 / 壓克力 ",
    "name": "Acrylic",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY100",
    "text": "聚丙烯",
    "name": "PP",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY110",
    "text": "彈性纖維",
    "name": "Spandex",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY120",
    "text": "金銀蔥",
    "name": "Lurex",
    "group": "化學纖維Chemical fibres"
  },
  {
    "value": "SY130",
    "text": "聚氨基甲酸酯",
    "name": "PU",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY140",
    "text": "熱塑性聚氨酯",
    "name": "TPU",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY150",
    "text": "泰維克",
    "name": "Polyethylen Tyvek",
    "group": "合成纖維Synthetic fiber"
  },
  {
    "value": "SY160",
    "text": "聚對苯二甲酸丙二酯",
    "name": "PTT",
    "group": "化學纖維Chemical fibres"
  },
  {
    "value": "SY170",
    "text": "回收彈性纖維",
    "name": "Recycled Spandex",
    "group": "化學纖維Chemical fibres"
  },
  {
    "value": "SY180",
    "text": "聚氯乙烯",
    "name": "PVC",
    "group": "化學纖維Chemical fibres"
  },
  {
    "value": "SY190",
    "text": "聚四氟乙烯\n",
    "name": "PTFE",
    "group": "化學纖維Chemical fibres"
  },
  {
    "value": "SY200",
    "text": "生質聚酯纖維\n",
    "name": "Biobased Polyester\n",
    "group": "化學纖維Chemical fibres"
  },
  {
    "value": "SY210",
    "text": "彈性聚酯複合纖維",
    "name": "ELASTERELL-P/ELASTOMULTIESTER",
    "group": "化學纖維Chemical fibres"
  },
  {
    "value": "SY220",
    "text": "回收彈性聚酯複合纖維",
    "name": "Recycled ELASTERELL-P/ELASTOMULTIESTER",
    "group": "化學纖維Chemical fibres"
  },
  {
    "value": "SY230",
    "text": "生質耐隆纖維",
    "name": "Biobased Nylon",
    "group": "化學纖維Chemical fibres"
  },
  {
    "value": "SY240",
    "text": "生質彈性纖維",
    "name": "Biobased Spandex",
    "group": "化學纖維Chemical fibres"
  }
];

export const stretchOptions = [
  {
    "value": "NA",
    "text": "無彈性"
  },
  {
    "value": "warp stretch",
    "text": "經向彈性"
  },
  {
    "value": "weft stretch",
    "text": "緯向彈性"
  },
  {
    "value": "4 way stretch",
    "text": "四向彈性"
  }
];

// gsm / thickness 為資料內容.xlsx 的輸入限制；api* 為 Specs2VS 模型的有效範圍。
export const specLimits = {
  "gsm": {
    "min": 43.0,
    "max": 527.0,
    "unit": "g/m2"
  },
  "thickness": {
    "min": 0.01,
    "max": 3.4,
    "unit": "mm"
  },
  "apiGsm": {
    "min": 50,
    "max": 400,
    "unit": "g/m2"
  },
  "apiThickness": {
    "min": 0.05,
    "max": 1.5,
    "unit": "mm"
  },
  "opPercentage": {
    "min": 0,
    "max": 60,
    "unit": "%"
  }
};

// Pattern 生成 API（Schema_Generate_pattern）
export const patternTasks = [
  "seamless",
  "tiling",
  "general"
];
export const patternStyles = [
  "",
  "Abstract",
  "Gouache",
  "Impressionistic",
  "Line Art",
  "Low-poly",
  "Minimalist",
  "Pastel",
  "Sketch",
  "Vector Art",
  "Watercolor"
];
export const patternServers = [
  {
    "value": "Gemini",
    "models": [
      "Gemini2.5",
      "Gemini-3",
      "Imagen"
    ],
    "default": "Gemini2.5"
  },
  {
    "value": "TTRI",
    "models": [
      "dev",
      "schnell"
    ],
    "default": "dev"
  }
];
export const patternImageSizes = [512, 1024];

export const compositionByCode = Object.fromEntries(compositions.map((item) => [item.value, item]));
export const fabricCategoryByCode = Object.fromEntries(fabricCategories.map((item) => [item.value, item]));
