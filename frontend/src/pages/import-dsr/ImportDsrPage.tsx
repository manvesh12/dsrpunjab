import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Step1Options from "./components/Step1Options";
import Step2Upload from "./components/Step2Upload";
import Step3Processing from "./components/Step3Processing";
import Step4Summary from "./components/Step4Summary";
import Step5Review from "./components/Step5Review";
import NextStepDialog from "./components/NextStepDialog";

export default function ImportDsrPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showNextStepDialog, setShowNextStepDialog] = useState(false);

  const handleSelectOption = (option: "upload" | "skip") => {
    if (option === "upload") {
      setCurrentStep(2);
    } else {
      navigate("/projects/create");
    }
  };

  const handleUploadComplete = () => {
    setCurrentStep(3);
  };

  const handleProcessingComplete = () => {
    setCurrentStep(4);
  };

  const handleContinueToReview = () => {
    setCurrentStep(5);
  };

  const handleImportComplete = () => {
    // Show final dialog instead of navigating immediately
    setShowNextStepDialog(true);
  };

  const handleReviewImportedData = () => {
    setShowNextStepDialog(false);
    navigate("/projects/create"); // In a real app, navigate to a specific review flow
  };

  const handleReplacePdf = () => {
    setShowNextStepDialog(false);
    setCurrentStep(2);
  };

  const handleCancelImport = () => {
    setShowNextStepDialog(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {currentStep === 1 && <Step1Options onSelectOption={handleSelectOption} />}
      {currentStep === 2 && <Step2Upload onUploadComplete={handleUploadComplete} onCancel={() => setCurrentStep(1)} />}
      {currentStep === 3 && <Step3Processing onProcessingComplete={handleProcessingComplete} />}
      {currentStep === 4 && <Step4Summary onContinueToReview={handleContinueToReview} />}
      {currentStep === 5 && <Step5Review onImportComplete={handleImportComplete} />}

      {showNextStepDialog && (
        <NextStepDialog
          onReview={handleReviewImportedData}
          onReplace={handleReplacePdf}
          onCancel={handleCancelImport}
        />
      )}
    </div>
  );
}
