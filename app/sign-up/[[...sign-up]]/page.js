"use client";
import { useState } from "react";
import * as SignUp from "@clerk/elements/sign-up";
import * as SignIn from "@clerk/elements/sign-in";
import * as Clerk from "@clerk/elements/common";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa";
import Loader from "@/components/Loader";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm";

const submitCls =
  "w-full py-2.5 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center";


export default function SignUpPage() {
  const [ready, setReady] = useState(false);

  return (
    <div className={`min-h-screen bg-bg flex items-center justify-center px-4 py-16 transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <img src="/logo.webp" alt="Meepletron" className="w-14 h-14 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Create an account</h1>
          <p className="text-sm text-muted mt-1">Join Meepletron for free</p>
        </div>

        <SignUp.Root>
          <SignUp.Step name="start" className="space-y-4">
            <span className="sr-only" ref={(el) => { if (el) setReady(true); }} />
            <Clerk.Connection name="google" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-muted transition-colors">
              <FaGoogle size={15} /> Continue with Google
            </Clerk.Connection>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-subtle">or continue with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Clerk.Field name="firstName" className="space-y-1.5">
                <Clerk.Label className="text-xs font-medium text-muted">First name</Clerk.Label>
                <Clerk.Input placeholder="Jane" className={inputCls} />
                <Clerk.FieldError className="block text-xs text-red-500" />
              </Clerk.Field>
              <Clerk.Field name="lastName" className="space-y-1.5">
                <Clerk.Label className="text-xs font-medium text-muted">Last name</Clerk.Label>
                <Clerk.Input placeholder="Doe" className={inputCls} />
                <Clerk.FieldError className="block text-xs text-red-500" />
              </Clerk.Field>
            </div>

            <Clerk.Field name="emailAddress" className="space-y-1.5">
              <Clerk.Label className="text-xs font-medium text-muted">Email</Clerk.Label>
              <Clerk.Input type="email" placeholder="you@example.com" className={inputCls} />
              <Clerk.FieldError className="block text-xs text-red-500" />
            </Clerk.Field>

            <Clerk.Field name="password" className="space-y-1.5">
              <Clerk.Label className="text-xs font-medium text-muted">Password</Clerk.Label>
              <Clerk.Input type="password" placeholder="••••••••" className={inputCls} />
              <Clerk.FieldError className="block text-xs text-red-500" />
            </Clerk.Field>

            <SignUp.Action submit className={submitCls}>
              <Clerk.Loading>
                {(isLoading) => isLoading ? <Loader width="1rem" /> : "Create Account"}
              </Clerk.Loading>
            </SignUp.Action>
          </SignUp.Step>

          <SignUp.Step name="verifications" className="space-y-4">
            <SignUp.Strategy name="email_code">
              <p className="text-sm text-muted text-center">
                We sent a code to your email. Enter it below to verify your account.
              </p>
              <Clerk.Field name="code" className="space-y-1.5">
                <Clerk.Label className="text-xs font-medium text-muted">Verification code</Clerk.Label>
                <Clerk.Input
                  type="otp"
                  placeholder="000000"
                  className={`${inputCls} tracking-[0.5em] text-center text-lg`}
                />
                <Clerk.FieldError className="block text-xs text-red-500" />
              </Clerk.Field>
              <SignUp.Action submit className={submitCls}>
                <Clerk.Loading>
                  {(isLoading) => isLoading ? <Loader width="1rem" /> : "Verify Email"}
                </Clerk.Loading>
              </SignUp.Action>
              <SignUp.Action resend className="w-full text-center text-sm text-muted hover:text-foreground transition-colors block">
                Resend code
              </SignUp.Action>
            </SignUp.Strategy>
          </SignUp.Step>
        </SignUp.Root>

        {/*
          When Google/Apple/Facebook OAuth returns and the account already exists,
          SignUp.Root throws an external_account_exists error. Having SignIn.Root
          on the same page lets Clerk transfer the flow to sign-in silently.
        */}
        <SignIn.Root>
          <SignIn.Step name="start" />
          <SignIn.Step name="verifications">
            <SignIn.Strategy name="email_code" />
            <SignIn.Strategy name="password" />
          </SignIn.Step>
        </SignIn.Root>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary font-medium hover:underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
