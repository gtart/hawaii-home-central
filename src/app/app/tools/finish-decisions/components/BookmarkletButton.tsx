'use client'

import { useState, useCallback } from 'react'

/**
 * Draggable "Save to HHC" bookmarklet button.
 * Generates the bookmarklet JavaScript href dynamically using window.location.origin.
 * Used in both SaveFromWebDialog and SaveFromWebContent.
 *
 * Image capture supports srcset/data-srcset — picks the largest candidate
 * before falling back to src/data-src.
 */
export function BookmarkletButton({ compact = false }: { compact?: boolean }) {
  const [ready, setReady] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const ref = useCallback((el: HTMLAnchorElement | null) => {
    if (!el) return
    const origin = window.location.origin
    const code = [
      'javascript:void(function(){',
      'try{',
      // Basic page info
      'var d=document,t=d.title||"",o="",m=d.querySelector("meta[property=\\"og:image\\"]");',
      'if(m)o=m.getAttribute("content")||"";',
      'var i=[],s={};',
      'function abs(u){try{return new URL(u,location.href).href}catch(e){return""}}',
      // Parse srcset string and return the largest URL
      'function bestSrc(ss){if(!ss)return"";var best="",bw=0;',
      'ss.split(",").forEach(function(e){var p=e.trim().split(/\\s+/);',
      'if(p.length>=2){var w=parseInt(p[1]);if(w>bw){bw=w;best=p[0]}}',
      'else if(p[0]&&!best){best=p[0]}});return best}',

      // ── JSON-LD Product extraction ──
      'var pn="",pr="",br="",sp="";',
      'try{var scripts=d.querySelectorAll("script[type=\\"application/ld+json\\"]");',
      'for(var si=0;si<scripts.length;si++){try{var ld=JSON.parse(scripts[si].textContent);',
      // Handle @graph arrays
      'var items=ld["@graph"]?ld["@graph"]:[ld];',
      'for(var li=0;li<items.length;li++){var it=items[li];',
      'if(it["@type"]==="Product"||it["@type"]==="product"){',
      'pn=it.name?String(it.name).substring(0,200):"";',
      'if(it.brand){br=typeof it.brand==="string"?it.brand:it.brand.name||""}',
      'if(it.description)sp=String(it.description).substring(0,2000);',
      'if(it.offers){var of2=Array.isArray(it.offers)?it.offers[0]:it.offers;',
      'if(of2){var pv=of2.price||of2.lowPrice||"";',
      'if(pv){var cu=of2.priceCurrency||"USD";pr=(cu==="USD"?"$":cu+" ")+pv}}}',
      'if(it.image){var pi=typeof it.image==="string"?it.image:Array.isArray(it.image)?it.image[0]:it.image.url||"";',
      'if(pi){var ra=abs(pi);if(ra&&!s[ra]){s[ra]=1;i.unshift({url:ra,label:"Product"})}}}',
      'break}}catch(ex){}}',
      '}catch(ex2){}',

      // ── Meta tag price fallback ──
      'if(!pr){var pm=d.querySelector("meta[property=\\"product:price:amount\\"]")||d.querySelector("meta[property=\\"og:price:amount\\"]");',
      'if(pm){var pma=pm.getAttribute("content")||"";',
      'var pmc=d.querySelector("meta[property=\\"product:price:currency\\"]")||d.querySelector("meta[property=\\"og:price:currency\\"]");',
      'var cur=pmc?pmc.getAttribute("content")||"USD":"USD";',
      'if(pma)pr=(cur==="USD"?"$":cur+" ")+pma}}',

      // ── Images (OG + page imgs) ──
      'if(o){var r=abs(o);if(r&&!s[r]){s[r]=1;i.push({url:r,label:"Primary"})}}',
      'var g=d.getElementsByTagName("img");',
      'for(var j=0;j<g.length&&i.length<20;j++){',
      'var n=g[j];',
      'if(n.naturalWidth>0&&n.naturalWidth<=150)continue;',
      'if(n.naturalHeight>0&&n.naturalHeight<=150)continue;',
      'var ss=n.getAttribute("srcset")||n.getAttribute("data-srcset")||"";',
      'var c=bestSrc(ss)||n.getAttribute("data-src")||n.getAttribute("data-lazy-src")||n.src||"";',
      'if(!c||c.indexOf("data:")===0)continue;',
      'if(c.indexOf(".svg")>-1)continue;',
      'var r2=abs(c);if(!r2||s[r2])continue;s[r2]=1;',
      'var l=n.alt||n.title||"";',
      'i.push({url:r2,label:l.substring(0,80)})}',

      // ── Build payload with new fields ──
      'var payload={title:(pn||t).substring(0,200),images:i,url:location.href};',
      'if(pn)payload.productName=pn;',
      'if(pr)payload.price=pr;',
      'if(br)payload.brand=br;',
      'if(sp)payload.specs=sp;',

      // ── Inject iframe overlay OR fall back to new tab ──
      'if(d.getElementById("hhc-overlay")){',
      // Already open — just refocus
      'd.getElementById("hhc-overlay").style.display="block";',
      '}else{',
      // Create overlay iframe
      'var f=d.createElement("iframe");f.id="hhc-overlay";',
      'f.src="' + origin + '/app/save-from-web/overlay";',
      'f.style.cssText="position:fixed;top:0;right:0;width:400px;height:100%;border:none;z-index:2147483647;box-shadow:-4px 0 24px rgba(0,0,0,0.3);background:#1a1a1a;";',
      'f.allow="clipboard-write";',
      'd.body.appendChild(f);',

      // Send data to iframe once loaded
      'f.onload=function(){f.contentWindow.postMessage({type:"hhc:captured",payload:payload},"' + origin + '")};',

      // Close button
      'var cb=d.createElement("button");cb.id="hhc-overlay-close";',
      'cb.textContent="\\u2715";',
      'cb.style.cssText="position:fixed;top:8px;right:408px;z-index:2147483647;background:#333;color:#fff;border:none;border-radius:50%;width:28px;height:28px;font-size:16px;cursor:pointer;line-height:1;";',
      'cb.onclick=function(){f.remove();cb.remove();if(window._hhcClickCleanup)window._hhcClickCleanup()};',
      'd.body.appendChild(cb);',

      // ── Click-to-select listener ──
      'var selField=null,hlEl=null;',
      'function hlOn(e){if(!selField)return;if(hlEl)hlEl.style.outline="";hlEl=e.target;hlEl.style.outline="3px solid #d4a574"}',
      'function hlClick(e){if(!selField)return;e.preventDefault();e.stopPropagation();',
      'var txt=e.target.textContent.trim().substring(0,2000);',
      'f.contentWindow.postMessage({type:"hhc:selected",field:selField,value:txt},"' + origin + '");',
      'selField=null;if(hlEl)hlEl.style.outline="";d.body.style.cursor=""}',
      'window.addEventListener("message",function(ev){',
      'if(ev.origin!=="' + origin + '")return;',
      'if(ev.data&&ev.data.type==="hhc:startSelect"){selField=ev.data.field;d.body.style.cursor="crosshair"}',
      'if(ev.data&&ev.data.type==="hhc:cancelSelect"){selField=null;if(hlEl)hlEl.style.outline="";d.body.style.cursor=""}',
      'if(ev.data&&ev.data.type==="hhc:close"){f.remove();cb.remove();if(window._hhcClickCleanup)window._hhcClickCleanup()}',
      '});',
      'd.addEventListener("mouseover",hlOn,true);',
      'd.addEventListener("click",hlClick,true);',
      'window._hhcClickCleanup=function(){d.removeEventListener("mouseover",hlOn,true);d.removeEventListener("click",hlClick,true);selField=null;if(hlEl)hlEl.style.outline="";d.body.style.cursor=""}',
      '}',

      // Also store in sessionStorage as fallback for popup-blocked scenarios
      'var p=JSON.stringify(payload);',
      'try{sessionStorage.setItem("hhc_bookmarklet_pending",p)}catch(x){}',
      '}catch(err){',
      // Fallback: open in new tab if overlay injection fails (e.g. CSP)
      'try{var d2=document,t2=d2.title||"";',
      'var fp=JSON.stringify({title:t2.substring(0,120),images:[],url:location.href});',
      'var b2=btoa(unescape(encodeURIComponent(fp)));',
      'var u2="' + origin + '/app/save-from-web#bookmarklet="+b2;',
      'window.open(u2,"_blank")||window.location.href=u2;',
      '}catch(e2){alert("Save to HHC error: "+err.message)}}',
      '}())',
    ].join('')
    el.setAttribute('href', code)
    setReady(true)
  }, [])

  function handleCopyBookmarklet() {
    const el = document.querySelector<HTMLAnchorElement>('[title="Drag me to your bookmarks bar"]')
    if (el) {
      navigator.clipboard.writeText(el.href).catch(() => {})
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <a
          ref={ref}
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setShowHint(true)
            setTimeout(() => setShowHint(false), 4000)
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
        {ready && (
          <button
            type="button"
            onClick={handleCopyBookmarklet}
            className="text-[11px] text-cream/30 hover:text-cream/50 transition-colors"
            title="Copy bookmarklet URL"
          >
            Copy link
          </button>
        )}
      </div>
      {showHint && (
        <p className="text-[11px] text-amber-400/80 mt-1.5">
          Drag this button to your bookmarks bar instead of clicking it.
        </p>
      )}
      {!showHint && ready && (
        <p className="text-[11px] text-cream/30 mt-1.5">
          On Safari: right-click the button, select &quot;Add to Bookmarks&quot;
        </p>
      )}
      {!ready && (
        <p className="text-[11px] text-cream/40 mt-1.5">Loading bookmarklet...</p>
      )}
    </div>
  )
}
