import Link from 'next/link'
import React from 'react'

export default function Navbar() {
  return (
    <nav className='flex justify-between p-2'>
      <div><Link href="/"><h3>GameRules.ai</h3></Link></div>
      <div>
        <Link href="/chat" className='p-2'>Chat</Link>
        <Link href="/games" className='p-2'>Gmaes</Link>
        <Link href="/about" className='p-2'>About</Link>
      </div>
    </nav>
  )
}
