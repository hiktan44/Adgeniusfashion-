import React, { useState, useEffect } from 'react';
import { AppStep, ProductAnalysis, GenerationResult } from '../types';
import { Loader2, BrainCircuit, Image as ImageIcon, Video, CheckCircle, Copy, Check, ShoppingBag, FileText, Tag } from 'lucide-react';

interface Props {
  step: AppStep;
  analysis: ProductAnalysis | null;
  results?: GenerationResult[];
}

const ProcessingStep: React.FC<Props> = ({ step, analysis, results }) => {
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  const steps = [
    { id: 'analyzing', label: 'Ürün Analizi', icon: BrainCircuit },
    { id: 'generating', label: 'Görsel & Video Üretimi', icon: ImageIcon },
    { id: 'results', label: 'Tamamlandı', icon: CheckCircle },
  ];

  const currentIdx = steps.findIndex(s => s.id === (step === 'generating' ? 'generating' : step === 'analyzing' ? 'analyzing' : 'results'));

  // Calculate dynamic progress based on item states
  useEffect(() => {
    let targetProgress = 0;

    if (step === 'upload') targetProgress = 0;
    else if (step === 'analyzing') targetProgress = 15;
    else if (step === 'results') targetProgress = 100;
    else if (step === 'generating') {
      // Base progress for starting generation
      const base = 25;
      
      if (!results || results.length === 0) {
        targetProgress = base;
      } else {
        // Calculate average progress of all items
        let totalItemProgress = 0;
        
        results.forEach(r => {
          if (r.status === 'completed' || r.status === 'failed') {
            totalItemProgress += 100;
          } else if (r.status === 'generating_video') {
            // Image is done (approx 40% of effort), Video is generating
            totalItemProgress += 60; 
          } else if (r.status === 'generating_image') {
            // Just started
            totalItemProgress += 10;
          } else {
            // Pending
            totalItemProgress += 0;
          }
        });

        const avgProgress = totalItemProgress / results.length;
        // Map the 0-100 item progress to the remaining 75% of the bar (25% to 100%)
        targetProgress = base + (avgProgress * 0.75);
      }
    }

    setProgress(targetProgress);
  }, [step, results]);

  const handleCopy = () => {
    if (!analysis) return;
    const textToCopy = `
${analysis.eticaret_baslik}

${analysis.eticaret_aciklama}

Ürün Özellikleri:
${analysis.eticaret_ozellikler.map(f => `• ${f}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-12">
      {/* Progress Bar */}
      <div className="flex justify-between items-center relative mb-8">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -z-10 rounded-full"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-blue-500 -z-10 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
        
        {steps.map((s, idx) => {
          const isActive = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-slate-900 px-2 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isActive 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/40' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}>
                {isCurrent && step !== 'results' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <s.icon className="w-5 h-5" />
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-blue-400' : 'text-slate-600'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Analysis Details Card */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          
          {/* Left Column: Visual Data */}
          <div className="lg:col-span-1 space-y-4">
             <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 h-full">
                <div className="flex items-center gap-2 mb-4 text-purple-400">
                  <BrainCircuit className="w-5 h-5" />
                  <h3 className="font-semibold">Teknik Veriler</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                      <span className="text-slate-500 text-xs uppercase tracking-wider font-bold block mb-1">Kategori & Stil</span>
                      <div className="text-slate-200 text-sm">{analysis.urun_kategorisi} • {analysis.stil}</div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                      <span className="text-slate-500 text-xs uppercase tracking-wider font-bold block mb-1">Materyal</span>
                      <div className="text-slate-200 text-sm">{analysis.malzeme}</div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                      <span className="text-slate-500 text-xs uppercase tracking-wider font-bold block mb-1">Renk Analizi</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded text-xs border border-blue-500/20">{analysis.ana_renk}</span>
                        {analysis.ikincil_renkler.map((c, i) => (
                           <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{c}</span>
                        ))}
                      </div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                      <span className="text-slate-500 text-xs uppercase tracking-wider font-bold block mb-1">Hedef Kitle</span>
                      <div className="text-slate-200 text-sm">{analysis.hedef_kitle}</div>
                  </div>
                </div>
             </div>
          </div>

          {/* Right Column: E-Commerce Listing Text */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 relative overflow-hidden h-full flex flex-col">
               {/* Header with Copy Button */}
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2 text-green-400">
                    <ShoppingBag className="w-5 h-5" />
                    <h3 className="font-semibold">Hazır E-Ticaret İçeriği</h3>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      copied 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600'
                    }`}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Kopyalandı!' : 'Metni Kopyala'}
                  </button>
               </div>

               {/* Generated Content Preview */}
               <div className="space-y-5 text-sm flex-grow">
                  {/* Title */}
                  <div>
                    <span className="text-slate-500 text-xs uppercase font-bold mb-1 block">Ürün Başlığı</span>
                    <h4 className="text-lg font-bold text-white leading-tight">{analysis.eticaret_baslik || analysis.urun_adi}</h4>
                  </div>

                  {/* Description */}
                  <div>
                    <span className="text-slate-500 text-xs uppercase font-bold mb-1 block flex items-center gap-1"><FileText className="w-3 h-3"/> Açıklama</span>
                    <p className="text-slate-300 leading-relaxed">
                      {analysis.eticaret_aciklama || "Açıklama hazırlanıyor..."}
                    </p>
                  </div>

                  {/* Bullet Points */}
                  <div>
                    <span className="text-slate-500 text-xs uppercase font-bold mb-2 block flex items-center gap-1"><Tag className="w-3 h-3"/> Öne Çıkan Özellikler</span>
                    <ul className="space-y-2">
                      {(analysis.eticaret_ozellikler || analysis.ozellikler).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-300">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                           <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
               </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ProcessingStep;