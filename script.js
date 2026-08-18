const menuBtn=document.getElementById('menuBtn');
const sidebar=document.querySelector('.sidebar');
menuBtn?.addEventListener('click',()=>sidebar.classList.toggle('open'));
document.querySelectorAll('.sidebar a').forEach(a=>a.addEventListener('click',()=>sidebar.classList.remove('open')));
document.getElementById('printBtn')?.addEventListener('click',()=>window.print());

function harmonizeCharacterText(){
  document.querySelectorAll('.character').forEach(card=>{
    const title=card.querySelector('h3')?.textContent.trim();
    if(title==='Vicaire'){
      card.querySelectorAll('li').forEach(li=>{
        li.innerHTML=li.innerHTML.replace('le Vicaire pioche une carte','il pioche une carte');
      });
    }
  });
}

async function loadBase64(path){
  const response=await fetch(path,{cache:'no-store'});
  if(!response.ok) throw new Error(`Impossible de charger ${path}`);
  return (await response.text()).trim();
}

async function enrichRulebook(){
  const [stats64,map64]=await Promise.all([
    loadBase64('assets/stats-sprite.b64'),
    loadBase64('assets/map.b64')
  ]);
  const statsUrl=`data:image/webp;base64,${stats64}`;
  const mapUrl=`data:image/webp;base64,${map64}`;

  const style=document.createElement('style');
  style.textContent=`
    .stats{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:1rem!important}
    .stats .stat-icon{margin:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:.55rem!important;padding:.65rem!important;border:1px solid var(--line)!important;background:#f7f1e5!important;border-radius:6px!important}
    .stats .stat-picture{display:block!important;width:70%!important;max-width:154px!important;height:auto!important;aspect-ratio:1/1!important;padding:0!important;border:0!important;background-color:transparent!important;background-image:url('${statsUrl}')!important;background-size:300% 200%!important;background-repeat:no-repeat!important}
    .stats .stat-icon figcaption{font-weight:700;font-size:.9rem}
    .map-chapter{text-align:center;border-top:5px solid var(--gold)}
    .map-chapter>p{text-align:left}
    .map-frame{display:block;margin:0 auto;padding:.65rem;background:#e7e0d3;border:1px solid var(--line);overflow:auto;width:70%;max-width:532px}
    .world-map{display:block;width:100%;height:auto;image-rendering:auto}
    .map-help{text-align:center!important;color:var(--muted);font-size:.86rem;margin-bottom:0}
    @media(max-width:700px){.stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}.map-frame{padding:.25rem;width:70%}}
  `;
  document.head.appendChild(style);

  const stats=document.querySelector('.stats');
  if(stats){
    const items=[
      ['Force','0% 0%'],['Endurance','50% 0%'],['Agilité','100% 0%'],
      ['Perception','0% 100%'],['Intelligence','50% 100%'],['Sagesse','100% 100%']
    ];
    stats.innerHTML=items.map(([name,pos])=>`<figure class="stat-icon"><div class="stat-picture" style="background-position:${pos}" role="img" aria-label="Icône ${name}"></div><figcaption>${name}</figcaption></figure>`).join('');
  }

  const main=document.querySelector('main');
  if(main&&!document.getElementById('carte')){
    const section=document.createElement('section');
    section.id='carte';
    section.className='chapter map-chapter';
    section.innerHTML=`<span class="chapter-number">MAP</span><h2>Carte du monde</h2><p>La carte du plateau regroupe les différents biomes, les territoires de difficulté 4, 6 et 8, les campements, les obélisques, les tours de garde, la Cité impériale ainsi que les emplacements des quêtes et des anomalies.</p><a class="map-frame" href="${mapUrl}" target="_blank" rel="noopener" title="Ouvrir la carte en grand"><img class="world-map" src="${mapUrl}" alt="Carte complète du plateau de jeu"></a><p class="map-help">Cliquez sur la carte pour l’ouvrir séparément.</p>`;
    main.prepend(section);
  }

  const nav=document.querySelector('#sommaire');
  if(nav&&!nav.querySelector('a[href="#carte"]')){
    const link=document.createElement('a');
    link.href='#carte';
    link.textContent='Carte du monde';
    nav.prepend(link);
  }
}

harmonizeCharacterText();
enrichRulebook().catch(error=>console.error('Chargement des visuels impossible :',error));