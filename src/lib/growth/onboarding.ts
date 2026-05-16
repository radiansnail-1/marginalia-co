export type OnboardingAnswers = {
  avoid?: string;
  intent?: string;
  trustBook?: string;
};

export function cleanOnboardingAnswers(answers: OnboardingAnswers): Required<OnboardingAnswers> {
  return {
    intent: answers.intent?.trim().slice(0, 80) || "Sharper",
    avoid: answers.avoid?.trim().slice(0, 120) || "Plot without consequence",
    trustBook: answers.trustBook?.trim().slice(0, 120) || "The Dispossessed",
  };
}
