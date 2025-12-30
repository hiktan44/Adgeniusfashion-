import React, { useState, useCallback } from 'react';
import { FormData, AppStep, ProductAnalysis, GenerationResult } from './types';
import UploadForm from './components/UploadForm';
import ProcessingStep from './components/ProcessingStep';
import ResultsGallery from './components/ResultsGallery';
import { analyzeProductImage, generateAdPrompts, generateAdImage, generateAdVideo, ensureApiKey, fileToGoogleGenAIBase64 } from './services/geminiService';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('upload');
  const [formData, setFormData] = useState<FormData>({
    productImage: null,
    optionalImage: null, 
    productName: '',
    brand: '',
    customPrompt: '', 
    adStyle: 'Lüks ve Premium',
    imageModel: 'gemini-3-pro-image-preview',
    videoModel: 'veo-3.1-fast-generate-preview',
    mode: 'campaign',
    includeVideo: false, 
    aspectRatio: '1:1', // Default to Square
    campaignStyleCount: 4,
    ecommercePhotoCount: 8, // Increased default to 8 to include Artistic & Lifestyle poses
    ecommerceColorVariations: '',
    ecommercePatternImage: null,
    renderTextOnImage: false,
    imageOverlayText: ''
  });
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!formData.productImage) return;

    setError(null);
    setStep('analyzing');

    try {
      // 0. Ensure API Key
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        throw new Error("Devam etmek için API anahtarı seçimi gereklidir.");
      }

      // Convert images to base64
      const originalImageB64 = await fileToGoogleGenAIBase64(formData.productImage);
      
      // Convert optional image if exists
      let optionalImageB64: string | null = null;
      if (formData.optionalImage) {
        optionalImageB64 = await fileToGoogleGenAIBase64(formData.optionalImage);
      }

      // Convert pattern image if exists
      let patternImageB64: string | null = null;
      if (formData.ecommercePatternImage) {
        patternImageB64 = await fileToGoogleGenAIBase64(formData.ecommercePatternImage);
      }

      // 1. Analyze
      const analysisResult = await analyzeProductImage(formData.productImage);
      setAnalysis(analysisResult);

      // 2. Generate Prompts locally
      const prompts = generateAdPrompts(analysisResult, formData);
      
      // Initialize Results State
      const initialResults: GenerationResult[] = prompts.map(p => ({
        id: p.id,
        type: p.type,
        prompt: p.text,
        status: 'pending',
        progress: 0
      }));
      setResults(initialResults);
      setStep('generating');

      // 3. Process each prompt
      const updateResult = (id: number, update: Partial<GenerationResult>) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, ...update } : r));
      };

      const processItem = async (item: GenerationResult) => {
        // Simulate progress for Image Generation (since API doesn't stream progress for single images)
        const progressInterval = setInterval(() => {
          setResults(prev => {
            const current = prev.find(r => r.id === item.id);
            if (!current || current.status !== 'generating_image') return prev;
            
            // Increment until 45% then wait for completion
            const nextProgress = Math.min((current.progress || 0) + 2, 45);
            return prev.map(r => r.id === item.id ? { ...r, progress: nextProgress } : r);
          });
        }, 500);

        try {
          // Determine Aspect Ratios
          // Use user selected ratio for Images
          const imgAspectRatio = formData.aspectRatio;

          // Determine Video Ratio (Veo strictly supports 16:9 or 9:16)
          // Map user selection to closest Veo supported format
          let vidAspectRatio = '16:9';
          if (imgAspectRatio === '9:16' || imgAspectRatio === '3:4' || imgAspectRatio === '1:1') {
             // For Square, Portrait and Tall, use Portrait Video
             vidAspectRatio = '9:16';
          } else {
             // For Landscape (16:9, 4:3), use Landscape Video
             vidAspectRatio = '16:9';
          }

          // A. Generate Image
          updateResult(item.id, { status: 'generating_image', progress: 5 });
          
          if (!formData.productImage) throw new Error("Ana resim eksik");

          // Pass the optional image and pattern image to the generator
          const base64Image = await generateAdImage(
            item.prompt, 
            originalImageB64, 
            formData.productImage.type, // Pass main image mime type
            optionalImageB64, 
            formData.optionalImage?.type || null, // Pass optional image mime type
            formData.imageModel, 
            imgAspectRatio,
            patternImageB64,
            formData.ecommercePatternImage?.type || null
          );
          
          clearInterval(progressInterval);

          // B. Check if Video is requested
          if (formData.includeVideo) {
            updateResult(item.id, { 
              status: 'generating_video', 
              imageUrl: base64Image,
              progress: 50
            });

            try {
                // Generate Video (Veo)
                const videoUrl = await generateAdVideo(
                  base64Image, 
                  item.type, 
                  formData.videoModel, 
                  vidAspectRatio,
                  (vidProgress) => {
                    // Update progress during polling (50% -> 99%)
                    updateResult(item.id, { progress: vidProgress });
                  }
                );
                
                updateResult(item.id, { 
                  status: 'completed', 
                  videoUrl: videoUrl,
                  progress: 100
                });
            } catch (videoError: any) {
                console.warn(`Video generation failed for item ${item.id}, preserving image. Error:`, videoError);
                // Mark as completed but attach error message to show partial success
                updateResult(item.id, { 
                  status: 'completed', 
                  imageUrl: base64Image,
                  error: videoError.message,
                  progress: 100
                });
            }
          } else {
            // Image Only Mode
            updateResult(item.id, { 
              status: 'completed', 
              imageUrl: base64Image,
              progress: 100
            });
          }

        } catch (err: any) {
          clearInterval(progressInterval);
          console.error(`Error processing item ${item.id}`, err);
          updateResult(item.id, { 
            status: 'failed', 
            error: err.message || "Bilinmeyen bir hata oluştu.",
            progress: 0 
          });
        }
      };

      // Execute all in parallel
      await Promise.all(initialResults.map(processItem));
      
      setStep('results');

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
      setStep('upload');
    }
  }, [formData]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-950 pointer-events-none -z-10"></div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-white">AdGenius <span className="text-blue-400 font-light">AI</span></h1>
          </div>
          <div className="text-xs text-slate-500 font-mono hidden sm:block">
            Gelişmiş Yapay Zeka Teknolojisi
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-red-500"></div>
             {error}
          </div>
        )}

        {step === 'upload' ? (
          <div className="animate-fade-in-up">
            <UploadForm 
              formData={formData} 
              setFormData={setFormData} 
              onSubmit={handleSubmit}
              isSubmitting={false}
            />
          </div>
        ) : (
          <div className="animate-fade-in">
             <ProcessingStep step={step} analysis={analysis} results={results} />
             
             {/* Show Gallery while generating to see progress in real-time */}
             {(step === 'generating' || step === 'results') && (
               <ResultsGallery results={results} />
             )}

             {step === 'results' && (
                <div className="text-center mt-12">
                  <button 
                    onClick={() => {
                       setStep('upload');
                       setResults([]);
                       setAnalysis(null);
                       setFormData(prev => ({
                         ...prev, 
                         productImage: null,
                         optionalImage: null,
                         customPrompt: '',
                         // Reset new fields as well or keep them? Keeping them is better UX usually.
                         campaignStyleCount: 4,
                         ecommercePhotoCount: 8,
                         ecommerceColorVariations: '',
                         ecommercePatternImage: null,
                         renderTextOnImage: false,
                         imageOverlayText: ''
                       }));
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-full font-medium transition-colors border border-slate-600"
                  >
                    Yeni Kampanya Oluştur
                  </button>
                </div>
             )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-auto py-8 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} AdGenius AI. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
};

export default App;