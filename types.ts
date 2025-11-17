export enum Quality {
  Standard = 'Standard',
  High = '2K - 4K (High)',
  Ultra = '8K (Ultra)',
}

export interface FormState {
  images: File[];
  removeBackground: boolean;
  influenceEnabled: boolean;
  influenceStrength: number;
  characterDesc: string;
  sceneDesc: string;
  quality: Quality;
}

export interface GeneratedImage {
  id: string;
  src: string;
  isEnhancing?: boolean;
}
