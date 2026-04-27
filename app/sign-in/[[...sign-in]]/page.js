"use client";
import { useState } from "react";
import * as SignIn from "@clerk/elements/sign-in";
import * as Clerk from "@clerk/elements/common";
import Link from "next/link";
import { FaGoogle, FaApple, FaFacebook } from "react-icons/fa";
import Loader from "@/components/Loader";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm";

const submitCls =
  "w-full py-2.5 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center";

const oauthCls =
  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-muted transition-colors";

export default function SignInPage() {
  const [ready, setReady] = useState(false);

  return (
    <div className={`min-h-screen bg-bg flex items-center justify-center px-4 transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <img src="/logo.webp" alt="Meepletron" className="w-14 h-14 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted mt-1">Sign in to your account</p>
        </div>

        <SignIn.Root>
          <SignIn.Step name="start" className="space-y-4">
            <span className="sr-only" ref={(el) => { if (el) setReady(true); }} />
            <div className="flex gap-3">
              <Clerk.Connection name="google" className={oauthCls}>
                <FaGoogle size={15} /> Google
              </Clerk.Connection>
              <Clerk.Connection name="apple" className={oauthCls}>
                <FaApple size={16} /> Apple
              </Clerk.Connection>
              <Clerk.Connection name="facebook" className={oauthCls}>
                <FaFacebook size={15} /> Facebook
              </Clerk.Connection>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-subtle">or continue with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Clerk.Field name="identifier" className="space-y-1.5">
              <Clerk.Label className="text-xs font-medium text-muted">Email</Clerk.Label>
              <Clerk.Input type="email" placeholder="you@example.com" className={inputCls} />
              <Clerk.FieldError className="block text-xs text-red-500" />
            </Clerk.Field>

            <Clerk.Field name="password" className="space-y-1.5">
              <Clerk.Label className="text-xs font-medium text-muted">Password</Clerk.Label>
              <Clerk.Input type="password" placeholder="••••••••" className={inputCls} />
              <Clerk.FieldError className="block text-xs text-red-500" />
            </Clerk.Field>

            <SignIn.Action submit className={submitCls}>
              <Clerk.Loading>
                {(isLoading) => isLoading ? <Loader width="1rem" /> : "Sign In"}
              </Clerk.Loading>
            </SignIn.Action>
          </SignIn.Step>

          <SignIn.Step name="verifications" className="space-y-4">
            <SignIn.Strategy name="email_code">
              <p className="text-sm text-muted text-center">Check your email for a verification code.</p>
              <Clerk.Field name="code" className="space-y-1.5">
                <Clerk.Label className="text-xs font-medium text-muted">Code</Clerk.Label>
                <Clerk.Input
                  type="otp"
                  placeholder="000000"
                  className={`${inputCls} tracking-[0.5em] text-center text-lg`}
                />
                <Clerk.FieldError className="block text-xs text-red-500" />
              </Clerk.Field>
              <SignIn.Action submit className={submitCls}>
                <Clerk.Loading>
                  {(isLoading) => isLoading ? <Loader width="1rem" /> : "Verify"}
                </Clerk.Loading>
              </SignIn.Action>
              <SignIn.Action navigate="start" className="w-full text-center text-sm text-muted hover:text-foreground transition-colors block">
                ← Back
              </SignIn.Action>
            </SignIn.Strategy>

            <SignIn.Strategy name="password">
              <Clerk.Field name="password" className="space-y-1.5">
                <Clerk.Label className="text-xs font-medium text-muted">Password</Clerk.Label>
                <Clerk.Input type="password" placeholder="••••••••" className={inputCls} />
                <Clerk.FieldError className="block text-xs text-red-500" />
              </Clerk.Field>
              <SignIn.Action submit className={submitCls}>
                <Clerk.Loading>
                  {(isLoading) => isLoading ? <Loader width="1rem" /> : "Sign In"}
                </Clerk.Loading>
              </SignIn.Action>
            </SignIn.Strategy>
          </SignIn.Step>
        </SignIn.Root>

        <p className="text-center text-sm text-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary font-medium hover:underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
