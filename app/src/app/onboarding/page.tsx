import { listBanks } from "@/lib/felicity/client";
import { LogoMark } from "@/components/logo";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  let banks: { code: string; name: string }[] = [];
  try {
    banks = (await listBanks()).banks;
  } catch {
    banks = [];
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark size={40} />
          <div>
            <h1 className="text-xl">Set up your Zapeet account</h1>
            <p className="mt-1.5 text-sm text-ink-60">
              Add the bank account you want to get paid into. When a customer pays, your money goes straight
              there — no wallet, no withdrawals.
            </p>
          </div>
        </div>

        <OnboardingForm banks={banks} />
      </div>
    </div>
  );
}
