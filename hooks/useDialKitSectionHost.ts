'use client'

import { useEffect, useState } from 'react'

export function useDialKitSectionHost(sectionTitle: string) {
  const [host, setHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const attach = () => {
      const sections = document.querySelectorAll('.dialkit-folder-section')
      for (const section of sections) {
        const title = section.querySelector('.dialkit-folder-title')?.textContent?.trim()
        if (title !== sectionTitle) continue

        let el = section.querySelector(`[data-dialkit-host="${sectionTitle.toLowerCase()}"]`) as HTMLElement | null
        if (!el) {
          el = document.createElement('div')
          el.dataset.dialkitHost = sectionTitle.toLowerCase()
          const content = section.querySelector('.dialkit-folder-content')
          content?.prepend(el)
        }
        setHost(el)
        return
      }
    }

    attach()
    const observer = new MutationObserver(attach)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [sectionTitle])

  return host
}
