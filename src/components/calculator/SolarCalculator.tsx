import { useState } from "react";
import { ChevronRight, ChevronLeft, Home, Zap, Sun, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CalculatorState,
  HousingType,
  DEFAULT_APPLIANCES,
  HOUSING_BASE_CONSUMPTION,
  calculateDailyConsumption,
  calculateRequiredPower,
  findBestKit,
  calculateMonthlyConsumption,
  CALCULATOR_CONSTANTS,
} from "@/lib/calculator";
import Step1Housing from "./Step1Housing";
import Step2Appliances from "./Step2Appliances";
import Step3SunHours from "./Step3SunHours";
import Step4Results from "./Step4Results";

type Step = 1 | 2 | 3 | 4;

export default function SolarCalculator() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [state, setState] = useState<CalculatorState>({
    housingType: null,
    appliances: [],
    sunHours: CALCULATOR_CONSTANTS.AVERAGE_SUN_HOURS,
  });

  const handleHousingSelect = (type: HousingType) => {
    setState((prev) => ({ ...prev, housingType: type }));
  };

  const handleAddAppliance = (applianceKey: string) => {
    const applianceTemplate = DEFAULT_APPLIANCES[applianceKey];
    if (!applianceTemplate) return;

    const newAppliance = {
      id: `${applianceKey}-${Date.now()}`,
      ...applianceTemplate,
    };

    setState((prev) => ({
      ...prev,
      appliances: [...prev.appliances, newAppliance],
    }));
  };

  const handleUpdateAppliance = (id: string, updates: any) => {
    setState((prev) => ({
      ...prev,
      appliances: prev.appliances.map((app) =>
        app.id === id ? { ...app, ...updates } : app
      ),
    }));
  };

  const handleRemoveAppliance = (id: string) => {
    setState((prev) => ({
      ...prev,
      appliances: prev.appliances.filter((app) => app.id !== id),
    }));
  };

  const handleSunHoursChange = (hours: number) => {
    setState((prev) => ({ ...prev, sunHours: hours }));
  };

  const handleReset = () => {
    setState({
      housingType: null,
      appliances: [],
      sunHours: CALCULATOR_CONSTANTS.AVERAGE_SUN_HOURS,
    });
    setCurrentStep(1);
  };

  const canProceedToNextStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return state.housingType !== null;
      case 2:
        return state.appliances.length > 0;
      case 3:
        return state.sunHours > 0;
      default:
        return true;
    }
  };

  const dailyConsumption = state.housingType
    ? calculateDailyConsumption(state.housingType, state.appliances)
    : 0;

  const monthlyConsumption = calculateMonthlyConsumption(dailyConsumption);
  const requiredPower = calculateRequiredPower(dailyConsumption, state.sunHours);
  const recommendedKit = findBestKit(dailyConsumption);

  return (
    <section className="py-16 lg:py-24 bg-slate-950 text-white border-t border-slate-800 font-sans">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-4">
            <Zap className="w-12 h-12 text-cyan-400 mx-auto" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-black text-orange-500 mb-3 tracking-tight">
            Calculadora Solar Inteligente
          </h2>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto font-medium">
            Descubre el sistema solar perfecto para tus necesidades energéticas.
            Calcula tu consumo en 4 pasos sencillos.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex justify-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all ${
                step <= currentStep ? "bg-cyan-400 w-12" : "bg-slate-800 w-8"
              }`}
            />
          ))}
        </div>

        {/* Calculator Card */}
        <Card className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12 shadow-2xl bg-slate-900 border-slate-800 text-white rounded-3xl">
          {/* Step 1: Housing */}
          {currentStep === 1 && (
            <Step1Housing
              selected={state.housingType}
              onSelect={handleHousingSelect}
            />
          )}

          {/* Step 2: Appliances */}
          {currentStep === 2 && (
            <Step2Appliances
              appliances={state.appliances}
              onAdd={handleAddAppliance}
              onUpdate={handleUpdateAppliance}
              onRemove={handleRemoveAppliance}
              dailyConsumption={dailyConsumption}
            />
          )}

          {/* Step 3: Sun Hours */}
          {currentStep === 3 && (
            <Step3SunHours
              sunHours={state.sunHours}
              onChange={handleSunHoursChange}
            />
          )}

          {/* Step 4: Results */}
          {currentStep === 4 && (
            <Step4Results
              dailyConsumption={dailyConsumption}
              monthlyConsumption={monthlyConsumption}
              requiredPower={requiredPower}
              recommendedKit={recommendedKit}
              sunHours={state.sunHours}
              onReset={handleReset}
            />
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 md:mt-12 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as Step)}
              disabled={currentStep === 1}
              variant="outline"
              className="gap-2 w-full sm:w-auto order-3 sm:order-1 py-6 sm:py-2 text-base sm:text-sm"
            >
              <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
              Atrás
            </Button>

            <div className="text-sm text-muted-foreground order-1 sm:order-2 font-accent bg-muted/50 px-4 py-2 rounded-full">
              Paso {currentStep} de 4
            </div>

            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1) as Step)}
                disabled={!canProceedToNextStep()}
                className="gap-2 bg-secondary hover:bg-secondary/90 w-full sm:w-auto order-2 sm:order-3 py-6 sm:py-2 text-base sm:text-sm"
              >
                Siguiente
                <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
              </Button>
            ) : (
              <div className="w-full sm:w-auto order-2 sm:order-3" />
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
