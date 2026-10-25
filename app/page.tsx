'use client';
import { useEffect, useRef, useState } from 'react';
import { MAX_FILE, styles, type Style } from '../lib/policy';
export default function Home() {
 const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(''),[result,setResult]=useState(''),[extension,setExtension]=useState('png');
 const [style,setStyle]=useState<Style>('cute'),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const input=useRef<HTMLInputElement>(null); const controller=useRef<AbortController|null>(null);
 useEffect(()=>{if(!file){setPreview('');return;} const url=URL.createObjectURL(file);setPreview(url);return ()=>URL.revokeObjectURL(url);},[file]);
 useEffect(()=>()=>{if(result)URL.revokeObjectURL(result);},[result]);
 useEffect(()=>()=>controller.current?.abort(),[]);
 function select(f?:File) {setError('');setResult('');setConsent(false); if(!f){setFile(null);return;} if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>MAX_FILE||f.size===0){setFile(null);setError('3MB 이하의 JPG, PNG, WebP 사진을 선택해 주세요.');return;}setFile(f);}
 async function generate() {
  if(!file||!consent||busy)return;setBusy(true);setError('');setResult('');
  const ac=new AbortController();controller.current=ac;
  const timer=setTimeout(()=>ac.abort(),200000);
  try {const form=new FormData();form.set('photo',file);form.set('style',style);form.set('consent','yes');
   const response=await fetch('/api/generate',{method:'POST',body:form,signal:ac.signal});
   if(!response.ok){const data=await response.json();throw new Error(data.error||'생성하지 못했어요.');}
   const blob=await response.blob();setExtension(blob.type==='image/jpeg'?'jpg':blob.type==='image/webp'?'webp':'png');setResult(URL.createObjectURL(blob));
  }catch(e){setError(e instanceof Error&&e.name==='AbortError'?'요청이 종료되었습니다. 결과를 확인한 후 다시 시도해 주세요.':e instanceof Error?e.message:'연결을 확인해 주세요.');}finally{clearTimeout(timer);setBusy(false);controller.current=null;}
 }
 return <main>
  <header><a href="/" className="brand"><span className="brand-icon">☺</span> 조금 다른 나<span className="beta">BETA</span></a><span className="header-note">사진 한 장, 새로운 표정</span></header>
  <section className="intro"><div className="eyebrow">YOUR LITTLE PORTRAIT STUDIO</div><h1>어? 나 같은데,<br/><em>조금 더 특별해.</em><span className="spark">✳</span></h1><p>평범한 사진 한 장에 작은 상상을 더해요.<br/>같은 흑백 그림체로, 세 가지 표정의 나를 만나보세요.</p></section>
  <div className="studio"><section className="panel controls"><div className="section-title"><span className="step">01</span><h2>사진을 골라 주세요</h2></div>
   <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="사진 선택" disabled={busy} onChange={e=>{select(e.target.files?.[0]);e.target.value='';}} hidden/>
   <button className={'upload '+(preview?'has-photo':'')} disabled={busy} onClick={()=>input.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!busy)select(e.dataTransfer.files[0]);}}>
    {preview?<><img src={preview} alt="선택한 원본 사진"/><span className="replace">사진 바꾸기 ↗</span></>:<><span className="upload-icon">↥</span><strong>여기에 사진을 놓거나 클릭하세요</strong><small>JPG · PNG · WebP / 최대 3MB</small></>}
   </button><p className="hint">얼굴이 선명하게 보이는 한 사람의 사진이 좋아요.</p>
   <div className="section-title second"><span className="step">02</span><h2>어떤 나를 만나볼까요?</h2></div>
   <div className="styles" role="radiogroup" aria-label="캐리커처 스타일">{Object.entries(styles).map(([key,value])=><button key={key} role="radio" aria-checked={style===key} disabled={busy} className={'style '+(style===key?'selected':'')} onClick={()=>{setStyle(key as Style);setResult('');}}><span className="style-icon">{value.icon}</span><strong>{value.label}</strong><small>{value.description}</small><span className="check">{style===key?'●':'○'}</span></button>)}</div>
   <div className="consent"><label><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/><span>사진을 외부 AI로 전송하는 것에 동의합니다.</span></label><p>선택한 사진은 이 앱의 서버를 거쳐 OpenRouter 및 해당 AI 제공업체로 전송됩니다. 사진 속 인물에게 이용 동의를 받았습니다. 앱은 원본·결과를 DB나 파일 저장소에 저장하지 않습니다. 외부 업체의 처리·보관 정책은 별도로 적용됩니다.</p><a href="https://openrouter.ai/privacy" target="_blank" rel="noreferrer">OpenRouter 개인정보 처리방침 ↗</a></div>
   <button className="generate" disabled={!file||!consent||busy} onClick={generate}>{busy?'나만의 그림을 그리는 중…':'캐리커처 만들기'} <span>{busy?'◌':'✦'}</span></button><p className="fine">생성에는 시간이 걸릴 수 있어요. 생성할 때마다 AI 이용 비용이 발생합니다.</p>
   {error&&<p className="error" role="alert">{error}</p>}
  </section>
  <section className="panel output" aria-busy={busy}><div className="output-top"><span>나의 작은 작품</span><span className="tag">{styles[style].label}</span></div>
   <div className="canvas" aria-live="polite">{result?<img className="result" src={result} alt={`${styles[style].label} 스타일 캐리커처 결과`}/>:busy?<div className="empty"><span className="spinner">✳</span><h3>당신의 개성을 담고 있어요</h3><p>잠시만 기다려 주세요.<br/>이 페이지를 열어 두면 결과가 나타나요.</p></div>:<div className="empty"><div className="portrait"><span className="hair"/><span className="face"><i/><i/><b>⌣</b></span><span className="shirt"/><span className="doodle">✦</span></div><h3>여기에 새로운 내가 찾아와요</h3><p>사진을 고르고 스타일을 선택하면<br/>나만의 작은 작품이 완성돼요.</p><small>위 그림은 스타일 예시가 아닌 장식입니다.</small></div>}</div>
   <div className="output-bottom">{result?<><a className="download" href={result} download={`caricature-${style}.${extension}`}>내 그림 다운로드 ↓</a><button className="clear" onClick={()=>{select();setResult('');}}>사진 지우고 새로 시작</button></>:<p>✧ &nbsp; 완성된 그림은 바로 다운로드할 수 있어요.</p>}</div>
  </section></div>
  <footer><span>작은 상상으로 발견하는, 조금 다른 나.</span><span>사진은 앱에 저장되지 않아요 · 새로고침하면 결과가 사라져요</span></footer>
 </main>;
}
