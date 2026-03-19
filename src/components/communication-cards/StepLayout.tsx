import React from 'react';
import Stepper from './Stepper';

interface StepLayoutProps {
  heading: string | React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
  headerAction?: React.ReactNode;
}

export default function StepLayout({ heading, description, children, footer, currentStep, totalSteps, onBack, headerAction }: StepLayoutProps) {
  return (
    <div className="min-h-screen bg-midnight-black flex flex-col">
      <div className="flex flex-col px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          {currentStep !== undefined && totalSteps !== undefined && (
            <Stepper currentStep={currentStep} totalSteps={totalSteps} onBack={onBack} />
          )}

          <div className="flex items-center justify-between gap-4 mb-3">
            {typeof heading === 'string' ? (
              <>
                <h1 className="text-3xl sm:text-4xl font-bold text-off-white font-league-spartan">
                  {heading}
                </h1>
                {headerAction && (
                  <div className="flex-shrink-0">
                    {headerAction}
                  </div>
                )}
              </>
            ) : (
              <h1 className="text-3xl sm:text-4xl font-bold text-off-white font-league-spartan w-full">
                {heading}
              </h1>
            )}
          </div>
          {description && (
            <p className="text-lg text-off-white/80">{description}</p>
          )}
        </div>

        <div>
          {children}
        </div>

        {footer && (
          <div className="mt-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
