import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface Step3ProcessingProps {
  onProcessingComplete: () => void;
}

const processingSteps = [
  { id: "ocr", label: "Running OCR & Text Extraction", time: 2000 },
  { id: "tables", label: "Extracting Tables & Annexures", time: 2500 },
  { id: "maps", label: "Detecting Maps & Coordinates", time: 2000 },
  { id: "classification", label: "Classifying Data into Portal Modules", time: 3000 },
];

export default function Step3Processing({ onProcessingComplete }: Step3ProcessingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    let progressInterval: ReturnType<typeof setInterval>;
    
    if (currentStepIndex < processingSteps.length) {
      const step = processingSteps[currentStepIndex];
      const stepStartTime = Date.now();
      
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - stepStartTime;
        const stepProgress = Math.min(elapsed / step.time, 1);
        
        // Calculate overall progress based on steps
        const completedStepsProgress = (currentStepIndex / processingSteps.length) * 100;
        const currentStepContribution = (stepProgress * (1 / processingSteps.length)) * 100;
        
        setOverallProgress(Math.min(completedStepsProgress + currentStepContribution, 100));

        if (stepProgress >= 1) {
          clearInterval(progressInterval);
          setCurrentStepIndex(prev => prev + 1);
        }
      }, 50);
    } else {
      setOverallProgress(100);
      const finishTimeout = setTimeout(() => {
        onProcessingComplete();
      }, 1000);
      return () => clearTimeout(finishTimeout);
    }

    return () => clearInterval(progressInterval);
  }, [currentStepIndex, onProcessingComplete]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="mb-8 inline-flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
        <Sparkles size={48} className="animate-pulse" />
      </div>
      
      <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">AI Document Parser</h2>
      <p className="mb-12 text-lg text-slate-600 dark:text-slate-400">
        Extracting and structuring data from your DSR document...
      </p>

      <div className="mx-auto mb-10 max-w-md text-left">
        <div className="space-y-6">
          {processingSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="text-emerald-500" size={28} />
                  ) : isCurrent ? (
                    <Loader2 className="animate-spin text-blue-500" size={28} />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-700" />
                  )}
                </div>
                <span className={`text-lg font-medium transition-colors ${
                  isCompleted ? "text-slate-900 dark:text-white" :
                  isCurrent ? "text-blue-600 dark:text-blue-400" :
                  "text-slate-400 dark:text-slate-600"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-md">
        <div className="mb-2 flex justify-between text-sm font-semibold">
          <span className="text-slate-700 dark:text-slate-300">Overall Progress</span>
          <span className="text-blue-600 dark:text-blue-400">{Math.floor(overallProgress)}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full bg-blue-600 transition-all duration-300 ease-out dark:bg-blue-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
