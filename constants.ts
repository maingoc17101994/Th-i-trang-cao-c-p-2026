import { Quality } from './types';

export const QUALITY_OPTIONS = [
  { id: Quality.Standard, label: 'Standard', caption: 'Chất lượng tốt' },
  { id: Quality.High, label: '2K - 4K (High)', caption: 'Chi tiết sắc nét' },
  { id: Quality.Ultra, label: '8K (Ultra)', caption: 'Siêu thực' },
];

export const INITIAL_FORM_STATE = {
  images: [],
  removeBackground: false,
  influenceEnabled: true,
  influenceStrength: 100,
  characterDesc: '',
  sceneDesc: '',
  quality: Quality.High,
};