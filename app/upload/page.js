'use client'
import { useState } from 'react'

export default function UploadPage() {
  const [file, setFile] = useState(null)
  
  const handleSubmit = async(e) => {
    e.preventDefault();
    const data = new FormData();
    data.set('file', file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body:data
    })
    if (res.ok) {
      const data = await res.json();
      alert(data.message);

    }
    
  }
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={(e)=>setFile(e.target.files[0])} required/>
        <button>upload</button>
      </form>
    </div>
  )
}
