var C=Object.defineProperty;var S=Object.getOwnPropertyDescriptor;var $=Object.getOwnPropertyNames;var E=Object.prototype.hasOwnProperty;var T=(i,n)=>{for(var a in n)C(i,a,{get:n[a],enumerable:!0})},B=(i,n,a,d)=>{if(n&&typeof n=="object"||typeof n=="function")for(let s of $(n))!E.call(i,s)&&s!==a&&C(i,s,{get:()=>n[s],enumerable:!(d=S(n,s))||d.enumerable});return i};var M=i=>B(C({},"__esModule",{value:!0}),i);var A={};T(A,{default:()=>O});module.exports=M(A);var h=require("react"),t=require("@raycast/api");var c=require("@raycast/api");function x(i,n,a){let d=i.split(/\s+/).filter(Boolean).length,s=n.split(/\s+/).filter(Boolean).length,m=s-d,p=m>0?`+${m}`:`${m}`;return`## \u{1F680} ${a.toUpperCase()} Variation

> **"${n}"**

---

### \u{1F4DD} Original Passage (${d} words)
> "${i}"

### \u{1F4CA} Change Stats
- **Length**: ${s} words (${p} words)
- **Style**: ${a}
- **Engine**: Local Ollama (100% Private, Zero Cloud Sync)

---
*\u{1F4A1} Press **Enter** to paste directly into your active text box.*`}function N(i,n){let a=[[/\bfavourable\b/i,/\bfavorable\b/i,"favourable","favorable"],[/\borganise\b/i,/\borganize\b/i,"organise","organize"],[/\bcolour\b/i,/\bcolor\b/i,"colour","color"],[/\bcentre\b/i,/\bcenter\b/i,"centre","center"],[/\btravelling\b/i,/\btraveling\b/i,"travelling","traveling"],[/\bdefence\b/i,/\bdefense\b/i,"defence","defense"],[/\banalyse\b/i,/\banalyze\b/i,"analyse","analyze"]],d=[];for(let[s,m,p,g]of a)if(s.test(i))for(let[b,u]of Object.entries(n))m.test(u)&&!s.test(u)&&d.push({originalWord:p,usVariant:g,tone:b});return d}function D(i,n="en_GB"){let a=n==="en_GB",d=a?`You are an expert sentence rewriting engine. You strictly write in British English (en_GB), preserving UK spelling (e.g. favourable, organise, colour, centre, travelling, defence, analyse) and UK punctuation standards (omit full stops on titles like Mr, Mrs, Dr; omit Oxford commas in simple lists like "bread, milk and eggs"; use single quotes '...' with punctuation outside unless part of quoted speech; capitalize sentence starts and end complete statements with full stops). You output only raw valid JSON without markdown code fences.`:"You are an expert sentence rewriting engine. You output only raw valid JSON without markdown code fences.",m=`Rewrite the following sentence into 4 distinct versions:
1. Formal: Polished, professional, articulate, and grammatically impeccable.
2. Friendly: Warm, conversational, and approachable.
3. Direct: Concise, punchy, cutting all fluff.
4. Detailed: Thorough, descriptive, and richly explanatory.
${a?`
Language & Punctuation requirements (UK English):
- Strictly preserve British English (en_GB) spelling (such as favourable, organise, colour, centre).
- Capitalise the first letter of each sentence and terminate complete statements with a full stop (or question mark for direct questions).
- Omit full stops on modern British titles (Mr, Mrs, Dr) and acronyms (BBC, NHS).
- Lists: Omit the Oxford comma by default ("bread, milk and eggs") unless required for clarity.
- Quotation marks: Use single quotation marks ('...') with full stops and commas outside unless part of quoted dialogue.
- Hyphenate compound adjectives before nouns ("world-class performance").
`:""}
Sentence: "${i.trim()}"

Output ONLY a JSON object with keys: "formal", "friendly", "direct", "detailed".
Each key must be a single string with the rewritten sentence.
Example:
{
  "formal": "To reach an informed decision, a thorough investigation was conducted.",
  "friendly": "We looked into things so we could figure out the best way forward.",
  "direct": "We investigated before making a decision.",
  "detailed": "To ensure we made a well-grounded decision, our team conducted a comprehensive investigation."
}`;return{systemPrompt:d,userPrompt:m}}async function P(i){let n={};try{n=(0,c.getPreferenceValues)()}catch{}let a=(n.ollamaHost||"http://localhost:11434").replace(/\/v1\/?$/,""),d=n.ollamaModel||"llama3.2:3b",s=n.language||"en_GB";if(d!=="llama3.2:3b")throw await(0,c.showToast)({style:c.Toast.Style.Failure,title:"Outdated Ollama model configured",message:`The configured model '${d}' is a vision-language model that loads ~12.6 GB. Change it to 'llama3.2:3b' to reclaim memory. Recommended: llama3.2:3b`,primaryAction:{title:"Open Preferences",shortcut:{modifiers:["cmd"],key:","},onAction:()=>{(0,c.openExtensionPreferences)()}}}),new Error(`The configured model '${d}' is a vision-language model that loads ~12.6 GB. Change it to 'llama3.2:3b' to reclaim memory. Recommended: llama3.2:3b`);let{systemPrompt:m,userPrompt:p}=D(i,s);try{let g=await fetch(`${a}/v1/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:d,messages:[{role:"system",content:m},{role:"user",content:p}],temperature:.7,max_tokens:500})});if(!g.ok)throw new Error(`Ollama returned status ${g.status}`);let u=(await g.json()).choices?.[0]?.message?.content||"{}";u.includes("</think>")&&(u=u.split("</think>")[1].trim()),u.startsWith("```")&&(u=u.split(`
`).slice(1,-1).join(`
`).trim());let e={};try{e=JSON.parse(u)}catch{let o=u.indexOf("{"),r=u.lastIndexOf("}");o!==-1&&r>o&&(e=JSON.parse(u.substring(o,r+1)))}let v=[{versionNumber:1,tone:"formal",label:"Version 1: Formal",icon:c.Icon.Document,tintColor:c.Color.Blue,description:"Polished, professional, and articulate"},{versionNumber:2,tone:"friendly",label:"Version 2: Friendly",icon:c.Icon.Heart,tintColor:c.Color.Green,description:"Warm, conversational, and approachable"},{versionNumber:3,tone:"direct",label:"Version 3: Direct",icon:c.Icon.Bolt,tintColor:c.Color.Orange,description:"Concise, punchy, and to the point"},{versionNumber:4,tone:"detailed",label:"Version 4: Detailed",icon:c.Icon.Book,tintColor:c.Color.Purple,description:"Thorough, descriptive, and explanatory"}],f=[];for(let o of v){let r=e[o.tone];r===void 0&&(o.tone==="detailed"?r=e.detailled||e.details||e.elaborate:o.tone==="formal"?r=e.professional||e.polished:o.tone==="friendly"?r=e.casual||e.warm:o.tone==="direct"&&(r=e.concise||e.punchy));let l="";typeof r=="string"?l=r.trim():Array.isArray(r)&&r.length>0&&(l=String(r[0]).trim()),l||(l=i.trim());let R=x(i.trim(),l,o.label);f.push({id:`version-${o.versionNumber}`,versionNumber:o.versionNumber,tone:o.tone,label:o.label,rewrittenText:l,originalText:i.trim(),diffMarkdown:R,icon:o.icon,tintColor:o.tintColor})}if(s==="en_GB"){let o={};for(let l of f)o[l.tone]=l.rewrittenText;let r=N(i,o);r.length>0&&console.warn("[SpellingLauncher] Dialect warning: Model converted UK English spellings to US variants: "+r.map(l=>`${l.originalWord} -> ${l.usVariant} in ${l.tone}`).join(", "))}return f}catch(g){throw new Error(`Ollama rewrite failed: ${g.message||g}. Please ensure Ollama is running at ${a}.`)}}var y=t.List,k=t.ActionPanel,w=t.Action;function O(){let[i,n]=(0,h.useState)(""),[a,d]=(0,h.useState)([]),[s,m]=(0,h.useState)(!0),[p,g]=(0,h.useState)("Reading selected text...");(0,h.useEffect)(()=>{let e=!0;async function v(){m(!0);let f="";try{f=(await(0,t.getSelectedText)()).trim()}catch{try{f=(await t.Clipboard.readText()||"").trim()}catch{f=""}}if(!e)return;if(!f){n("Highlight text in any app before opening Spelling Launcher."),m(!1);return}n(f);let r=(0,t.getPreferenceValues)().ollamaModel||"llama3.2:3b";if(r!=="llama3.2:3b"){await(0,t.showToast)({style:t.Toast.Style.Failure,title:"Outdated Ollama model configured",message:`The configured model '${r}' is a vision-language model that loads ~12.6 GB. Change it to 'llama3.2:3b' to reclaim memory. Recommended: llama3.2:3b`,primaryAction:{title:"Open Preferences",shortcut:{modifiers:["cmd"],key:","},onAction:()=>{(0,t.openExtensionPreferences)()}}}),e&&(g(`Error: Outdated Ollama model '${r}'. Change to 'llama3.2:3b' in Preferences.`),m(!1));return}g("Rewriting into 4 versions with local Ollama...");try{let l=await P(f);e&&d(l)}catch(l){e&&g(`Error: ${l.message||l}`)}finally{e&&m(!1)}}return v(),()=>{e=!1}},[]);let b=async e=>{await t.Clipboard.copy(e.rewrittenText),await(0,t.showToast)({style:t.Toast.Style.Success,title:`Copied rewrite ${e.versionNumber}`,message:e.label})},u=async e=>{await t.Clipboard.paste(e),await(0,t.showHUD)("\u{1F680} Pasted back into active app!"),await(0,t.popToRoot)()};return _jsx(y,{isLoading:s,isShowingDetail:!0,searchBarPlaceholder:"Select a version and press Enter to copy..."},a.length===0&&!s?_jsx(y.EmptyView,{icon:t.Icon.Warning,title:p.startsWith("Error:")?"Outdated Ollama Model":"No text selected",description:p.startsWith("Error:")?`${p} Press Enter or Cmd+, to Open Preferences.`:"Highlight a sentence in any app (Chrome, Slack, Notes, etc.) and run Spelling Launcher.",actions:_jsx(k,null,_jsx(w,{title:"Open Extension Preferences",icon:t.Icon.Gear,shortcut:{modifiers:["cmd"],key:","},onAction:t.openExtensionPreferences}))}):a.map(e=>_jsx(y.Section,{key:e.id,title:e.label},_jsx(y.Item,{key:e.id,title:e.rewrittenText,icon:{source:e.icon,tintColor:e.tintColor},accessories:[{text:"Copy Result",icon:t.Icon.Clipboard,tooltip:`Press Enter to copy rewrite ${e.versionNumber}`}],detail:_jsx(y.Item.Detail,{markdown:`# ${e.label}

> **${e.rewrittenText}**

---

### \u{1F4CB} Original Sentence
> ${e.originalText}

---

${e.diffMarkdown}

---
*\u{1F4A1} Press **Enter** to Copy Result, or **Cmd+Shift+Enter** to Paste directly into active app.*
`}),actions:_jsx(k,null,_jsx(w,{title:"Copy Result",icon:t.Icon.Clipboard,onAction:()=>b(e)}),_jsx(w,{title:"Paste into Active App",icon:t.Icon.Check,shortcut:{modifiers:["cmd","shift"],key:"enter"},onAction:()=>u(e.rewrittenText)}),_jsx(w,{title:"Copy Original Text",icon:t.Icon.Document,shortcut:{modifiers:["cmd","shift"],key:"c"},onAction:async()=>{await t.Clipboard.copy(e.originalText),await(0,t.showToast)({style:t.Toast.Style.Success,title:"Copied original text"})}}))}))))}
