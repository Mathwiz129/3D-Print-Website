// 3D Printer Presets for Outprint Application Form
// Comprehensive list of popular 3D printers
window.PRINTER_PRESETS = [
  // Bambu Labs
  {
    id: 'bambu-a1-mini',
    brand: 'Bambu Labs',
    model: 'A1 Mini',
    version: '',
    bedSize: { x: 180, y: 180, z: 180 },
    supportedMaterials: ['PLA', 'PETG', 'TPU', 'ABS'],
    avgSpeed: 250,
    notes: 'Auto bed leveling, AMS lite support.'
  },
  {
    id: 'bambu-a1',
    brand: 'Bambu Labs',
    model: 'A1',
    version: '',
    bedSize: { x: 256, y: 256, z: 256 },
    supportedMaterials: ['PLA', 'PETG', 'TPU', 'ABS'],
    avgSpeed: 250,
    notes: 'Auto bed leveling, AMS support.'
  },
  {
    id: 'bambu-p1p',
    brand: 'Bambu Labs',
    model: 'P1P',
    version: '',
    bedSize: { x: 256, y: 256, z: 256 },
    supportedMaterials: ['PLA', 'PETG', 'TPU', 'ABS'],
    avgSpeed: 300,
    notes: 'High speed, open source firmware.'
  },
  {
    id: 'bambu-p1s',
    brand: 'Bambu Labs',
    model: 'P1S',
    version: '',
    bedSize: { x: 256, y: 256, z: 256 },
    supportedMaterials: ['PLA', 'PETG', 'TPU', 'ABS'],
    avgSpeed: 300,
    notes: 'Enclosed, high speed, AMS support.'
  },
  {
    id: 'bambu-x1c',
    brand: 'Bambu Labs',
    model: 'X1 Carbon',
    version: '',
    bedSize: { x: 256, y: 256, z: 256 },
    supportedMaterials: ['PLA', 'PETG', 'TPU', 'ABS', 'PA', 'PC', 'CF'],
    avgSpeed: 300,
    notes: 'Flagship, multi-material, high speed.'
  },
  {
    id: 'bambu-x1e',
    brand: 'Bambu Labs',
    model: 'X1E',
    version: '',
    bedSize: { x: 256, y: 256, z: 256 },
    supportedMaterials: ['PLA', 'PETG', 'TPU', 'ABS', 'PA', 'PC', 'CF'],
    avgSpeed: 300,
    notes: 'Enterprise version, high temp materials.'
  },

  // Prusa
  {
    id: 'prusa-mk3s',
    brand: 'Prusa',
    model: 'MK3S+',
    version: '',
    bedSize: { x: 250, y: 210, z: 210 },
    supportedMaterials: ['PLA', 'PETG', 'ABS', 'ASA', 'PC', 'Flex'],
    avgSpeed: 120,
    notes: 'Reliable, open source, removable bed.'
  },
  {
    id: 'prusa-mk4',
    brand: 'Prusa',
    model: 'MK4',
    version: '',
    bedSize: { x: 250, y: 210, z: 220 },
    supportedMaterials: ['PLA', 'PETG', 'ABS', 'ASA', 'PC', 'Flex'],
    avgSpeed: 150,
    notes: 'Next generation, faster, more reliable.'
  },
  {
    id: 'prusa-xl',
    brand: 'Prusa',
    model: 'XL',
    version: '',
    bedSize: { x: 360, y: 360, z: 360 },
    supportedMaterials: ['PLA', 'PETG', 'ABS', 'ASA', 'PC', 'Flex'],
    avgSpeed: 200,
    notes: 'Large format, multi-tool, high precision.'
  },
  {
    id: 'prusa-mini',
    brand: 'Prusa',
    model: 'Mini+',
    version: '',
    bedSize: { x: 180, y: 180, z: 180 },
    supportedMaterials: ['PLA', 'PETG', 'ABS', 'Flex'],
    avgSpeed: 100,
    notes: 'Compact, reliable, great for beginners.'
  },

  // Creality
  {
    id: 'ender-3',
    brand: 'Creality',
    model: 'Ender 3',
    version: '',
    bedSize: { x: 220, y: 220, z: 250 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 60,
    notes: 'Classic, mod-friendly, affordable.'
  },
  {
    id: 'ender-3-v2',
    brand: 'Creality',
    model: 'Ender 3 V2',
    version: '',
    bedSize: { x: 220, y: 220, z: 250 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 60,
    notes: 'Improved version with better screen.'
  },
  {
    id: 'ender-3-v3-se',
    brand: 'Creality',
    model: 'Ender 3 V3 SE',
    version: '',
    bedSize: { x: 220, y: 220, z: 250 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 150,
    notes: 'High speed, auto bed leveling.'
  },
  {
    id: 'ender-3-v3-ke',
    brand: 'Creality',
    model: 'Ender 3 V3 KE',
    version: '',
    bedSize: { x: 220, y: 220, z: 250 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 200,
    notes: 'High speed, Klipper firmware.'
  },
  {
    id: 'ender-5',
    brand: 'Creality',
    model: 'Ender 5',
    version: '',
    bedSize: { x: 220, y: 220, z: 300 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 60,
    notes: 'CoreXY design, taller build volume.'
  },
  {
    id: 'ender-5-plus',
    brand: 'Creality',
    model: 'Ender 5 Plus',
    version: '',
    bedSize: { x: 350, y: 350, z: 400 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 60,
    notes: 'Large format, touch screen.'
  },
  {
    id: 'cr-10',
    brand: 'Creality',
    model: 'CR-10',
    version: '',
    bedSize: { x: 300, y: 300, z: 400 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 60,
    notes: 'Large format, reliable.'
  },
  {
    id: 'cr-10s',
    brand: 'Creality',
    model: 'CR-10S',
    version: '',
    bedSize: { x: 300, y: 300, z: 400 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 60,
    notes: 'CR-10 with auto bed leveling.'
  },
  {
    id: 'k1',
    brand: 'Creality',
    model: 'K1',
    version: '',
    bedSize: { x: 220, y: 220, z: 250 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 200,
    notes: 'High speed, enclosed, Klipper.'
  },
  {
    id: 'k1-max',
    brand: 'Creality',
    model: 'K1 Max',
    version: '',
    bedSize: { x: 300, y: 300, z: 300 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 200,
    notes: 'Large format, high speed, enclosed.'
  },

  // Ultimaker
  {
    id: 'ultimaker-s3',
    brand: 'Ultimaker',
    model: 'S3',
    version: '',
    bedSize: { x: 230, y: 190, z: 200 },
    supportedMaterials: ['PLA', 'PETG', 'ABS', 'TPU', 'CPE'],
    avgSpeed: 80,
    notes: 'Professional, dual extrusion, reliable.'
  },
  {
    id: 'ultimaker-s5',
    brand: 'Ultimaker',
    model: 'S5',
    version: '',
    bedSize: { x: 330, y: 240, z: 300 },
    supportedMaterials: ['PLA', 'PETG', 'ABS', 'TPU', 'CPE', 'PC'],
    avgSpeed: 80,
    notes: 'Large format, professional, dual extrusion.'
  },

  // MakerBot
  {
    id: 'makerbot-replicator',
    brand: 'MakerBot',
    model: 'Replicator+',
    version: '',
    bedSize: { x: 295, y: 195, z: 165 },
    supportedMaterials: ['PLA', 'PETG'],
    avgSpeed: 60,
    notes: 'Reliable, easy to use, good support.'
  },
  {
    id: 'makerbot-method',
    brand: 'MakerBot',
    model: 'Method',
    version: '',
    bedSize: { x: 190, y: 190, z: 196 },
    supportedMaterials: ['PLA', 'ABS', 'PC-ABS'],
    avgSpeed: 100,
    notes: 'Professional, heated chamber, soluble support.'
  },

  // Anycubic
  {
    id: 'anycubic-kobra',
    brand: 'Anycubic',
    model: 'Kobra',
    version: '',
    bedSize: { x: 220, y: 220, z: 250 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 80,
    notes: 'Auto bed leveling, good value.'
  },
  {
    id: 'anycubic-kobra-2',
    brand: 'Anycubic',
    model: 'Kobra 2',
    version: '',
    bedSize: { x: 220, y: 220, z: 250 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 150,
    notes: 'High speed, improved design.'
  },
  {
    id: 'anycubic-kobra-2-max',
    brand: 'Anycubic',
    model: 'Kobra 2 Max',
    version: '',
    bedSize: { x: 400, y: 400, z: 400 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 150,
    notes: 'Large format, high speed.'
  },
  {
    id: 'anycubic-vyper',
    brand: 'Anycubic',
    model: 'Vyper',
    version: '',
    bedSize: { x: 245, y: 245, z: 260 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 80,
    notes: 'Auto bed leveling, direct drive.'
  },

  // Elegoo
  {
    id: 'elegoo-neptune-3',
    brand: 'Elegoo',
    model: 'Neptune 3',
    version: '',
    bedSize: { x: 220, y: 220, z: 280 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 80,
    notes: 'Auto bed leveling, good value.'
  },
  {
    id: 'elegoo-neptune-3-pro',
    brand: 'Elegoo',
    model: 'Neptune 3 Pro',
    version: '',
    bedSize: { x: 225, y: 225, z: 280 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 80,
    notes: 'Improved version with better features.'
  },
  {
    id: 'elegoo-neptune-4',
    brand: 'Elegoo',
    model: 'Neptune 4',
    version: '',
    bedSize: { x: 225, y: 225, z: 265 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 150,
    notes: 'High speed, Klipper firmware.'
  },
  {
    id: 'elegoo-neptune-4-pro',
    brand: 'Elegoo',
    model: 'Neptune 4 Pro',
    version: '',
    bedSize: { x: 225, y: 225, z: 265 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 150,
    notes: 'High speed, auto bed leveling, direct drive.'
  },

  // Sovol
  {
    id: 'sovol-sv06',
    brand: 'Sovol',
    model: 'SV06',
    version: '',
    bedSize: { x: 220, y: 220, z: 250 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 80,
    notes: 'Prusa MK3S clone, good value.'
  },
  {
    id: 'sovol-sv06-plus',
    brand: 'Sovol',
    model: 'SV06 Plus',
    version: '',
    bedSize: { x: 280, y: 240, z: 300 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 80,
    notes: 'Larger format, improved design.'
  },

  // Artillery
  {
    id: 'artillery-sidewinder-x2',
    brand: 'Artillery',
    model: 'Sidewinder X2',
    version: '',
    bedSize: { x: 300, y: 300, z: 400 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 80,
    notes: 'Large format, direct drive, auto bed leveling.'
  },
  {
    id: 'artillery-hornet',
    brand: 'Artillery',
    model: 'Hornet',
    version: '',
    bedSize: { x: 220, y: 220, z: 250 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 80,
    notes: 'Compact, direct drive, good value.'
  },

  // FlashForge
  {
    id: 'flashforge-adventurer-3',
    brand: 'FlashForge',
    model: 'Adventurer 3',
    version: '',
    bedSize: { x: 150, y: 150, z: 150 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 60,
    notes: 'Enclosed, easy to use, good for beginners.'
  },
  {
    id: 'flashforge-guider-2',
    brand: 'FlashForge',
    model: 'Guider 2',
    version: '',
    bedSize: { x: 280, y: 180, z: 300 },
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    avgSpeed: 80,
    notes: 'Professional, enclosed, dual extrusion.'
  },

  // Custom option
  {
    id: 'custom',
    brand: 'Custom',
    model: '',
    version: '',
    bedSize: { x: '', y: '', z: '' },
    supportedMaterials: [],
    avgSpeed: '',
    notes: ''
  }
]; 