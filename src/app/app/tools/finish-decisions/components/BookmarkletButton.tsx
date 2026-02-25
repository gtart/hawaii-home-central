'use client'

import { useState, useCallback } from 'react'

/**
 * Draggable "Save to HHC" bookmarklet button.
 * Generates the bookmarklet JavaScript href dynamically using window.location.origin.
 * Used in both SaveFromWebDialog and SaveFromWebContent.
 */
export function BookmarkletButton({ compact = false }: { compact?: boolean }) {
  const [ready, setReady] = useState(false)

  const ref = useCallback((el: HTMLAnchorElement | null) => {
    if (!el) return
    const origin = window.location.origin
    const code = [
      'javascript:void(function(){',
      'try{',
      'var d=document,t=d.title||"",o="",m=d.querySelector("meta[property=\\"og:image\\"]");',
      'if(m)o=m.getAttribute("content")||"";',
      'var i=[],s={};',
      'function abs(u){try{return new URL(u,location.href).href}catch(e){return""}}',
      'if(o){var r=abs(o);if(r){s[r]=1;i.push({url:r,label:"Primary"})}}',
      'var g=d.getElementsByTagName("img");',
      'for(var j=0;j<g.length&&i.length<20;j++){',
      'var n=g[j];',
      'if(n.naturalWidth>0&&n.naturalWidth<=150)continue;',
      'if(n.naturalHeight>0&&n.naturalHeight<=150)continue;',
      'var c=n.getAttribute("data-src")||n.getAttribute("data-lazy-src")||n.src||"";',
      'if(!c||c.indexOf("data:")===0)continue;',
      'if(c.indexOf(".svg")>-1)continue;',
      'var r2=abs(c);if(!r2||s[r2])continue;s[r2]=1;',
      'var l=n.alt||n.title||"";',
      'i.push({url:r2,label:l.substring(0,80)})}',
      'var p=JSON.stringify({title:t.substring(0,120),images:i,url:location.href});',
      'try{sessionStorage.setItem("hhc_bookmarklet_pending",p)}catch(x){}',
      'var b=btoa(unescape(encodeURIComponent(p)));',
      'var u="' + origin + '/app/save-from-web#bookmarklet="+b;',
      'var w=window.open(u,"_blank");if(!w){window.location.href=u}',
      '}catch(err){alert("Save to HHC error: "+err.message)}',
      '}())',
    ].join('')
    el.setAttribute('href', code)
    setReady(true)
  }, [])

  return (
    <div>
      <a
        ref={ref}
        href="#"
        onClick={(e) => {
          e.preventDefault()
          alert('Drag this button to your bookmarks bar \u2014 don\'t click it!')
        }}
        className={`inline-flex items-center gap-1.5 font-medium rounded-lg cursor-grab active:cursor-grabbing select-none ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        } ${
          ready
            ? 'bg-sandstone text-basalt'
            : 'bg-cream/20 text-cream/40'
        }`}
        title="Drag me to your bookmarks bar"
      >
        <svg className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        Save to HHC
      </a>
      {ready ? (
        <p className="text-[11px] text-cream/30 mt-1.5">
          On Safari: right-click the button, select &quot;Add to Bookmarks&quot;
        </p>
      ) : (
        <p className="text-[11px] text-cream/40 mt-1.5">Loading bookmarklet...</p>
      )}
    </div>
  )
}
