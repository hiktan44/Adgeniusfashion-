import React, { useState, useEffect } from 'react';
import { GenerationResult } from '../types';
import { Download, AlertCircle, Loader2, Video, LayoutGrid, Image as ImageIcon } from 'lucide-react';

interface Props {
  results: GenerationResult[];
}

const ResultsGallery: React.FC<Props> = ({ results }) => {
  const [collageUrl, setCollageUrl] = useState<string | null>(null);
  const [isGeneratingCollage, setIsGeneratingCollage] = useState(false);

  // Filter only successfully generated images
  const completedImages = results.filter(r => r.imageUrl && (r.status === 'completed' || r.status === 'generating_video'));
  const allFinished = results.every(r => r.status === 'completed' || r.status === 'failed');

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getExtension = (url: string) => {
    if (url.includes('image/jpeg')) return '.jpg';
    if (url.includes('image/webp')) return '.webp';
    return '.png';
  };

  const generateCollage = async () => {
    if (completedImages.length === 0) return;
    setIsGeneratingCollage(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Configuration
      const gap = 20; // Gap between images
      const padding = 40; // Outer padding
      const headerHeight = 0; 
      
      const count = completedImages.length;
      
      // Determine layout based on count
      let cols = 3;
      if (count <= 2) cols = 2;
      else if (count === 4) cols = 2;
      else if (count >= 5) cols = 3;

      const rows = Math.ceil(count / cols);
      
      // Helper to load image
      const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        // Only set crossOrigin if it's NOT a data URI (e.g. external URL)
        if (!src.startsWith('data:')) {
            img.crossOrigin = "Anonymous";
        }
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

      // Load first image to check dimensions
      const firstImg = await loadImage(completedImages[0].imageUrl!);

      const imgAspect = firstImg.width / firstImg.height;
      const targetImageWidth = 800;
      const targetImageHeight = targetImageWidth / imgAspect;

      const totalWidth = (cols * targetImageWidth) + ((cols - 1) * gap) + (padding * 2);
      const totalHeight = (rows * targetImageHeight) + ((rows - 1) * gap) + (padding * 2) + headerHeight;

      canvas.width = totalWidth;
      canvas.height = totalHeight;

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, totalHeight);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#1e293b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      // Draw All Images
      await Promise.all(completedImages.map(async (item, index) => {
        const img = await loadImage(item.imageUrl!);
        
        const colIndex = index % cols;
        const rowIndex = Math.floor(index / cols);

        const x = padding + (colIndex * (targetImageWidth + gap));
        const y = headerHeight + padding + (rowIndex * (targetImageHeight + gap));

        // Draw Image with shadow effect
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;
        
        // Manual rounded rect path for broader browser compatibility
        const radius = 16;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + targetImageWidth - radius, y);
        ctx.quadraticCurveTo(x + targetImageWidth, y, x + targetImageWidth, y + radius);
        ctx.lineTo(x + targetImageWidth, y + targetImageHeight - radius);
        ctx.quadraticCurveTo(x + targetImageWidth, y + targetImageHeight, x + targetImageWidth - radius, y + targetImageHeight);
        ctx.lineTo(x + radius, y + targetImageHeight);
        ctx.quadraticCurveTo(x, y + targetImageHeight, x, y + targetImageHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(img, x, y, targetImageWidth, targetImageHeight);
        ctx.restore();
      }));

      setCollageUrl(canvas.toDataURL('image/png'));
    } catch (e) {
      console.error("Collage generation error:", e);
    } finally {
      setIsGeneratingCollage(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 space-y-8">
      
      {/* Collage Section - Shows up when generation is complete or nearly complete */}
      {(allFinished && completedImages.length > 0) && (
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="mb-4">
            <LayoutGrid className="w-12 h-12 text-blue-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white">Kampanya Albümü</h3>
            <p className="text-slate-400 text-sm">Tüm görselleri tek bir koleksiyon olarak görüntüleyin ve indirin.</p>
          </div>

          {!collageUrl ? (
            <button
              onClick={generateCollage}
              disabled={isGeneratingCollage}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25"
            >
              {isGeneratingCollage ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Albüm Oluşturuluyor...</>
              ) : (
                <><ImageIcon className="w-5 h-5" /> Albüm Oluştur</>
              )}
            </button>
          ) : (
            <div className="w-full max-w-4xl animate-fade-in-up flex flex-col items-center">
              <div className="relative group rounded-xl overflow-hidden shadow-2xl border border-slate-700 w-full mb-4">
                <img src={collageUrl} alt="Kampanya Albümü" className="w-full h-auto" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   {/* Overlay button for desktop hover */}
                  <button 
                    onClick={() => collageUrl && handleDownload(collageUrl, 'adgenius-kampanya-albumu.png')}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-all transform hover:scale-105 border border-white/20 font-medium"
                  >
                    <Download className="w-5 h-5" /> Albümü İndir (PNG)
                  </button>
                </div>
              </div>
              
              {/* Standalone Download Button (Mobile/Direct Access) */}
              <button 
                onClick={() => collageUrl && handleDownload(collageUrl, 'adgenius-kampanya-albumu.png')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 mb-2"
              >
                <Download className="w-5 h-5" /> Albümü İndir
              </button>

              <button 
                onClick={() => setCollageUrl(null)}
                className="text-slate-500 hover:text-slate-300 text-sm underline"
              >
                Albümü Gizle / Yeniden Oluştur
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 pl-4 border-l-4 border-blue-500">Üretilen İçerikler</h2>
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
        {results.map((result) => (
          <div key={result.id} className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col relative">
            
            {/* Progress Bar Overlay (if actively generating) */}
            {result.status !== 'completed' && result.status !== 'failed' && result.progress !== undefined && (
              <div className="absolute top-0 left-0 right-0 z-20">
                <div className="h-1 bg-slate-700 w-full">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 ease-out" 
                    style={{ width: `${result.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center relative z-10">
              <div className="flex flex-col">
                <span className="font-semibold text-blue-300 text-sm">{result.type}</span>
                {result.progress !== undefined && result.progress > 0 && result.progress < 100 && (
                   <span className="text-[10px] text-slate-400 font-mono">
                     {result.status === 'generating_image' ? 'Görsel' : 'Video'}: %{result.progress}
                   </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                 {/* Partial Success Warning */}
                 {(result.status === 'completed' && result.error) && (
                     <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-full text-xs border border-yellow-500/20" title={result.error}>
                        <AlertCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">Video Hatası</span>
                     </div>
                 )}
                 <span className={`text-xs px-2 py-1 rounded-full ${
                    result.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    result.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400 animate-pulse'
                  }`}>
                    {result.status === 'completed' ? 'Hazır' : 
                     result.status === 'generating_image' ? 'Görsel Üretiliyor...' :
                     result.status === 'generating_video' ? 'Video Üretiliyor...' : 'Bekliyor'}
                 </span>
              </div>
            </div>

            {/* Content Area */}
            <div className={`relative bg-black/40 group ${
                'aspect-video' // Default container ratio
              }`}>
              {result.imageUrl ? (
                <div className="flex h-full w-full">
                  {/* Image Half */}
                  <div className={`${(result.videoUrl || result.status === 'generating_video' || result.error) ? 'w-1/2 border-r border-slate-700' : 'w-full'} relative h-full bg-slate-900`}>
                    <img 
                      src={result.imageUrl} 
                      alt="Oluşturulan Reklam" 
                      className="w-full h-full object-contain" 
                    />
                  </div>

                  {/* Video Half - Only show if video exists or is generating or if ERROR exists but we want to show it in the video slot */}
                  {(result.videoUrl || result.status === 'generating_video' || (result.status === 'completed' && result.error)) && result.status !== 'generating_image' && (
                    <div className="w-1/2 relative flex items-center justify-center bg-slate-900 h-full border-l border-slate-700">
                      {result.videoUrl ? (
                        <div className="relative w-full h-full group/video">
                          <video 
                            src={result.videoUrl} 
                            className="w-full h-full object-contain" 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                          />
                        </div>
                      ) : result.status === 'generating_video' ? (
                         <div className="text-center p-4 w-full">
                           <div className="relative w-12 h-12 mx-auto mb-2">
                              <svg className="animate-spin w-full h-full text-slate-700" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                {result.progress}%
                              </div>
                           </div>
                           <p className="text-xs text-blue-400 font-medium">Veo Video Oluşturuyor...</p>
                         </div>
                      ) : result.error ? (
                         <div className="text-center p-4 flex flex-col items-center">
                            <AlertCircle className="w-8 h-8 text-yellow-500/50 mb-2" />
                            <p className="text-xs text-yellow-500/70 text-center font-medium">Video Oluşturulamadı</p>
                            <p className="text-[10px] text-slate-500 mt-2 max-w-[150px] leading-tight opacity-70">
                              {result.error.length > 80 ? result.error.substring(0, 80) + '...' : result.error}
                            </p>
                         </div>
                      ) : (
                         <div className="text-center text-slate-600">
                           <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
                         </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // Loading State for Image (Overall Item)
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  {result.status === 'failed' ? (
                     <>
                      <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                      <p className="text-red-400 text-sm">Hata: {result.error}</p>
                     </>
                  ) : (
                    <>
                      <div className="relative w-16 h-16 mb-3">
                         <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                         <div 
                           className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"
                         ></div>
                         <div className="absolute inset-0 flex items-center justify-center font-bold text-slate-300">
                           {result.progress || 0}%
                         </div>
                      </div>
                      <p className="animate-pulse text-blue-400">Görsel Oluşturuluyor...</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-900 border-t border-slate-700 flex flex-col gap-3 flex-grow justify-end">
               {/* Action Buttons */}
               <div className="flex gap-2">
                  {result.imageUrl && (
                    <button 
                      onClick={() => result.imageUrl && handleDownload(result.imageUrl, `reklam-gorsel-${result.id}${getExtension(result.imageUrl)}`)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-700 hover:border-slate-500"
                    >
                      <Download className="w-3 h-3" /> Resmi İndir
                    </button>
                  )}
                  
                  {result.videoUrl && (
                    <button 
                      onClick={() => result.videoUrl && handleDownload(result.videoUrl, `reklam-video-${result.id}.mp4`)}
                      className="flex-1 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors border border-purple-500/20 hover:border-purple-500/40"
                    >
                      <Video className="w-3 h-3" /> Videoyu İndir
                    </button>
                  )}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsGallery;