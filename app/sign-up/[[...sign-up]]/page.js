import { SignUp } from '@clerk/nextjs'
import React from 'react'

export const metadata = {
  title: "Sign-up",
  alternates: {
    canonical: "/sign-up",
  },
  
};
export default function SignUpPage() {
  return (
    <div className='flex justify-center'><SignUp /></div>
  )
}
