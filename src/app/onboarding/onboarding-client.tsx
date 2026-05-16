"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  finishOnboarding,
  markPlusPromptSeen,
  markRatingPromptClaimed,
  markReferralPromptSeen,
  type OnboardingAnswers,
} from "./actions";
import { referralShareText } from "@/lib/growth/referrals";
import { Letter } from "@/components/letter";
import { Owl } from "@/components/owl";

type Step = "intent" | "avoid" | "result" | "guide" | "plus" | "invite" | "rating";

type Props = {
  displayName: string;
  inviteLink: string;
  playStoreUrl: string;
  referralCode: string;
  referralCount: number;
};

const intents = [
  ["Sharper", "More ideas, better judgment, fewer shallow tabs."],
  ["Steadier", "Books that make life feel less noisy."],
  ["Stranger", "Fiction, myth, magic, worlds with weather."],
  ["Braver", "Stories that move me into action."],
] as const;

const avoidances = [
  ["400 pages of vague advice", "Big promise, padded middle."],
  ["Plot without consequence", "Things happen, nobody changes."],
  ["Over-neat productivity", "Every life problem becomes a checklist."],
  ["Academic fog", "Precise words, no pulse."],
] as const;

const stepIndex: Record<Step, number> = {
  intent: 1,
  avoid: 2,
  result: 3,
  guide: 4,
  plus: 5,
  invite: 6,
  rating: 7,
};

