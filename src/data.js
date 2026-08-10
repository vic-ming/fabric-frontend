// 資料彙整入口。實際內容由 scripts/build-fabric-data.py 與 scripts/prepare-assets.py
// 依客戶交付的 Excel／素材產生，請改動來源檔後重跑腳本，不要直接編輯 src/data/ 下的產生檔。

export {
  fabricCategories,
  fabricTypes,
  fabricationsByType,
  compositions,
  compositionByCode,
  fabricCategoryByCode,
  stretchOptions,
  specLimits,
  patternTasks,
  patternStyles,
  patternServers,
  patternImageSizes,
} from './data/fabric-options.js';

export {
  fabricLibrary,
  fabricByCode,
  fabricsWithU3M,
  unlistedSwatches,
} from './data/fabric-library.js';

export {
  previewModels,
  previewModelByValue,
  hdriOptions,
} from './data/preview-assets.js';

export { builtInPatterns, patternById } from './data/pattern-assets.js';

export { pantoneColors, pantoneByCode } from './data/pantone.js';
