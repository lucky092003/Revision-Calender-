import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { LockIcon, MailIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { extractErrorMessage } from "@/lib/api";

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError("Please enter your email/username and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login({ identifier: identifier.trim(), password });
      toast("Welcome back!", "success");
      navigate("/", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Welcome back</p>
      <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">
        Log in to your account
      </h2>
      <p className="mt-1.5 text-sm text-slate-500">
        Pick up right where you left off in your revision plan.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label="Email or username"
          type="text"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="you@example.com"
          icon={<MailIcon width={16} height={16} />}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          icon={<LockIcon width={16} height={16} />}
        />

        <div className="flex items-center justify-end">
          <a href="#" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            Forgot password?
          </a>
        </div>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New here?{" "}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Create a free account
        </Link>
      </p>
    </AuthLayout>
  );
}