function MiniIcon({ kind }: { kind: "check" | "lock" | "book" | "star" }) {
  const common = {
    "aria-hidden": true,
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };
  if (kind === "check") {
    return (
      <svg {...common}>
        <path d="M5 12.5 9.2 17 19 7" />
      </svg>
    );
  }
  if (kind === "lock") {
    return (
      <svg {...common}>
        <rect x="5" y="10" width="14" height="10" rx="1.5" />
        <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      </svg>
    );
  }
  if (kind === "book") {
    return (
      <svg {...common}>
        <path d="M5 5.5C7 4.5 9.6 4.5 12 5.7v13C9.6 17.5 7 17.5 5 18.5v-13Z" />
        <path d="M19 5.5c-2-1-4.6-1-7 .2v13c2.4-1.2 5-1.2 7-.2v-13Z" />
        <path d="M12 5.7v13" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="currentColor" strokeWidth={1.1}>
      <path d="m12 3 2.6 5.7 6.2.7-4.6 4.2 1.2 6.1L12 16.6l-5.4 3.1 1.2-6.1-4.6-4.2 6.2-.7L12 3Z" />
    </svg>
  );
}

function Progress({ step }: { step: Step }) {
  const current = stepIndex[step];
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 7 }, (_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full ${i < current ? "bg-brass-bright" : "bg-brass/20"}`}
        />
      ))}
    </div>
  );
}

function Choice({
  active,
  detail,
  label,
  onClick,
}: {
  active: boolean;
  detail: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap flex min-h-[62px] w-full items-center justify-between gap-4 rounded-md border px-4 py-3 text-left shadow-[0_8px_22px_rgba(0,0,0,0.18)] ${
        active ? "border-brass-bright bg-brass-bright/15" : "border-brass/30 bg-mahogany-2/70"
      }`}
    >
      <span>
        <span className="block font-display text-lg leading-none text-parchment">{label}</span>
        <span className="mt-1 block text-xs leading-snug text-parchment-dim">{detail}</span>
      </span>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-brass/60 text-brass-bright">
        {active ? <MiniIcon kind="check" /> : null}
      </span>
    </button>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="tap w-full rounded-md bg-brass-bright px-4 py-4 font-display text-[12px] font-semibold uppercase tracking-[0.22em] text-mahogany shadow-[0_10px_28px_rgba(0,0,0,0.45)] disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="tap w-full rounded-md border border-brass bg-mahogany-2/35 px-4 py-3 font-display text-[11px] font-semibold uppercase tracking-[0.20em] text-brass-bright disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function PageShell({
  children,
  step,
}: {
  children: React.ReactNode;
  step: Step;
}) {
  return (
    <div className="room-vignette relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-mahogany px-6 pb-8 pt-14">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(216,176,106,0.12),transparent_40%),linear-gradient(180deg,var(--color-mahogany-2),var(--color-mahogany),var(--color-ink))]" />
      <Owl className="absolute -right-2 top-6 z-[1] h-20 w-16 opacity-35" />
      <div className="relative z-10">
        <div className="mb-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="font-display text-[20px] font-medium uppercase tracking-[4px] text-cream">
              Marginalia <i className="text-brass-bright">&amp;</i> Co.
            </div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-parchment-dim">
              {stepIndex[step]} / 7
            </div>
          </div>
          <Progress step={step} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function OnboardingClient({
  displayName,
  inviteLink,
  playStoreUrl,
  referralCode,
  referralCount,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intent");
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    avoid: "Plot without consequence",
    intent: "Sharper",
    trustBook: "The Dispossessed",
  });
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const shareText = useMemo(() => referralShareText(referralCode), [referralCode]);

  function updateAnswer(key: keyof OnboardingAnswers, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function finish(after?: () => Promise<unknown>) {
    setMessage("");
    startTransition(async () => {
      if (after) await after();
      const result = await finishOnboarding(answers);
      if (!result.ok) {
        setMessage(
          "message" in result && typeof result.message === "string"
            ? result.message
            : "Could not finish onboarding. Try again.",
        );
        return;
      }
      router.push("/home");
      router.refresh();
    });
  }

  function showPlus() {
    startTransition(async () => {
      await markPlusPromptSeen();
      setStep("plus");
    });
  }

  function showInvite() {
    startTransition(async () => {
      await markReferralPromptSeen();
      setStep("invite");
    });
  }

  async function copyInvite() {
    await markReferralPromptSeen();
    const text = `${shareText} ${inviteLink}`;
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Invite copied.");
    } catch {
      setMessage(text);
    }
  }

  if (step === "intent") {
    return (
      <PageShell step={step}>
        <h1 className="font-display text-5xl leading-[0.98] text-parchment">
          Welcome, <em className="text-brass-bright">{displayName}</em>.
        </h1>
        <p className="mt-3 font-display text-lg italic leading-snug text-parchment-dim">
          What should your shelf help you become?
        </p>
        <div className="mt-8 grid gap-3">
          {intents.map(([label, detail]) => (
            <Choice
              key={label}
              active={answers.intent === label}
              detail={detail}
              label={label}
              onClick={() => updateAnswer("intent", label)}
            />
          ))}
        </div>
        <div className="mt-8">
          <PrimaryButton disabled={isPending} onClick={() => setStep("avoid")}>Continue</PrimaryButton>
        </div>
      </PageShell>
    );
  }

  if (step === "avoid") {
    return (
      <PageShell step={step}>
        <h1 className="font-display text-5xl leading-[0.98] text-parchment">
          Which one would you <em className="text-brass-bright">abandon</em> first?
        </h1>
        <p className="mt-3 font-display text-lg italic leading-snug text-parchment-dim">
          A useful shelf knows what not to hand you.
        </p>
        <div className="mt-8 grid gap-3">
          {avoidances.map(([label, detail]) => (
            <Choice
              key={label}
              active={answers.avoid === label}
              detail={detail}
              label={label}
              onClick={() => updateAnswer("avoid", label)}
            />
          ))}
        </div>
        <div className="mt-8">
          <PrimaryButton disabled={isPending} onClick={() => setStep("result")}>Prepare my note</PrimaryButton>
        </div>
      </PageShell>
    );
  }

  if (step === "result") {
    return (
      <PageShell step={step}>
        <h1 className="font-display text-5xl leading-[0.98] text-parchment">
          Your first note from the <em className="text-brass-bright">Librarian.</em>
        </h1>
        <div className="parchment mt-8 p-5 shadow-2xl">
          <div className="font-body text-[10px] font-semibold uppercase tracking-[0.24em] text-mahogany-light">
            First recommendation
          </div>
          <h2 className="mt-2 font-display text-3xl font-semibold leading-none text-mahogany">
            The Dispossessed
          </h2>
          <p className="mt-3 font-display text-lg italic leading-snug text-mahogany/75">
            For a sharper shelf that still wants a beating heart: political ideas disguised as a human story.
          </p>
        </div>
        <div className="mt-8 grid gap-3">
          <PrimaryButton disabled={isPending} onClick={() => setStep("guide")}>View my guide</PrimaryButton>
          <SecondaryButton disabled={isPending} onClick={() => setStep("rating")}>Enter with the free room</SecondaryButton>
        </div>
      </PageShell>
    );
  }

  if (step === "guide") {
    return (
      <PageShell step={step}>
        <h1 className="font-display text-5xl leading-[0.98] text-parchment">
          Your Reading <em className="text-brass-bright">Guide</em>
        </h1>
        <p className="mt-3 font-display text-lg italic leading-snug text-parchment-dim">
          Unlock the detailed steps behind your first shelf.
        </p>
        <div className="mt-7 grid gap-3">
          {["First shelf", "Reading order", "What to avoid", "Next note"].map((label, index) => (
            <div key={label} className="grid min-h-[62px] grid-cols-[32px_1fr_28px] items-center gap-3 rounded-md border border-brass/20 bg-parchment/10 px-4 py-3 shadow-[0_8px_22px_rgba(0,0,0,0.16)]">
              <div className="text-2xl text-parchment-dim">{index + 1}</div>
              <div>
                <div className="font-display text-xl text-parchment">{label}</div>
                <div className="text-xs text-parchment-dim">Reserved for Marginalia Plus</div>
              </div>
              <div className="grid h-7 w-7 place-items-center rounded-full bg-brass/10 text-brass-bright">
                <MiniIcon kind="lock" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-7 grid gap-3">
          <PrimaryButton disabled={isPending} onClick={showPlus}>View Plus</PrimaryButton>
          <SecondaryButton disabled={isPending} onClick={showInvite}>Invite 3 readers</SecondaryButton>
        </div>
      </PageShell>
    );
  }

  if (step === "plus") {
    return (
      <PageShell step={step}>
        <h1 className="font-display text-5xl leading-[0.98] text-parchment">
          Unlock the whole <em className="text-brass-bright">reading room.</em>
        </h1>
        <p className="mt-3 font-display text-lg italic leading-snug text-parchment-dim">
          Unlimited Librarian notes, share cards, reading letters, and deeper shelf memory.
        </p>
        <div className="mt-7 grid grid-cols-3 gap-2">
          {[
            ["Monthly", "$4.99", "Best to start"],
            ["Yearly", "$39.99", "$3.33 / mo"],
            ["Lifetime", "$79.99", "Early patron"],
          ].map(([label, price, detail], index) => (
            <button
              key={label}
              type="button"
              className={`tap min-h-[116px] rounded-md border p-2 text-center shadow-[0_8px_22px_rgba(0,0,0,0.18)] ${index === 0 ? "border-brass-bright bg-brass-bright/15" : "border-brass/35 bg-ink/25"}`}
            >
              <strong className="block font-display text-lg leading-none text-parchment">{label}</strong>
              <span className="mt-3 block text-sm font-semibold text-brass-bright">{price}</span>
              <span className="mt-2 block text-[9px] leading-snug text-parchment-dim">{detail}</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-parchment-dim">
          Uses Google Play Billing in the Play app. Purchase wiring is not enabled in this build.
        </p>
        <div className="mt-7 grid gap-3">
          <PrimaryButton disabled={isPending} onClick={showInvite}>Invite 3 readers</PrimaryButton>
          <SecondaryButton disabled={isPending} onClick={() => setStep("rating")}>Continue with the free room</SecondaryButton>
        </div>
      </PageShell>
    );
  }

  if (step === "invite") {
    return (
      <PageShell step={step}>
        <h1 className="font-display text-5xl leading-[0.98] text-parchment">
          Share your <em className="text-brass-bright">invite code.</em>
        </h1>
        <p className="mt-3 font-display text-lg italic leading-snug text-parchment-dim">
          Invite 3 readers to unlock your first month of Plus.
        </p>
        <div className="mt-8 rounded-md border border-moonlight/35 bg-ink/35 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brass-bright">
            Your room code
          </div>
          <div className="mt-4 rounded-md border border-dashed border-brass/70 bg-mahogany-2/50 p-4 text-center text-xl font-semibold tracking-[0.18em] text-parchment">
            {referralCode}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`rounded-md border p-3 text-center ${i < referralCount ? "border-brass-bright bg-brass-bright/15" : "border-brass/30 bg-ink/20"}`}
              >
                <div className="font-display text-2xl text-brass-bright">{i + 1}</div>
                <div className="text-[8px] uppercase tracking-[0.18em] text-parchment-dim">
                  {i < referralCount ? "Joined" : "Waiting"}
                </div>
              </div>
            ))}
          </div>
        </div>
        {message && <p className="mt-4 break-words text-center text-sm text-brass-bright">{message}</p>}
        <div className="mt-7 grid gap-3">
          <PrimaryButton disabled={isPending} onClick={() => startTransition(copyInvite)}>Copy invite</PrimaryButton>
          <SecondaryButton disabled={isPending} onClick={() => setStep("rating")}>Skip and enter my room</SecondaryButton>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell step={step}>
      <h1 className="text-center font-display text-5xl leading-[0.98] text-parchment">
        Leave a <em className="text-brass-bright">rating?</em>
      </h1>
      <p className="mx-auto mt-4 max-w-xs text-center font-display text-lg italic leading-snug text-parchment-dim">
        We are a small reading room. A Play Store rating helps other readers find the door.
      </p>
      <div className="relative mx-auto mt-10 h-52 w-52">
        <Letter className="absolute left-1/2 top-1/2 h-24 w-36 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)]" />
        <div className="absolute inset-0 rounded-full border border-brass/30 bg-brass-bright/10 shadow-[0_0_50px_rgba(216,176,106,0.15)]" />
        <div className="absolute inset-x-0 top-5 flex justify-center gap-1 text-brass-bright">
          {Array.from({ length: 5 }, (_, i) => (
            <MiniIcon key={i} kind="star" />
          ))}
        </div>
        <div>
          <div className="absolute inset-x-0 bottom-7 text-center font-caveat text-3xl text-brass-bright">
            thank you
          </div>
        </div>
      </div>
      {message && <p className="mt-4 text-center text-sm text-sconce">{message}</p>}
      <div className="mt-auto grid gap-3 pt-10">
        <PrimaryButton
          disabled={isPending}
          onClick={() => {
            window.open(playStoreUrl, "_blank", "noopener,noreferrer");
          }}
        >
          Rate Marginalia
        </PrimaryButton>
        <button
          type="button"
          disabled={isPending}
          onClick={() => finish(markRatingPromptClaimed)}
          className="tap text-center text-xs font-semibold text-parchment-dim underline underline-offset-4 disabled:opacity-60"
        >
          I rated!
        </button>
      </div>
    </PageShell>
  );
}
