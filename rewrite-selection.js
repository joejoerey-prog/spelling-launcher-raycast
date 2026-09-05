var w=Object.defineProperty;var S=Object.getOwnPropertyDescriptor;var P=Object.getOwnPropertyNames;var N=Object.prototype.hasOwnProperty;var O=(t,e)=>{for(var c in e)w(t,c,{get:e[c],enumerable:!0})},R=(t,e,c,m)=>{if(e&&typeof e=="object"||typeof e=="function")for(let a of P(e))!N.call(t,a)&&a!==c&&w(t,a,{get:()=>e[a],enumerable:!(m=S(e,a))||m.enumerable});return t};var T=t=>R(w({},"__esModule",{value:!0}),t);var V={};O(V,{default:()=>x});module.exports=T(V);var u=require("react"),i=require("@raycast/api");var n=require("@raycast/api");function g(t,e,c){let m=t.split(/\s+/).filter(Boolean).length,a=e.split(/\s+/).filter(Boolean).length,d=a-m,p=d>0?`+${d}`:`${d}`;return`## \u{1F680} ${c.toUpperCase()} Variation

> **"${e}"**

---

### \u{1F4DD} Original Passage (${m} words)
> "${t}"

### \u{1F4CA} Change Stats
- **Length**: ${a} words (${p} words)
- **Style**: ${c}
- **Engine**: Local Ollama (100% Private, Zero Cloud Sync)

---
*\u{1F4A1} Press **Enter** to paste directly into your active text box.*`}function v(t){let e=t;return e=e.replace(/\b([a-zA-Z]{2,})\s+\1\b/gi,"$1"),e=e.replace(/\b(have|has|had|an|the|no|any|major|significant|direct|positive|negative|side)\s+affect\b/gi,"$1 effect"),e=e.replace(/\btheir\s+(is|are|was|were|has|have|will|can|could|should|would)\b/gi,"there $1"),e=e.replace(/\bthey're\s+(car|house|dog|opinion|decision|work|report|team|job|friend|family|ideas|plan|project|data|letter)\b/gi,"their $1"),e=e.replace(/\bthere\s+(car|house|dog|opinion|decision|work|report|team|job|friend|family|ideas|plan|project|data|letter)\b/gi,"their $1"),e=e.replace(/\bits\s+(a|an|the|not|very|going|been|clear|obvious|time|important|evident)\b/gi,"it's $1"),e=e.replace(/\bit's\s+(color|tail|name|surface|speed|price|size|purpose|features|quality|location|contents|meaning)\b/gi,"its $1"),e=e.replace(/\b(to|will|don't|can't|might|did|does|do)\s+loose\b/gi,"$1 lose"),e=e.replace(/\bloose\s+(weight|money|control|hope|faith|game|match|time)\b/gi,"lose $1"),e=e.replace(/\b(has|have|had|was|were)\s+lead\s+to\b/gi,"$1 led to"),e=e.replace(/\b(better|worse|more|less|greater|smaller|faster|slower|earlier|later|rather|other)\s+then\b/gi,"$1 than"),e=e.replace(/\b(should|could|would|must|might)\s+of\b/gi,"$1 have"),e=e.replace(/\balot\b/gi,"a lot"),e=e.replace(/\b(as a matter of|in)\s+principal\b/gi,"$1 principle"),e=e.replace(/\bclose\s+proximity\b/gi,"proximity"),e=e.replace(/\bend\s+result\b/gi,"result"),e=e.replace(/\bfuture\s+plans\b/gi,"plans"),e=e.replace(/\bjoin\s+together\b/gi,"join"),e=e.replace(/\bbasic\s+fundamentals\b/gi,"fundamentals"),e=e.replace(/\bpast\s+history\b/gi,"history"),e=e.replace(/\bcompletely\s+eliminate\b/gi,"eliminate"),e=e.replace(/\bpersonal\s+opinion\b/gi,"opinion"),e=e.replace(/\bunexpected\s+surprise\b/gi,"surprise"),e=e.replace(/\bdue\s+to\s+the\s+fact\s+that\b/gi,"because"),e=e.replace(/\bat\s+this\s+point\s+in\s+time\b/gi,"now"),e=e.replace(/\bin\s+order\s+to\b/gi,"to"),e=e.replace(/\bfor\s+the\s+purpose\s+of\b/gi,"to"),e=e.replace(/\bin\s+the\s+event\s+that\b/gi,"if"),e=e.replace(/\buntil\s+such\s+time\s+as\b/gi,"until"),e=e.replace(/\bprior\s+to\b/gi,"before"),e=e.replace(/\bsubsequent\s+to\b/gi,"after"),e=e.replace(/\b\s+([,.:;?!])/g,"$1"),e=e.replace(/([,;])([a-zA-Z])/g,"$1 $2"),e=e.replace(/--/g,"\u2014"),e=e.replace(/\.{3}/g,"\u2026"),e=e.replace(/(^|[\s])"([a-zA-Z0-9])/g,"$1\u201C$2"),e=e.replace(/([a-zA-Z0-9.,!?;:])"/g,"$1\u201D"),e=e.replace(/[ \t]{2,}/g," "),e.trim()}async function $(t){let e=(0,n.getPreferenceValues)(),c=(e.ollamaHost||"http://localhost:11434").replace(/\/v1\/?$/,""),m=e.ollamaModel||"llama3.2:3b",a=`Rewrite the following sentence into 4 distinct versions:
1. Formal: Polished, professional, articulate, and grammatically impeccable.
2. Friendly: Warm, conversational, and approachable.
3. Direct: Concise, punchy, cutting all fluff.
4. Detailed: Thorough, descriptive, and richly explanatory.

Sentence: "${t.trim()}"

Output ONLY a JSON object with keys: "formal", "friendly", "direct", "detailed".
Each key must be a single string with the rewritten sentence.
Example:
{
  "formal": "To reach an informed decision, a thorough investigation was conducted.",
  "friendly": "We looked into things so we could figure out the best way forward.",
  "direct": "We investigated before making a decision.",
  "detailed": "To ensure we made a well-grounded decision, our team conducted a comprehensive investigation."
}`;try{let d=await fetch(`${c}/v1/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:m,messages:[{role:"system",content:"You are an expert sentence rewriting engine. You output only raw valid JSON without markdown code fences."},{role:"user",content:a}],temperature:.7,max_tokens:500})});if(!d.ok)throw new Error(`Ollama returned status ${d.status}`);let s=(await d.json()).choices?.[0]?.message?.content||"{}";s.includes("</think>")&&(s=s.split("</think>")[1].trim()),s.startsWith("```")&&(s=s.split(`
`).slice(1,-1).join(`
`).trim());let h={};try{h=JSON.parse(s)}catch{let o=s.indexOf("{"),l=s.lastIndexOf("}");o!==-1&&l>o&&(h=JSON.parse(s.substring(o,l+1)))}let r=[{versionNumber:1,tone:"formal",label:"Version 1: Formal",icon:n.Icon.Document,tintColor:n.Color.Blue,description:"Polished, professional, and articulate"},{versionNumber:2,tone:"friendly",label:"Version 2: Friendly",icon:n.Icon.Heart,tintColor:n.Color.Green,description:"Warm, conversational, and approachable"},{versionNumber:3,tone:"direct",label:"Version 3: Direct",icon:n.Icon.Bolt,tintColor:n.Color.Orange,description:"Concise, punchy, and to the point"},{versionNumber:4,tone:"detailed",label:"Version 4: Detailed",icon:n.Icon.Book,tintColor:n.Color.Purple,description:"Thorough, descriptive, and explanatory"}],y=[];for(let o of r){let l=h[o.tone],f="";typeof l=="string"?f=l.trim():Array.isArray(l)&&l.length>0&&(f=String(l[0]).trim()),f||(f=v(t));let k=g(t.trim(),f,o.label);y.push({id:`version-${o.versionNumber}`,versionNumber:o.versionNumber,tone:o.tone,label:o.label,rewrittenText:f,originalText:t.trim(),diffMarkdown:k,icon:o.icon,tintColor:o.tintColor})}return y}catch{let p=v(t);return[{id:"version-1",versionNumber:1,tone:"formal",label:"Version 1: Formal",rewrittenText:p,originalText:t.trim(),diffMarkdown:g(t.trim(),p,"Version 1: Formal (Cleaned)"),icon:n.Icon.Document,tintColor:n.Color.Blue},{id:"version-2",versionNumber:2,tone:"friendly",label:"Version 2: Friendly",rewrittenText:p,originalText:t.trim(),diffMarkdown:g(t.trim(),p,"Version 2: Friendly (Cleaned)"),icon:n.Icon.Heart,tintColor:n.Color.Green},{id:"version-3",versionNumber:3,tone:"direct",label:"Version 3: Direct",rewrittenText:p,originalText:t.trim(),diffMarkdown:g(t.trim(),p,"Version 3: Direct (Cleaned)"),icon:n.Icon.Bolt,tintColor:n.Color.Orange},{id:"version-4",versionNumber:4,tone:"detailed",label:"Version 4: Detailed",rewrittenText:p,originalText:t.trim(),diffMarkdown:g(t.trim(),p,"Version 4: Detailed (Cleaned)"),icon:n.Icon.Book,tintColor:n.Color.Purple}]}}var b=i.List,E=i.ActionPanel,C=i.Action;function x(){let[t,e]=(0,u.useState)(""),[c,m]=(0,u.useState)([]),[a,d]=(0,u.useState)(!0),[p,s]=(0,u.useState)("Reading selected text...");(0,u.useEffect)(()=>{let r=!0;async function y(){d(!0);let o="";try{o=(await(0,i.getSelectedText)()).trim()}catch{try{o=(await i.Clipboard.readText()||"").trim()}catch{o=""}}if(r){if(!o){e("Highlight text in any app before opening Spelling Launcher."),d(!1);return}e(o),s("Rewriting into 4 versions with local Ollama...");try{let l=await $(o);r&&m(l)}catch(l){r&&s(`Error: ${l.message||l}`)}finally{r&&d(!1)}}}return y(),()=>{r=!1}},[]);let h=async r=>{await i.Clipboard.paste(r),await(0,i.showHUD)("\u{1F680} Pasted back into active app!"),await(0,i.popToRoot)()};return _jsx(b,{isLoading:a,isShowingDetail:!0,searchBarPlaceholder:"Select a version and press Enter to Copy..."},c.length===0&&!a?_jsx(b.EmptyView,{icon:i.Icon.Warning,title:"No text selected",description:"Highlight a sentence in any app (Chrome, Slack, Notes, etc.) and run Spelling Launcher."}):c.map(r=>_jsx(b.Section,{key:r.id,title:r.label},_jsx(b.Item,{key:r.id,title:r.rewrittenText,icon:{source:r.icon,tintColor:r.tintColor},accessories:[{text:"Copy",icon:i.Icon.Clipboard,tooltip:"Press Enter to copy to clipboard"}],detail:_jsx(b.Item.Detail,{markdown:`# ${r.label}

> **${r.rewrittenText}**

---

### \u{1F4CB} Original Sentence
> ${r.originalText}

---

${r.diffMarkdown}

---
*\u{1F4A1} Press **Enter** to Copy to Clipboard, or **Cmd+Enter** to Paste directly into active app.*
`}),actions:_jsx(E,null,_jsx(C.CopyToClipboard,{title:"Copy to Clipboard",content:r.rewrittenText,icon:i.Icon.Clipboard}),_jsx(C,{title:"Paste into Active App",icon:i.Icon.Check,shortcut:{modifiers:["cmd"],key:"enter"},onAction:()=>h(r.rewrittenText)}),_jsx(C.CopyToClipboard,{title:"Copy Original Text",content:r.originalText,shortcut:{modifiers:["cmd","shift"],key:"c"},icon:i.Icon.Document}))}))))}
