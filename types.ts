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
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

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
  aspectRatio: AspectRatio; // New field for aspect ratio
  // New configuration fields
  campaignStyleCount: number;
  ecommercePhotoCount: number;
  ecommerceColorVariations: string;
  ecommercePatternImage: File | null; // New field for pattern upload
  renderTextOnImage: boolean; // Renamed from renderBrandOnImage
  imageOverlayText: string; // New field for custom text
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
  progress?: number; // Added progress field (0-100)
}

export type AppStep = 'upload' | 'analyzing' | 'generating' | 'results';