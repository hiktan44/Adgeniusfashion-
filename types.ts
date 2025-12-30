export interface ProductAnalysis {
  urun_adi: string;
  urun_kategorisi: string;
  ana_renk: string;
  ikincil_renkler: string[];
  malzeme: string;
  boyut_tahmini: string;
  stil: string;
  ozellikler: string[];
  hedef_kitle: string;
  reklam_ortami: string;
  anahtar_kelimeler: string[];
  // New E-commerce specific fields
  eticaret_baslik: string;
  eticaret_aciklama: string;
  eticaret_ozellikler: string[];
}

export type AdStyle = 
  | 'Lüks ve Premium' 
  | 'Minimalist Stüdyo' 
  | 'Lüks Mağaza Atmosferi'
  | 'Doğal Gün Işığı'
  | 'Vintage & Retro' 
  | 'Neon & Cyberpunk' 
  | 'Sinematik & Dramatik'
  | 'Renkli & Pop Art'
  | 'Art Deco'
  | 'Gotik'
  | 'Bilim Kurgu'
  | 'Retro Fütürizm'
  | 'Soyut'
  | 'Steampunk'
  | 'Vaporwave'
  | 'Bauhaus'
  | 'Rustik & Bohem';

export type ImageModel = 'gemini-3-pro-image-preview' | 'gemini-2.5-flash-image';
export type VideoModel = 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
export type GenerationMode = 'campaign' | 'ecommerce';

export interface FormData {
  productImage: File | null;
  optionalImage: File | null; // New field for reference/background image
  productName: string;
  brand: string;
  customPrompt: string;
  adStyle: AdStyle;
  imageModel: ImageModel;
  videoModel: VideoModel;
  mode: GenerationMode;
  includeVideo: boolean;
}

export interface AdPrompt {
  id: number;
  type: string;
  text: string;
}

export interface GenerationResult {
  id: number;
  type: string;
  prompt: string;
  imageUrl?: string;
  videoUrl?: string;
  status: 'pending' | 'generating_image' | 'generating_video' | 'completed' | 'failed';
  error?: string;
}

export type AppStep = 'upload' | 'analyzing' | 'generating' | 'results';