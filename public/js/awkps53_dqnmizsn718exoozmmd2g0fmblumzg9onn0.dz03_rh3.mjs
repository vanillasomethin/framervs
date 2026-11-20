import{t as e}from"./rolldown-runtime.cawjvvtp.mjs";import{A as t,C as n,D as r,I as i,M as a,P as o,R as s,c,g as l,k as u,l as d,o as f,v as ee}from"./react.d85numph.mjs";import{C as p,a as te,r as ne,t as m}from"./motion.b0x_ny9w.mjs";import{A as h,B as g,N as _,Y as v,_t as re,a as ie,bt as y,f as b,ft as ae,i as x,k as S,lt as oe,mt as C,o as w,ot as T,pt as se,ut as ce}from"./framer.daaacyqo.mjs";import{d as E,i as D,l as O,t as le}from"./oijzrbmwdcie2b6qgg1j.c9edpdlb.mjs";import{n as ue,r as de}from"./aqkni3to6.j92xt_co.mjs";var fe=e((()=>{le()}));function k({type:e,url:t,html:n,zoom:r,radius:i,border:a,style:o={}}){return e===`url`&&t?c(pe,{url:t,zoom:r,radius:i,border:a,style:o}):e===`html`&&n?c(M,{html:n,style:o}):c(A,{style:o})}function A({style:e}){return c(`div`,{style:{minHeight:z(e),...E,overflow:`hidden`,...e},children:c(`div`,{style:H,children:`To embed a website or widget, add it to the properties\xA0panel.`})})}function pe({url:e,zoom:t,radius:n,border:r,style:i}){let s=!i.height;/[a-z]+:\/\//.test(e)||(e=`https://`+e);let l=D(),[u,d]=o(l?void 0:!1);return a(()=>{if(!l)return;let t=!0;d(void 0);async function n(){let n=await fetch(`https://api.framer.com/functions/check-iframe-url?url=`+encodeURIComponent(e));if(n.status==200){let{isBlocked:e}=await n.json();t&&d(e)}else{let e=await n.text();console.error(e),d(Error(`This site can’t be reached.`))}}return n().catch(e=>{console.error(e),d(e)}),()=>{t=!1}},[e]),l&&s?c(R,{message:`URL embeds do not support auto height.`,style:i}):e.startsWith(`https://`)?u===void 0?c(L,{}):u instanceof Error?c(R,{message:u.message,style:i}):u===!0?c(R,{message:`Can’t embed ${e} due to its content security policy.`,style:i}):c(`iframe`,{src:e,style:{...B,...i,...r,zoom:t,borderRadius:n,transformOrigin:`top center`},loading:`lazy`,fetchPriority:l?`low`:`auto`,referrerPolicy:`no-referrer`,sandbox:j(l)}):c(R,{message:`Unsupported protocol.`,style:i})}function j(e){let t=[`allow-same-origin`,`allow-scripts`];return e||t.push(`allow-downloads`,`allow-forms`,`allow-modals`,`allow-orientation-lock`,`allow-pointer-lock`,`allow-popups`,`allow-popups-to-escape-sandbox`,`allow-presentation`,`allow-storage-access-by-user-activation`,`allow-top-navigation-by-user-activation`),t.join(` `)}function M({html:e,...t}){if(e.includes(`<\/script>`)){let n=e.includes(`</spline-viewer>`),r=e.includes(`<!-- framer-direct-embed -->`);return c(n||r?P:N,{html:e,...t})}return c(F,{html:e,...t})}function N({html:e,style:t}){let n=r(),[i,l]=o(0);a(()=>{let e=n.current?.contentWindow;function t(t){if(t.source!==e)return;let n=t.data;if(typeof n!=`object`||!n)return;let r=n.embedHeight;typeof r==`number`&&l(r)}return s.addEventListener(`message`,t),e?.postMessage(`getEmbedHeight`,`*`),()=>{s.removeEventListener(`message`,t)}},[]);let u=`
<html>
    <head>
        <style>
            html, body {
                margin: 0;
                padding: 0;
            }

            body {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            :root {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            * {
                box-sizing: border-box;
                -webkit-font-smoothing: inherit;
            }

            h1, h2, h3, h4, h5, h6, p, figure {
                margin: 0;
            }

            body, input, textarea, select, button {
                font-size: 12px;
                font-family: sans-serif;
            }
        </style>
    </head>
    <body>
        ${e}
        <script type="module">
            let height = 0

            function sendEmbedHeight() {
                window.parent.postMessage({
                    embedHeight: height
                }, "*")
            }

            const observer = new ResizeObserver((entries) => {
                if (entries.length !== 1) return
                const entry = entries[0]
                if (entry.target !== document.body) return

                height = entry.contentRect.height
                sendEmbedHeight()
            })

            observer.observe(document.body)

            window.addEventListener("message", (event) => {
                if (event.source !== window.parent) return
                if (event.data !== "getEmbedHeight") return
                sendEmbedHeight()
            })
        <\/script>
    <body>
</html>
`,d={...B,...t};return t.height||(d.height=i+`px`),c(`iframe`,{ref:n,style:d,srcDoc:u})}function P({html:e,style:t}){let n=r();return a(()=>{let t=n.current;if(t)return t.innerHTML=e,I(t),()=>{t.innerHTML=``}},[e]),c(`div`,{ref:n,style:{...V,...t}})}function F({html:e,style:t}){return c(`div`,{style:{...V,...t},dangerouslySetInnerHTML:{__html:e}})}function I(e){if(e instanceof Element&&e.tagName===`SCRIPT`){let t=document.createElement(`script`);t.text=e.innerHTML;for(let{name:n,value:r}of e.attributes)t.setAttribute(n,r);e.parentElement.replaceChild(t,e)}else for(let t of e.childNodes)I(t)}function L(){return c(`div`,{className:`framerInternalUI-componentPlaceholder`,style:{...O,overflow:`hidden`},children:c(`div`,{style:H,children:`Loading…`})})}function R({message:e,style:t}){return c(`div`,{className:`framerInternalUI-errorPlaceholder`,style:{minHeight:z(t),...O,overflow:`hidden`,...t},children:c(`div`,{style:H,children:e})})}function z(e){if(!e.height)return 200}var B,V,H,me=e((()=>{i(),f(),n(),v(),fe(),h(k,{type:{type:w.Enum,defaultValue:`url`,displaySegmentedControl:!0,options:[`url`,`html`],optionTitles:[`URL`,`HTML`]},url:{title:`URL`,type:w.String,description:`Some websites don’t support embedding.`,hidden(e){return e.type!==`url`}},html:{title:`HTML`,type:w.String,displayTextArea:!0,hidden(e){return e.type!==`html`}},border:{title:`Border`,type:w.Border,optional:!0,hidden(e){return e.type!==`url`}},radius:{type:w.BorderRadius,title:`Radius`,hidden(e){return e.type!==`url`}},zoom:{title:`Zoom`,defaultValue:1,type:w.Number,hidden(e){return e.type!==`url`},min:.1,max:1,step:.1,displayStepper:!0}}),B={width:`100%`,height:`100%`,border:`none`},V={width:`100%`,height:`100%`,display:`flex`,flexDirection:`column`,justifyContent:`center`,alignItems:`center`},H={textAlign:`center`,minWidth:140}})),U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{f(),v(),m(),n(),me(),ue(),U=g(k),W={KIFfOHASK:`(min-width: 810px) and (max-width: 1439.98px)`,N45GUUAlD:`(min-width: 1440px)`,NxDCb6BMV:`(max-width: 809.98px)`},G=`framer-VwSZF`,K={KIFfOHASK:`framer-v-1ceiedm`,N45GUUAlD:`framer-v-czssir`,NxDCb6BMV:`framer-v-14r4ufa`},q=(e,t,n)=>e&&t?`position`:n,J=({value:e})=>ae()?null:c(`style`,{dangerouslySetInnerHTML:{__html:e},"data-framer-html-style":``}),Y={Desktop:`N45GUUAlD`,Phone:`NxDCb6BMV`,Tablet:`KIFfOHASK`},X=({height:e,id:t,width:n,...r})=>({...r,variant:Y[r.variant]??r.variant??`N45GUUAlD`}),Z=y(l(function(e,n){let i=r(null),a=n??i,o=ee(),{activeLocale:s,setLocale:l}=se();T();let{style:f,className:m,layoutId:h,variant:g,...v}=X(e);C(t(()=>de({},s),[s]));let[y,ae]=ce(g,W,!1),S=_(G),w=u(b)?.isLayoutTemplate,E=q(w,!!u(te)?.transition?.layout),D=re(`uaFY65J_f`),O=r(null);return oe({}),c(b.Provider,{value:{primaryVariantId:`N45GUUAlD`,variantClassNames:K},children:d(ne,{id:h??o,children:[c(J,{value:`html body { background: rgb(255, 255, 255); }`}),c(p.div,{...v,className:_(S,`framer-czssir`,m),ref:a,style:{...f},children:c(p.section,{className:`framer-ir4as7`,"data-framer-name":`Section - Hero`,id:D,layout:E,ref:O,children:c(`div`,{className:`framer-v78cs2`,"data-framer-name":`Content Wrap`,children:c(`div`,{className:`framer-umd9wd`,"data-framer-name":`Content`,children:c(x,{children:c(ie,{className:`framer-171vfm0-container`,isAuthoredByUser:!0,isModuleExternal:!0,nodeId:`wZ6DrsWM7`,scopeId:`AQkni3tO6`,children:c(k,{height:`100%`,html:``,id:`wZ6DrsWM7`,layoutId:`wZ6DrsWM7`,radius:`0px`,style:{height:`100%`,width:`100%`},type:`url`,url:`https://vanillasomethin.github.io/vs-calculator/`,width:`100%`,zoom:1})})})})})})}),c(`div`,{id:`overlay`})]})})}),[`@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }`,`.framer-VwSZF.framer-1k0fmar, .framer-VwSZF .framer-1k0fmar { display: block; }`,`.framer-VwSZF.framer-czssir { align-content: center; align-items: center; background-color: #ffffff; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: 1080px; justify-content: flex-start; overflow: hidden; padding: 0px; position: relative; width: 1440px; }`,`.framer-VwSZF .framer-ir4as7 { align-content: flex-start; align-items: flex-start; background-color: var(--token-ed116779-66ed-4fd3-9ef4-d9d62c0045e4, #0d0d0d); display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 40px; height: min-content; justify-content: center; max-width: 1440px; min-height: 100vh; overflow: visible; padding: 100px; position: relative; width: 100%; z-index: 2; }`,`.framer-VwSZF .framer-v78cs2 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 32px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 100%; z-index: 3; }`,`.framer-VwSZF .framer-umd9wd { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 20px; height: 825px; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 116%; }`,`.framer-VwSZF .framer-171vfm0-container { flex: 1 0 0px; height: 1px; position: relative; width: 100%; }`,`@media (min-width: 810px) and (max-width: 1439.98px) { .framer-VwSZF.framer-czssir { width: 810px; }}`,`@media (max-width: 809.98px) { .framer-VwSZF.framer-czssir { width: 390px; } .framer-VwSZF .framer-ir4as7 { padding: 120px 20px 40px 20px; }}`],`framer-VwSZF`),Q=Z,Z.displayName=`404`,Z.defaultProps={height:3297.62,width:1440},S(Z,[{explicitInter:!0,fonts:[]},...U],{supportsExplicitInterCodegen:!0}),$={exports:{default:{type:`reactComponent`,name:`FramerAQkni3tO6`,slots:[],annotations:{framerIntrinsicWidth:`1440`,framerAcceptsLayoutTemplate:`true`,framerImmutableVariables:`true`,framerScrollSections:`{"uaFY65J_f":{"pattern":":uaFY65J_f","name":"section-hero"}}`,framerIntrinsicHeight:`3297.62`,framerDisplayContentsDiv:`false`,framerLayoutTemplateFlowEffect:`true`,framerAutoSizeImages:`true`,framerComponentViewportWidth:`true`,framerColorSyntax:`true`,framerContractVersion:`1`,framerCanvasComponentVariantDetails:`{"propertyName":"variant","data":{"default":{"layout":["fixed","fixed"]},"KIFfOHASK":{"layout":["fixed","fixed"]},"NxDCb6BMV":{"layout":["fixed","fixed"]}}}`,framerResponsiveScreen:`true`}},Props:{type:`tsType`,annotations:{framerContractVersion:`1`}},__FramerMetadata__:{type:`variable`}}}}))();export{$ as __FramerMetadata__,Q as default};
//# sourceMappingURL=AwkPs53_DqNmIZSN718EXOOzMMD2G0FMBlumzG9OnN0.Dz03_RH3.mjs.map