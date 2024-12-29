import Link from 'next/link'
import React from 'react'

export default function Navbar() {
  return (
    <nav className='w-full bg-slate-900  text-lg p-3'>
      <div><Link href="/"><h3>GameRules.ai</h3></Link></div>
      
    </nav>
  )
}
