import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminGuardProps {
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  onAuthorize: (password: string) => void;
}

export const AdminGuard = ({
  passwordInput,
  setPasswordInput,
  onAuthorize,
}: AdminGuardProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/20 blur-2xl" />
        <Lock className="relative h-20 w-20 text-red-500" />
      </div>
      <h1 className="mb-2 font-mono text-3xl font-black tracking-tighter text-white">
        SYSTEM RESTRICTED
      </h1>
      <p className="mb-8 max-w-sm text-neutral-500">
        This bridge requires high-level clearance. Please enter the decryption
        key to establish connection.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAuthorize(passwordInput);
        }}
        className="w-full max-w-xs space-y-4"
      >
        <div className="group relative">
          <div className="absolute -inset-0.5 rounded-lg bg-linear-to-r from-red-500 to-amber-500 opacity-20 blur transition group-focus-within:opacity-50" />
          <input
            type="password"
            placeholder="Enter Access Code..."
            className="relative w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-center font-mono tracking-widest text-white outline-hidden focus:border-red-500/50"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            autoFocus
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-red-600 font-bold text-white hover:bg-red-700 active:scale-95"
        >
          AUTHORIZE ACCESS
        </Button>
      </form>

      <p className="mt-12 text-[10px] tracking-[0.2em] text-neutral-700 uppercase">
        Authorization Protocol v2.0.4
      </p>
    </div>
  );
};
