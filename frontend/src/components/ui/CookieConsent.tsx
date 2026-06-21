import { useState, useEffect } from 'react'
import { Button } from './Button'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('alterect-cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('alterect-cookie-consent', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('alterect-cookie-consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[rgba(4,23,43,0.12)_0px_0px_0px_1px,rgba(0,0,0,0.15)_0px_20px_25px_-5px] border border-dove/10 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-[13px] text-graphite leading-relaxed flex-1">
          We use essential cookies for authentication and security. Analytics cookies help us improve the product.
          <a href="/cookies" className="text-rust font-[430] hover:underline ml-1 whitespace-nowrap">Learn more</a>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={decline}>
            Decline
          </Button>
          <Button size="sm" onClick={accept}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  )
}
