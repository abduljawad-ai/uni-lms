// src/pages/student/Library.jsx
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { Library, Search, Download, BookOpen, FileText } from 'lucide-react'

export default function StudentLibrary() {
  const [books, setBooks] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db,'library'), orderBy('title')))
        setBooks(snap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  const filtered = books.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase()) ||
    b.subject?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Library className="w-6 h-6 text-blue-300"/>
          <div>
            <h1 className="text-xl font-bold" style={{fontFamily:'Outfit,sans-serif'}}>Digital Library</h1>
            <p className="text-blue-200 text-sm">Browse and download course books and resources</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search books, authors, subjects..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white"/>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin"></div></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
          <p className="text-gray-500 text-sm">{search ? 'No results found' : 'Library is empty. Books will be added soon.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(b=>(
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] p-4 flex items-center justify-center h-32">
                <FileText className="w-16 h-16 text-white/30"/>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-sm line-clamp-2" style={{fontFamily:'Outfit,sans-serif'}}>{b.title}</h3>
                <p className="text-gray-500 text-xs mt-1">{b.author||'Unknown Author'}</p>
                {b.subject && <span className="badge-blue text-xs mt-2 inline-block">{b.subject}</span>}
                {b.downloadUrl && (
                  <a href={b.downloadUrl} target="_blank" rel="noreferrer"
                    className="mt-3 flex items-center gap-2 text-[#1e3a5f] text-xs font-semibold hover:underline">
                    <Download className="w-3.5 h-3.5"/>Download PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
