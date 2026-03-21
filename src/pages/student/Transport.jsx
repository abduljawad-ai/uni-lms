
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'
import { MapPin, Save, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const PAKISTAN_CITIES = {
  'KARACHI': ['SADDAR','CLIFTON','DEFENCE','GULSHAN-E-IQBAL','KORANGI','MALIR','NAZIMABAD','NORTH NAZIMABAD','GULISTAN-E-JOHAR','SHAH FAISAL COLONY','ORANGI','SITE','LANDHI'],
  'HYDERABAD': ['LATIFABAD','QASIMABAD','AUTO BHAN ROAD','HIRABAD','HUSSAINABAD','MARKET','OLD CITY'],
  'KOTRI': ['KOTRI PHATAK','KOTRI CITY','RAILWAY STATION','MAKKA CHOWK'],
  'JAMSHORO': ['MAIN CAMPUS','OLD CAMPUS','FACULTY COLONY'],
  'THATTA': ['THATTA CITY','MAKLI'],
  'BADIN': ['BADIN CITY','TALHAR'],
  'SUKKUR': ['SUKKUR CITY','ROHRI','NEW SUKKUR'],
  'LARKANA': ['LARKANA CITY','RATODERO'],
  'NAWABSHAH': ['NAWABSHAH CITY','SAKRAND'],
  'MIRPURKHAS': ['MIRPURKHAS CITY','DIGRI'],
  'KHAIRPUR': ['KHAIRPUR CITY','GAMBAT'],
  'DADU': ['DADU CITY','JOHI'],
  'NAUSHAHRO FEROZE': ['NAUSHAHRO FEROZE CITY','MORO','MEHRABPUR'],
  'SANGHAR': ['SANGHAR CITY','SHAHDADPUR'],
  'ISLAMABAD': ['F-6','F-7','F-8','G-9','G-10','G-11','I-8','I-9','BAHRIA TOWN'],
  'LAHORE': ['GULBERG','DHA','MODEL TOWN','JOHAR TOWN','IQBAL TOWN','GARDEN TOWN'],
  'MULTAN': ['MULTAN CITY','CANTONMENT','SHAH RUKN-E-ALAM'],
  'FAISALABAD': ['FAISALABAD CITY','PEOPLES COLONY','GHULAM MUHAMMAD ABAD'],
  'PESHAWAR': ['PESHAWAR CITY','HAYATABAD','UNIVERSITY TOWN'],
  'QUETTA': ['QUETTA CITY','SATELLITE TOWN','AIRPORT ROAD'],
}

export default function Transport() {
  const { userProfile } = useAuth()
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingData, setExistingData] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      if (!userProfile?.uid) return
      try {
        const snap = await getDoc(doc(db, 'transportLocations', userProfile.uid))
        if (snap.exists()) {
          const d = snap.data()
          setExistingData(d)
          setSelectedCity(d.city || '')
          setSelectedLocation(d.location || '')
          setSaved(true)
        }
      } catch { }
    }
    fetch()
  }, [userProfile])

  const cities = Object.keys(PAKISTAN_CITIES).sort()
  const locations = selectedCity ? (PAKISTAN_CITIES[selectedCity] || []) : []

  const handleUpdate = async () => {
    if (!selectedCity || !selectedLocation) return toast.error('Please select both city and location')
    setSaving(true)
    try {
      await setDoc(doc(db, 'transportLocations', userProfile.uid), {
        studentId: userProfile.uid,
        studentName: userProfile.name,
        rollNumber: userProfile.rollNumber || '',
        program: userProfile.program || '',
        city: selectedCity,
        location: selectedLocation,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      setExistingData({ city: selectedCity, location: selectedLocation })
      setSaved(true)
      toast.success('Pick up point updated!')
    } catch (e) { console.error(e); toast.error('Failed to update') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-blue-300" />
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily:'Outfit,sans-serif' }}>Your Pick Up Point</h1>
            <p className="text-blue-200 text-sm">Points Pick / Drop Locations for University Transport</p>
          </div>
        </div>
      </div>

      {}
      {existingData && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-sm">Current Pick Up Point</p>
            <p className="text-green-700 text-sm">{existingData.location}, {existingData.city}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-800 text-sm mb-5">
          <strong>Note:</strong> If you could not find the exact location, kindly select one of the given nearby locations.
        </div>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="label">Select City</label>
            <select
              value={selectedCity}
              onChange={e => { setSelectedCity(e.target.value); setSelectedLocation(''); setSaved(false) }}
              className="input-field">
              <option value="">-- Select City --</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>

          {selectedCity && (
            <div className="animate-slide-up">
              <label className="label">Select Location</label>
              <select
                value={selectedLocation}
                onChange={e => { setSelectedLocation(e.target.value); setSaved(false) }}
                className="input-field">
                <option value="">-- Select Location --</option>
                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
          )}

          {selectedCity && selectedLocation && (
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-800 animate-slide-up">
              <p className="font-semibold">Selected Location:</p>
              <p className="flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" /> {selectedLocation}, {selectedCity}
              </p>
            </div>
          )}

          <button
            onClick={handleUpdate}
            disabled={saving || !selectedCity || !selectedLocation}
            className="btn-primary disabled:opacity-50">
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save className="w-4 h-4" />}
            {saving ? 'Updating...' : 'Update Location'}
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-3" style={{ fontFamily:'Outfit,sans-serif' }}>Transport Schedule</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span>Morning Pick Up</span><span className="font-semibold">7:00 AM – 8:00 AM</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span>Evening Drop</span><span className="font-semibold">4:00 PM – 5:00 PM</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Days</span><span className="font-semibold">Mon – Sat</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-3" style={{ fontFamily:'Outfit,sans-serif' }}>Important Notes</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Be at your pick-up point 10 minutes early</li>
            <li>Carry your university ID card</li>
            <li>Contact transport office for route changes</li>
            <li>Update your location before every semester</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
