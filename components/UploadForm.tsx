import React, { ChangeEvent, useState, DragEvent, useRef } from 'react';
import { FormData, AdStyle, VideoModel } from '../types';
import { Upload, ShoppingBag, Type, Palette, X, Check, Image as ImageIcon, Video, Layers, Camera, Clapperboard, Zap, Sparkles, MessageSquarePlus, ImagePlus } from 'lucide-react';

interface Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const UploadForm: React.FC<Props> = ({ formData, setFormData, onSubmit, isSubmitting }) => {
  const [mainDragActive, setMainDragActive] = useState(false);
  const [optDragActive, setOptDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const mainInputRef = useRef<HTMLInputElement>(null);
  const optInputRef = useRef<HTMLInputElement>(null);

  // Generic File Handler
  const handleFile = (file: File, isOptional: boolean) => {
    if (file && file.type.startsWith('image/')) {
      if (!isOptional) {
        // Main Image with progress simulation
        setUploadProgress(0);
        const duration = 1000; 
        const intervalTime = 50;
        const steps = duration / intervalTime;
        let currentStep = 0;

        const timer = setInterval(() => {
          currentStep++;
          const progress = Math.min((currentStep / steps) * 100, 100);
          setUploadProgress(progress);

          if (currentStep >= steps) {
            clearInterval(timer);
            setFormData(prev => ({ ...prev, productImage: file }));
            setTimeout(() => setUploadProgress(null), 200); 
          }
        }, intervalTime);
      } else {
        // Optional Image (Instant)
        setFormData(prev => ({ ...prev, optionalImage: file }));
      }
    }
  };

  // Drag Handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>, isOptional: boolean, status: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOptional) setOptDragActive(status);
    else setMainDragActive(status);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, isOptional: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOptional) setOptDragActive(false);
    else setMainDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], isOptional);
    }
  };

  const removeFile = (e: React.MouseEvent, isOptional: boolean) => {
    e.stopPropagation(); 
    if (isOptional) {
      setFormData(prev => ({ ...prev, optionalImage: null }));
      if(optInputRef.current) optInputRef.current.value = "";
    } else {
      setFormData(prev => ({ ...prev, productImage: null }));
      if(mainInputRef.current) mainInputRef.current.value = "";
    }
  };

  const adStyles: AdStyle[] = [
    'Lüks ve Premium', 
    'Minimalist Stüdyo', 
    'Lüks Mağaza Atmosferi', 
    'Doğal Gün Işığı',
    'Vintage & Retro', 
    'Neon & Cyberpunk', 
    'Sinematik & Dramatik',
    'Renkli & Pop Art',
    'Art Deco',
    'Gotik',
    'Bilim Kurgu',
    'Retro Fütürizm',
    'Soyut',
    'Steampunk',
    'Vaporwave',
    'Bauhaus',
    'Rustik & Bohem'
  ];

  const videoOptions: { id: VideoModel; name: string; description: string; icon: React.FC<any> }[] = [
    { id: 'veo-3.1-generate-preview', name: 'Yüksek Kalite (High Quality)', description: 'Sinematik kalite, en iyi detaylar (Yavaş)', icon: Sparkles },
    { id: 'veo-3.1-fast-generate-preview', name: 'Hızlı (Fast)', description: 'Hızlı üretim, standart kalite', icon: Zap },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Yeni Kampanya Oluştur
        </h2>
        <p className="text-slate-400 mt-2">
          Ürün fotoğrafını yükle, yapay zeka senin için prodüksiyon yapsın.
        </p>
      </div>

      <div className="space-y-6">
        {/* Mode Selection */}
        <div className="bg-slate-900/50 p-1.5 rounded-xl flex gap-1 border border-slate-700">
          <button
            onClick={() => setFormData(prev => ({ ...prev, mode: 'campaign' }))}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              formData.mode === 'campaign'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Reklam Kampanyası
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded ml-1">4 Stil</span>
          </button>
          <button
            onClick={() => setFormData(prev => ({ ...prev, mode: 'ecommerce' }))}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              formData.mode === 'ecommerce'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            E-Ticaret Paketi
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded ml-1">6 Poz</span>
          </button>
        </div>

        {/* MAIN PRODUCT UPLOAD */}
        <div className="relative group">
          <label className="block text-sm font-medium text-slate-300 mb-2">Ürün Fotoğrafı (Zorunlu)</label>
          
          <div 
            onDragEnter={(e) => handleDrag(e, false, true)}
            onDragLeave={(e) => handleDrag(e, false, false)}
            onDragOver={(e) => handleDrag(e, false, true)}
            onDrop={(e) => handleDrop(e, false)}
            onClick={!formData.productImage ? () => mainInputRef.current?.click() : undefined}
            className={`
              relative overflow-hidden
              border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center text-center transition-all duration-300
              ${!formData.productImage && !uploadProgress ? 'cursor-pointer' : ''}
              ${mainDragActive ? 'border-blue-500 bg-blue-500/10 scale-[1.01] shadow-xl shadow-blue-500/10' : 'border-slate-600 hover:border-blue-500/50 hover:bg-slate-700/30'}
              ${formData.productImage ? 'border-green-500/50 bg-green-500/5' : ''}
            `}
          >
            <input 
              ref={mainInputRef}
              type="file" 
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], false)}
              className="hidden" 
            />

            <div className="w-full px-8 relative z-10">
              {uploadProgress !== null ? (
                <div className="w-full max-w-xs mx-auto">
                   <div className="flex items-center justify-between mb-2 text-sm text-blue-300 font-medium">
                      <span>Yükleniyor...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                   </div>
                   <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-75 ease-out" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                   </div>
                </div>
              ) : formData.productImage ? (
                <div className="w-full relative animate-fade-in">
                   <div className="relative inline-block group/preview">
                      <img 
                        src={URL.createObjectURL(formData.productImage)} 
                        alt="Önizleme" 
                        className="h-40 object-contain rounded-lg shadow-xl mb-3 bg-slate-900/50 mx-auto"
                      />
                      <button 
                        onClick={(e) => removeFile(e, false)}
                        className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                        title="Resmi Kaldır"
                      >
                        <X className="w-4 h-4" />
                      </button>
                   </div>
                  <div className="flex items-center justify-center gap-2 text-green-400 font-medium bg-green-500/10 py-1.5 px-4 rounded-full mx-auto w-fit border border-green-500/20">
                    <Check className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">{formData.productImage.name}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto transition-transform duration-300
                    ${mainDragActive ? 'bg-blue-500 scale-110' : 'bg-slate-700 group-hover:scale-110'}
                  `}>
                    <Upload className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-slate-200 text-lg font-medium mb-1">
                    {mainDragActive ? 'Fotoğrafı Bırak' : 'Fotoğrafı buraya sürükle veya seç'}
                  </p>
                  <p className="text-slate-500 text-sm">PNG, JPG, WEBP (Max 10MB)</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Product Details Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4"/> Elbise veya Model Adı</span>
            </label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
              placeholder="Örn: İpek Saten Abiye"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
               <span className="flex items-center gap-2"><Type className="w-4 h-4"/> Ürünün Markası</span>
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              placeholder="Örn: Vakko, Zara"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* OPTIONAL IMAGE UPLOAD & CUSTOM PROMPT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Optional Image */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <span className="flex items-center gap-2"><ImagePlus className="w-4 h-4"/> Ürünün Arkadan Görünümü / Aksesuar Ekleme (Opsiyonel)</span>
            </label>
            <div 
              onDragEnter={(e) => handleDrag(e, true, true)}
              onDragLeave={(e) => handleDrag(e, true, false)}
              onDragOver={(e) => handleDrag(e, true, true)}
              onDrop={(e) => handleDrop(e, true)}
              onClick={() => !formData.optionalImage && optInputRef.current?.click()}
              className={`
                relative h-[120px] rounded-lg border-2 border-dashed flex items-center justify-center text-center transition-all cursor-pointer
                ${formData.optionalImage ? 'border-purple-500/50 bg-purple-500/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800'}
                ${optDragActive ? 'border-purple-500 bg-purple-500/10' : ''}
              `}
            >
              <input 
                ref={optInputRef}
                type="file" 
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], true)}
                className="hidden" 
              />
              
              {formData.optionalImage ? (
                <div className="flex items-center gap-3 px-4 w-full">
                  <img 
                    src={URL.createObjectURL(formData.optionalImage)} 
                    alt="Ref" 
                    className="w-16 h-16 object-cover rounded bg-slate-900"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm text-slate-200 truncate">{formData.optionalImage.name}</p>
                    <p className="text-xs text-slate-500">Resim eklendi</p>
                  </div>
                  <button 
                    onClick={(e) => removeFile(e, true)}
                    className="p-1.5 bg-slate-700 hover:bg-red-500 rounded-md transition-colors text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-500">
                  <ImagePlus className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-xs">Arkadan görünüm veya aksesuar resmi yükle</span>
                </div>
              )}
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <span className="flex items-center gap-2"><MessageSquarePlus className="w-4 h-4"/> Özel İstekler & Sahne Detayları (Opsiyonel)</span>
            </label>
            <textarea
              value={formData.customPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, customPrompt: e.target.value }))}
              placeholder={'Örn: "Model hafifçe sağa baksın", "Arka planda hafif şehir ışıkları olsun" veya "Yüklediğim aksesuarı modelin eline doğal bir şekilde yerleştirin".'}
              className="w-full h-[120px] bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm"
            />
          </div>
        </div>

        {/* Video Toggle */}
        <div>
           <label className="block text-sm font-medium text-slate-300 mb-2">
             <span className="flex items-center gap-2"><Clapperboard className="w-4 h-4"/> Çıktı Tercihi</span>
           </label>
           <div className="bg-slate-900/50 p-1.5 rounded-lg flex gap-1 border border-slate-700">
             <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, includeVideo: false }))}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  !formData.includeVideo
                    ? 'bg-slate-700 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                Sadece Fotoğraf
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, includeVideo: true }))}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  formData.includeVideo
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Video className="w-3 h-3" />
                Fotoğraf + Video
              </button>
           </div>
        </div>

        {/* Video Quality */}
        <div className={`transition-all duration-300 ${!formData.includeVideo ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
          <label className="block text-sm font-medium text-slate-300 mb-2">
              <span className="flex items-center gap-2"><Video className="w-4 h-4"/> Video Kalitesi</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videoOptions.map((option) => (
              <div 
                key={option.id}
                onClick={() => setFormData(prev => ({ ...prev, videoModel: option.id }))}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  formData.videoModel === option.id 
                  ? 'bg-purple-600/20 border-purple-500' 
                  : 'bg-slate-900/30 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${formData.videoModel === option.id ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
                    <option.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`font-medium text-sm ${formData.videoModel === option.id ? 'text-purple-300' : 'text-slate-200'}`}>{option.name}</div>
                    <div className="text-xs text-slate-500">{option.description}</div>
                  </div>
                </div>
                {formData.videoModel === option.id && <Check className="w-4 h-4 text-purple-400" />}
              </div>
            ))}
          </div>
        </div>

        {/* Style Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
             <span className="flex items-center gap-2"><Palette className="w-4 h-4"/> 
             {formData.mode === 'ecommerce' ? 'E-Ticaret Mekan Teması' : 'Reklam Stili'}
             </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {adStyles.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, adStyle: style }))}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all text-left truncate ${
                  formData.adStyle === style 
                    ? formData.mode === 'ecommerce' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
                title={style}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={!formData.productImage || !formData.productName || isSubmitting}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
            !formData.productImage || !formData.productName || isSubmitting
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : formData.mode === 'ecommerce' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-600/20'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-600/20'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              İşleniyor...
            </span>
          ) : (
            formData.mode === 'ecommerce' ? 'E-Ticaret Paketini Oluştur' : 'Kampanyayı Başlat'
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadForm;