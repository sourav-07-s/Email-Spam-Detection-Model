// ── THEME TOGGLE ──
const html = document.documentElement;
const toggle = document.getElementById('theme-toggle');

// Load saved preference
const saved = localStorage.getItem('spamshield-theme') || 'light';
html.setAttribute('data-theme', saved);

toggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('spamshield-theme', next);
});

// ── RULES ENGINE ──
const RULES=[
  {id:'spam_kw',sev:'HIGH',pts:35,label:'Spam keywords detected',type:'bad',
   pattern:/\b(free|win|winner|won|prize|gift|reward|bonus|lucky|congratulations|selected|exclusive|giveaway)\b/gi,
   desc:m=>m.length?m.map(w=>`"${w.toLowerCase()}"`).join(', '):null},
  {id:'urgency',sev:'MEDIUM',pts:18,label:'Urgency / pressure tactics',type:'bad',
   pattern:/\b(urgent|immediately|act now|limited time|expires|don.t wait|hurry|asap|24 hours)\b/gi,
   desc:m=>m.length?m.map(w=>w.toLowerCase()).join(', '):null},
  {id:'phishing',sev:'HIGH',pts:22,label:'Phishing language',type:'bad',
   pattern:/\b(verify your account|confirm your email|update your (payment|billing|card|details)|account (suspended|locked|disabled))\b/gi,
   desc:m=>m.length?m.map(w=>w.toLowerCase()).join(', '):null},
  {id:'tld',sev:'HIGH',pts:18,label:'Suspicious sender domain',type:'bad',
   pattern:/@[a-z0-9-]+\.(xyz|tk|ml|ga|cf|gq|top|click|win|loan|work|bid|download)/gi,
   desc:m=>m.length?`Domain ends in .${m[0].split('.').pop()}`:null},
  {id:'punct',sev:'LOW',pts:10,label:'Excessive punctuation',type:'bad',
   pattern:/[!?]{2,}/g,
   desc:(m,text)=>{const e=(text.match(/!/g)||[]).length,q=(text.match(/\?/g)||[]).length;return e+q>2?`${e} exclamation${e!==1?'s':''}, ${q} question mark${q!==1?'s':''}`:null;}},
  {id:'shortener',sev:'MEDIUM',pts:9,label:'URL shortener detected',type:'bad',
   pattern:/https?:\/\/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|rb\.gy)[^\s]*/gi,
   desc:m=>m.length?m.map(u=>{try{return new URL(u).hostname}catch{return u}})[0]:null},
  {id:'money',sev:'LOW',pts:8,label:'Money amounts mentioned',type:'bad',
   pattern:/\$[\d,]+(\.\d{2})?|\b\d+% off\b|\bfree cash\b/gi,
   desc:m=>m.length?[...new Set(m)].join(', '):null},
  {id:'greeting',sev:'LOW',pts:8,label:'Generic impersonal greeting',type:'bad',
   pattern:/\b(dear (friend|user|customer|valued|sir|madam)|hello there|dear winner|dear member)\b/gi,
   desc:()=>'Impersonal salutation detected'},
  {id:'scheme',sev:'HIGH',pts:20,label:'Make-money scheme language',type:'bad',
   pattern:/\b(make money|earn cash|extra income|passive income|work from home|financial freedom|get rich)\b/gi,
   desc:m=>m.length?m.map(w=>w.toLowerCase()).join(', '):null},
  {id:'sensitive',sev:'HIGH',pts:25,label:'Requests sensitive info',type:'bad',
   pattern:/\b(password|ssn|social security|credit card|bank account|routing number|cvv|pin number)\b/gi,
   desc:m=>m.length?m.map(w=>w.toLowerCase()).join(', '):null},
  {id:'allcaps',sev:'LOW',pts:8,label:'Excessive capitalisation',type:'bad',
   pattern:/\b[A-Z]{4,}\b/g,
   desc:m=>m.length>=2?[...new Set(m)].slice(0,5).join(', '):null},
  {id:'unsub',sev:'GOOD',pts:-10,label:'Unsubscribe link present',type:'good',
   pattern:/\b(unsubscribe|opt.?out|remove me|manage preferences)\b/gi,
   desc:()=>'Legitimate emails usually include this'},
];

function quickScore(sender,body){
  const full=sender+' '+body;
  let score=0;
  RULES.forEach(rule=>{
    const raw=[...full.matchAll(rule.pattern)].map(m=>m[0]);
    const uniq=[...new Set(raw.map(s=>s.toLowerCase()))];
    if(!uniq.length)return;
    const descStr=rule.desc(uniq,full);
    if(descStr===null)return;
    score+=rule.pts;
  });
  return Math.max(0,Math.min(100,score));
}

function updateDetector(){
  const sender=document.getElementById('sender').value.trim();
  const body=document.getElementById('body').value.trim();
  const fill=document.getElementById('det-fill');
  const dot=document.getElementById('det-dot');
  const txt=document.getElementById('det-text');
  const pct=document.getElementById('det-pct');
  if(!sender&&!body){
    fill.style.width='0%';fill.style.background='var(--hint)';
    dot.style.background='var(--hint)';txt.style.color='var(--hint)';
    txt.textContent='Start typing to detect…';pct.textContent='';return;
  }
  const score=quickScore(sender,body);
  fill.style.width=score+'%';
  let color,label;
  if(score>=50){color='var(--red)';label='Likely spam';}
  else if(score>=25){color='var(--amber)';label='Suspicious';}
  else if(score>0){color='#ca8a04';label='Low risk';}
  else{color='var(--green)';label='No signals detected';}
  fill.style.background=color;dot.style.background=color;
  txt.style.color=color;txt.textContent=label;
  pct.textContent=score>0?score+' / 100':'';
}

['sender','body'].forEach(id=>{
  document.getElementById(id).addEventListener('input',updateDetector);
});

function countLinks(t){return(t.match(/https?:\/\/[^\s]+/g)||[]).length;}
function countWords(t){return t.trim()?t.trim().split(/\s+/).length:0;}

function analyze(sender,body){
  const full=sender+' '+body;
  const triggered=[];let score=0;
  RULES.forEach(rule=>{
    const raw=[...full.matchAll(rule.pattern)].map(m=>m[0]);
    const uniq=[...new Set(raw.map(s=>s.toLowerCase()))];
    if(!uniq.length)return;
    const descStr=rule.desc(uniq,full);
    if(descStr===null)return;
    triggered.push({...rule,descStr});
    score+=rule.pts;
  });
  score=Math.max(0,Math.min(100,score));
  let verdict,cls,sub;
  if(score>=50){verdict='Spam detected';cls='spam';sub='Multiple strong spam signals — do not engage.';}
  else if(score>=25){verdict='Suspicious email';cls='suspicious';sub='Some warning signals detected — proceed with caution.';}
  else{verdict='Looks safe';cls='safe';sub='No significant spam signals found.';}
  const confidence=Math.min(99,Math.max(58,score+Math.floor(Math.random()*8)));
  return{score,verdict,cls,sub,triggered,confidence,links:countLinks(full),words:countWords(body)};
}

function scoreColor(s){if(s>=50)return'var(--red)';if(s>=25)return'var(--amber)';return'var(--green)';}

function showToast(cls,msg){
  const t=document.getElementById('toast');
  t.className='toast '+cls;
  document.getElementById('toast-msg').textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3500);
}

function render(res){
  document.getElementById('empty-state').style.display='none';
  document.getElementById('results').style.display='block';
  const banner=document.getElementById('verdict-banner');
  banner.className='verdict-banner '+res.cls;
  document.getElementById('verdict-card').className='verdict-card '+res.cls;
  const icon=document.getElementById('v-icon');
  icon.className=res.cls==='spam'?'ti ti-x':res.cls==='safe'?'ti ti-check':'ti ti-alert-triangle';
  document.getElementById('v-label').textContent=res.verdict;
  document.getElementById('v-sub').textContent=res.sub;
  document.getElementById('v-conf').textContent=res.confidence;
  document.getElementById('score-text').textContent=res.score+' / 100';
  const fill=document.getElementById('score-fill');
  fill.style.background=scoreColor(res.score);
  requestAnimationFrame(()=>{fill.style.width=res.score+'%';});
  document.getElementById('stat-links').textContent=res.links;
  document.getElementById('stat-words').textContent=res.words;
  document.getElementById('stat-rules').textContent=res.triggered.length;
  document.getElementById('rules-count').textContent=res.triggered.length+' signal'+(res.triggered.length!==1?'s':'');
  const list=document.getElementById('rule-list');
  list.innerHTML='';
  if(!res.triggered.length){
    list.innerHTML='<div style="padding:1.25rem 1.5rem;font-size:13px;color:var(--muted);">No rules triggered — the email appears clean.</div>';
  } else {
    const sorted=[...res.triggered].sort((a,b)=>b.pts-a.pts);
    sorted.forEach(rule=>{
      const ptsClass=rule.type==='good'?'good':rule.pts>=18?'bad':'med';
      const sign=rule.pts>=0?'+':'';
      const el=document.createElement('div');
      el.className='rule-row';
      el.innerHTML=`<span class="sev-badge ${rule.sev}">${rule.sev}</span><div><div class="rule-name">${rule.label}</div><div class="rule-desc">${rule.descStr}</div></div><div class="rule-pts ${ptsClass}">${sign}${rule.pts}</div>`;
      list.appendChild(el);
    });
  }
  showToast(res.cls,'Analysis complete — '+res.verdict);
}

const SAMPLE={
  sender:'rewards-team@account-verify.xyz',
  body:`Dear Customer,\n\nCongratulations!! You have been selected as the WINNER of our exclusive $1,000 gift card giveaway. This is a LIMITED TIME offer and expires in 24 hours.\n\nClick here to claim your prize immediately:\nhttp://bit.ly/claim-now-9921\n\nAct fast — don't miss out on this once in a lifetime opportunity. Your account will be suspended if you do not verify your details within 24 hours.\n\nTo claim your free cash reward, we need you to confirm your credit card number and CVV.\n\nBest regards,\nThe Rewards Team`
};

document.getElementById('load-sample').addEventListener('click',()=>{
  document.getElementById('sender').value=SAMPLE.sender;
  document.getElementById('body').value=SAMPLE.body;
  updateDetector();
});

document.getElementById('scan-btn').addEventListener('click', async ()=>{

    const sender =
        document.getElementById('sender').value.trim();

    const body =
        document.getElementById('body').value.trim();

    if(!sender && !body){
        return;
    }

    const btn =
        document.getElementById('scan-btn');

    btn.disabled = true;

    btn.innerHTML =
        '<span class="spinner"></span> Analyzing...';

    try{

        const response =
            await fetch('/predict',{

                method:'POST',

                headers:{
                    'Content-Type':'application/json'
                },

                body:JSON.stringify({
                    sender:sender,
                    body:body
                })

            });

        const data =
            await response.json();

        document.getElementById('empty-state')
            .style.display='none';

        document.getElementById('results')
            .style.display='block';

        document.getElementById('v-label')
            .innerText=data.prediction;

        document.getElementById('v-conf')
            .innerText=data.confidence;

        document.getElementById('stat-words')
            .innerText=data.words;

        document.getElementById('stat-links')
            .innerText='0';

        document.getElementById('stat-rules')
            .innerText='0';

    }

    catch(error){

        alert("Backend Error");

    }

    btn.disabled = false;

    btn.innerHTML =
        '<i class="ti ti-scan"></i> Analyze email';

});

document.getElementById('clear-btn').addEventListener('click',()=>{
  ['sender','body'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('empty-state').style.display='flex';
  document.getElementById('results').style.display='none';
  document.getElementById('score-fill').style.width='0';
  updateDetector();
});