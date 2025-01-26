import { SignIn } from "@clerk/nextjs";
import React from "react";

export const metadata = {
  title: "Sign-in",
  alternates: {
    canonical: "/sign-in",
  },
};

export default function SignInPage() {
  return (
    <div className=" flex justify-center">
      <SignIn />
    </div>
  );
}
