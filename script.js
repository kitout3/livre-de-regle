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

const RULEBOOK_I18N={
  en:{
    "Livre de règles":"Rulebook","Aventure · Territoire · Gloire":"Adventure · Territory · Glory","Édition mise à jour depuis QuAl.xlsx":"Updated edition based on QuAl.xlsx","Consulter les règles":"View the rules","Imprimer / PDF":"Print / PDF","Sommaire":"Contents","Afficher ou masquer le sommaire":"Show or hide contents","Langue":"Language",
    "1. Tour de jeu":"1. Game turn","2. Déplacement":"2. Movement","3. Statistiques":"3. Stats","4. Combat PvE":"4. PvE Combat","5. Combat PvP":"5. PvP Combat","6. Territoires":"6. Territories","7. Mort":"7. Death","8. Quêtes":"8. Quests","9. Objectifs":"9. Objectives","10. Monopoles":"10. Monopolies","11. Personnages":"11. Characters","12. Altération":"12. Alteration","13. Cartes Anomalie":"13. Anomaly Cards","14. Résumé":"14. Summary",
    "Tour de jeu":"Game Turn","Lorsque vient son tour, un joueur peut effectuer les actions suivantes :":"On their turn, a player may perform the following actions:","Jet de déplacement :":"Movement roll:","lancer un D10 et se déplacer du nombre de cases obtenu.":"roll a D10 and move the number of spaces shown.","Jet d’attaque :":"Attack roll:","peut cibler un territoire neutre, un territoire adverse, un territoire possédé, un joueur adverse ou un boss de biome.":"may target a neutral, enemy or owned territory, an opposing player, or a biome boss.","Échange forcé :":"Forced trade:","échange avec un joueur adverse en respectant les ratios de ressources.":"trade with an opposing player while respecting the resource ratios.","Autres actions :":"Other actions:","utiliser une potion, utiliser ses compétences, réaliser des quêtes ou résoudre la case.":"use a potion, use abilities, complete quests, or resolve the space.",
    "Déplacement et critique":"Movement and Critical Roll","Le joueur lance un D10 et se déplace du nombre de cases obtenu.":"The player rolls a D10 and moves the number of spaces shown.","Critique :":"Critical roll:","il récupère le contenu en ressources de la chambre forte.":"the player collects the resources held in the vault.",
    "Dé de statistiques":"Stat Die","Avant un combat, le joueur lance le dé spécial à six faces. Le symbole obtenu détermine la statistique appliquée au calcul du jet d’attaque.":"Before combat, the player rolls the special six-sided die. The symbol rolled determines which stat is used to calculate the attack roll.","Force":"Strength","Endurance":"Endurance","Agilité":"Agility","Perception":"Perception","Intelligence":"Intelligence","Sagesse":"Wisdom","Le dé de statistiques ne détermine pas la réussite. Il sélectionne uniquement le bonus ou malus de statistique utilisé dans le calcul.":"The stat die does not determine success. It only selects the stat bonus or penalty used in the calculation.",
    "Combat PvE":"PvE Combat","Lancer le":"Roll the","dé de statistiques":"stat die","dé d’attaque":"attack die","Calculer la valeur finale : jet d’attaque + modificateur de statistique + bénédictions/malédictions + bonus de personnage + autres modificateurs.":"Calculate the final value: attack roll + stat modifier + blessings/curses + character bonus + other modifiers.","Comparer cette valeur à la difficulté.":"Compare this value with the difficulty.","Réussite":"Success","Si la valeur finale atteint ou dépasse la difficulté, l’attaque réussit.":"If the final value meets or exceeds the difficulty, the attack succeeds.","Échec":"Failure","Si la valeur finale est inférieure à la difficulté, le joueur subit un nombre de dégâts égal à la différence.":"If the final value is below the difficulty, the player takes damage equal to the difference.","Exemple":"Example","Un Chevalier attaque un territoire neutre de difficulté 8. Le dé de statistiques indique Force. Il possède +1 en Force, subit −2 et bénéficie du +1 du Chevalier. Son jet d’attaque donne 5.":"A Knight attacks a neutral territory with difficulty 8. The stat die shows Strength. The Knight has +1 Strength, suffers −2, and receives the Knight’s +1 bonus. The attack roll is 5.","8 − 5 = 3 dégâts":"8 − 5 = 3 damage",
    "Combat PvP":"PvP Combat","Un joueur peut en attaquer un autre s’il se trouve dans le même biome.":"A player may attack another player in the same biome.","Si l’attaque touche, le joueur blessé donne":"If the attack hits, the wounded player gives","1 ressource":"1 resource","au joueur qui l’a attaqué.":"to the attacking player.","Si l’attaque tue, le joueur éliminé donne":"If the attack kills, the eliminated player gives","1 territoire":"1 territory","au joueur qui l’a tué.":"to the player who eliminated them.","Les dégâts causés par les compétences appliquent également ces effets.":"Damage caused by abilities also triggers these effects.",
    "Territoires et conquête":"Territories and Conquest","Les jets d’attaque peuvent cibler un territoire neutre, adverse ou possédé, un joueur adverse ou un boss de biome.":"Attack rolls may target a neutral, enemy or owned territory, an opposing player, or a biome boss.","Les boss ne sont pas considérés comme des territoires.":"Bosses are not considered territories.",
    "Mort d’un joueur":"Player Death","Son tour s’arrête immédiatement.":"Their turn ends immediately.","Il retourne au dernier campement.":"They return to the last camp.","Il peut utiliser gratuitement un seul des pouvoirs du campement.":"They may use one camp power for free.","Il dépose 1 de ses Points de Victoire dans la chambre forte.":"They place 1 of their Victory Points in the vault.",
    "Quêtes":"Quests","Quêtes de charité":"Charity Quests","Ressource":"Resource","Palier 1":"Tier 1","Palier 2":"Tier 2","Palier 3":"Tier 3","Or":"Gold","Cuivre":"Copper","Argent":"Silver","Obsidienne":"Obsidian","Tour de garde :":"Watchtower:","Quêtes de chasse":"Hunting Quests","Biome":"Biome","Monstre 2":"Monster 2","Monstre 4":"Monster 4","Monstre 6":"Monster 6","Cité":"City","Forêt":"Forest","Désert":"Desert","Montagne":"Mountain",
    "Objectifs":"Objectives","Le premier joueur à acheter l’objectif gagne 3 Points de Victoire.":"The first player to purchase the objective gains 3 Victory Points.","Objectif":"Objective","Coût":"Cost","Récompense":"Reward",
    "Monopoles":"Monopolies","À la fin de la partie, le joueur possédant le plus de chaque ressource obtient 3 Points de Victoire : Or, Cuivre, Argent et Obsidienne.":"At the end of the game, the player holding the most of each resource gains 3 Victory Points: Gold, Copper, Silver, and Obsidian.",
    "Personnages":"Characters","Arbalétrier":"Crossbowman","Les jets d’attaque à son initiative peuvent cibler une cible située à un biome d’écart.":"Attack rolls initiated by the Crossbowman may target a character one biome away.","Une fois par tour, peut placer un piège à ours sur sa case. Le prochain joueur qui passe dessus subit 3 dégâts.":"Once per turn, may place a bear trap on the current space. The next player to cross it takes 3 damage.","Lors du décompte final, obtient +1 PV par quête de chasse terminée.":"During final scoring, gains +1 VP per completed hunting quest.","Lors d’une attaque à distance, ne reçoit pas de dégâts de contre-attaque.":"Takes no counterattack damage when attacking at range.",
    "Vicaire":"Vicar","Peut donner une carte Anomalie à un autre joueur au lieu d’en appliquer les effets sur lui-même.":"May give an Anomaly card to another player instead of applying its effects to themself.","Une fois par tour, peut appliquer une bénédiction à un joueur de son choix et lui prend 4 pièces d’or.":"Once per turn, may apply a blessing to a chosen player and take 4 gold coins from them.","Lors du décompte final, obtient +1 PV par quête de charité terminée.":"During final scoring, gains +1 VP per completed charity quest.","À chaque fois qu’une bénédiction est appliquée durant la partie, il pioche une carte.":"Whenever a blessing is applied during the game, the Vicar draws a card.",
    "Hérétique":"Heretic","Peut sacrifier 1 Point de Vie pour choisir la statistique comparée lors d’un jet d’attaque à son initiative.":"May sacrifice 1 Health Point to choose the stat used for an attack roll they initiate.","Une fois par tour, peut appliquer une malédiction à un joueur de son choix et lui vole 3 Points de Vie.":"Once per turn, may curse a chosen player and steal 3 Health Points from them.","Vole +1 Point de Victoire au joueur qu’il élimine.":"Steals +1 Victory Point from a player they eliminate.","Inverse les effets des bénédictions et des malédictions sur lui-même.":"Reverses the effects of blessings and curses applied to themself.",
    "Marchand":"Merchant","Peut acheter les territoires contre un montant de pièces d’or équivalent à la difficulté de conquête.":"May purchase territories for a number of gold coins equal to their conquest difficulty.","Au début de la partie et à chaque passage par la case Départ, obtient une bourse qui donne 4 pièces d’or lorsqu’elle est ouverte.":"At the start of the game and whenever passing the Start space, receives a pouch that grants 4 gold coins when opened.","Lors du décompte final, obtient +1 PV par monopole.":"During final scoring, gains +1 VP per monopoly.","Peut effectuer un échange forcé supplémentaire.":"May perform one additional forced trade.",
    "Chevalier":"Knight","Les jets d’attaque à son initiative bénéficient d’un bonus de +1 contre les territoires neutres.":"Attack rolls initiated by the Knight receive a +1 bonus against neutral territories.","Une fois par tour, peut construire un autel sur un territoire possédé : niveau du territoire +1 et impossibilité pour les autres joueurs de le conquérir.":"Once per turn, may build an altar on an owned territory: the territory gains +1 level and other players cannot conquer it.","Lors du décompte final, obtient +1 PV par territoire possédé.":"During final scoring, gains +1 VP per owned territory.","N’a pas besoin de réussir un jet d’attaque critique pour capturer un territoire adverse.":"Does not need a critical attack roll to capture an enemy territory.",
    "Homme-Bête":"Beastman","Peut effectuer un second jet d’attaque si son premier a échoué.":"May make a second attack roll if the first one fails.","Une fois par tour, pour son prochain jet d’attaque, lance deux dés simultanément et additionne les résultats.":"Once per turn, rolls two dice simultaneously for the next attack and adds the results.","Lors du décompte final, obtient +1 PV par boss de zone éliminé.":"During final scoring, gains +1 VP per defeated area boss.","Recharge une potion lorsqu’il effectue un jet d’attaque critique.":"Recharges a potion after making a critical attack roll.",
    "L’Altération":"The Alteration","Cet événement se déclenche chaque fois qu’un palier est atteint au niveau de la fresque.":"This event is triggered whenever a threshold is reached on the fresco.","Pour chaque joueur, dévoiler une carte Anomalie.":"Reveal one Anomaly card for each player.","Le joueur déclencheur en choisit une et applique immédiatement son effet.":"The triggering player chooses one and immediately applies its effect.","Les autres joueurs choisissent ensuite chacun une anomalie jusqu’à ce que tous aient joué.":"The other players then choose one anomaly each until everyone has played.","Lors de son choix, un joueur peut placer 2 Points de Victoire dans la chambre forte pour appliquer l’effet de l’anomalie à tous les joueurs, lui compris.":"When choosing, a player may place 2 Victory Points in the vault to apply the anomaly’s effect to every player, including themself.",
    "Cartes Anomalie":"Anomaly Cards","Les cartes Anomalie existent pour le joueur actuel, le joueur suivant et le joueur précédent.":"Anomaly cards are available for the current, next, and previous player.","Cartes vertes — effets positifs":"Green cards — positive effects","Cartes rouges — malédictions":"Red cards — curses","Rechargement de compétence":"Ability recharge","Rechargement de potion":"Potion recharge","Bénédiction aléatoire":"Random blessing","Déchargement de compétence":"Ability discharge","Déchargement de potion":"Potion discharge","Malédiction aléatoire":"Random curse",
    "Résumé rapide":"Quick Summary","Déplacement":"Movement","D10, critique = chambre forte.":"D10, critical roll = vault.","Statistique":"Stat","Le symbole sélectionne la statistique.":"The symbol selects the stat.","Attaque":"Attack","Lancer le dé d’attaque.":"Roll the attack die.","Calcul":"Calculation","Ajouter bonus et malus.":"Add bonuses and penalties.","Résolution":"Resolution","Comparer et appliquer l’effet.":"Compare and apply the effect.","◆ Bonne partie à tous ! ◆":"◆ Enjoy the game! ◆",
    "Carte du monde":"World Map","La carte du plateau regroupe les différents biomes, les territoires de difficulté 4, 6 et 8, les campements, les obélisques, les tours de garde, la Cité impériale ainsi que les emplacements des quêtes et des anomalies.":"The board map shows the different biomes, difficulty 4, 6 and 8 territories, camps, obelisks, watchtowers, the Imperial City, and the quest and anomaly locations.","Ouvrir la carte en grand":"Open the full-size map","Carte complète du plateau de jeu":"Complete game board map","Cliquez sur la carte pour l’ouvrir séparément.":"Click the map to open it separately."
  },
  de:{
    "Livre de règles":"Regelbuch","Aventure · Territoire · Gloire":"Abenteuer · Territorium · Ruhm","Édition mise à jour depuis QuAl.xlsx":"Aktualisierte Ausgabe auf Grundlage von QuAl.xlsx","Consulter les règles":"Regeln ansehen","Imprimer / PDF":"Drucken / PDF","Sommaire":"Inhalt","Afficher ou masquer le sommaire":"Inhalt ein- oder ausblenden","Langue":"Sprache",
    "1. Tour de jeu":"1. Spielzug","2. Déplacement":"2. Bewegung","3. Statistiques":"3. Werte","4. Combat PvE":"4. PvE-Kampf","5. Combat PvP":"5. PvP-Kampf","6. Territoires":"6. Gebiete","7. Mort":"7. Tod","8. Quêtes":"8. Quests","9. Objectifs":"9. Ziele","10. Monopoles":"10. Monopole","11. Personnages":"11. Charaktere","12. Altération":"12. Alteration","13. Cartes Anomalie":"13. Anomaliekarten","14. Résumé":"14. Zusammenfassung",
    "Tour de jeu":"Spielzug","Lorsque vient son tour, un joueur peut effectuer les actions suivantes :":"In seinem Zug darf ein Spieler die folgenden Aktionen ausführen:","Jet de déplacement :":"Bewegungswurf:","lancer un D10 et se déplacer du nombre de cases obtenu.":"einen W10 werfen und um die gewürfelte Anzahl Felder ziehen.","Jet d’attaque :":"Angriffswurf:","peut cibler un territoire neutre, un territoire adverse, un territoire possédé, un joueur adverse ou un boss de biome.":"kann auf ein neutrales, gegnerisches oder eigenes Gebiet, einen gegnerischen Spieler oder einen Biom-Boss zielen.","Échange forcé :":"Erzwungener Tausch:","échange avec un joueur adverse en respectant les ratios de ressources.":"mit einem gegnerischen Spieler unter Einhaltung der Ressourcenverhältnisse tauschen.","Autres actions :":"Weitere Aktionen:","utiliser une potion, utiliser ses compétences, réaliser des quêtes ou résoudre la case.":"einen Trank oder Fähigkeiten einsetzen, Quests erfüllen oder das Feld abhandeln.",
    "Déplacement et critique":"Bewegung und kritischer Wurf","Le joueur lance un D10 et se déplace du nombre de cases obtenu.":"Der Spieler wirft einen W10 und zieht um die gewürfelte Anzahl Felder.","Critique :":"Kritischer Wurf:","il récupère le contenu en ressources de la chambre forte.":"Der Spieler erhält die Ressourcen aus der Schatzkammer.",
    "Dé de statistiques":"Wertewürfel","Avant un combat, le joueur lance le dé spécial à six faces. Le symbole obtenu détermine la statistique appliquée au calcul du jet d’attaque.":"Vor einem Kampf wirft der Spieler den besonderen sechsseitigen Würfel. Das gewürfelte Symbol bestimmt den Wert für die Berechnung des Angriffswurfs.","Force":"Stärke","Endurance":"Ausdauer","Agilité":"Beweglichkeit","Perception":"Wahrnehmung","Intelligence":"Intelligenz","Sagesse":"Weisheit","Le dé de statistiques ne détermine pas la réussite. Il sélectionne uniquement le bonus ou malus de statistique utilisé dans le calcul.":"Der Wertewürfel bestimmt nicht den Erfolg. Er wählt nur den für die Berechnung verwendeten Wertebonus oder -malus aus.",
    "Combat PvE":"PvE-Kampf","Lancer le":"Werft den","dé de statistiques":"Wertewürfel","dé d’attaque":"Angriffswürfel","Calculer la valeur finale : jet d’attaque + modificateur de statistique + bénédictions/malédictions + bonus de personnage + autres modificateurs.":"Berechnet den Endwert: Angriffswurf + Wertemodifikator + Segen/Flüche + Charakterbonus + weitere Modifikatoren.","Comparer cette valeur à la difficulté.":"Vergleicht diesen Wert mit der Schwierigkeit.","Réussite":"Erfolg","Si la valeur finale atteint ou dépasse la difficulté, l’attaque réussit.":"Erreicht oder übersteigt der Endwert die Schwierigkeit, ist der Angriff erfolgreich.","Échec":"Fehlschlag","Si la valeur finale est inférieure à la difficulté, le joueur subit un nombre de dégâts égal à la différence.":"Liegt der Endwert unter der Schwierigkeit, erleidet der Spieler Schaden in Höhe der Differenz.","Exemple":"Beispiel","Un Chevalier attaque un territoire neutre de difficulté 8. Le dé de statistiques indique Force. Il possède +1 en Force, subit −2 et bénéficie du +1 du Chevalier. Son jet d’attaque donne 5.":"Ein Ritter greift ein neutrales Gebiet mit Schwierigkeit 8 an. Der Wertewürfel zeigt Stärke. Er hat +1 Stärke, erleidet −2 und erhält den +1-Bonus des Ritters. Sein Angriffswurf ergibt 5.","8 − 5 = 3 dégâts":"8 − 5 = 3 Schaden",
    "Combat PvP":"PvP-Kampf","Un joueur peut en attaquer un autre s’il se trouve dans le même biome.":"Ein Spieler darf einen anderen Spieler angreifen, wenn beide im selben Biom sind.","Si l’attaque touche, le joueur blessé donne":"Trifft der Angriff, gibt der verwundete Spieler","1 ressource":"1 Ressource","au joueur qui l’a attaqué.":"an den angreifenden Spieler.","Si l’attaque tue, le joueur éliminé donne":"Tötet der Angriff, gibt der ausgeschiedene Spieler","1 territoire":"1 Gebiet","au joueur qui l’a tué.":"an den Spieler, der ihn eliminiert hat.","Les dégâts causés par les compétences appliquent également ces effets.":"Durch Fähigkeiten verursachter Schaden löst diese Effekte ebenfalls aus.",
    "Territoires et conquête":"Gebiete und Eroberung","Les jets d’attaque peuvent cibler un territoire neutre, adverse ou possédé, un joueur adverse ou un boss de biome.":"Angriffswürfe dürfen auf ein neutrales, gegnerisches oder eigenes Gebiet, einen gegnerischen Spieler oder einen Biom-Boss zielen.","Les boss ne sont pas considérés comme des territoires.":"Bosse gelten nicht als Gebiete.",
    "Mort d’un joueur":"Tod eines Spielers","Son tour s’arrête immédiatement.":"Sein Zug endet sofort.","Il retourne au dernier campement.":"Er kehrt zum letzten Lager zurück.","Il peut utiliser gratuitement un seul des pouvoirs du campement.":"Er darf eine Lagerfähigkeit kostenlos einsetzen.","Il dépose 1 de ses Points de Victoire dans la chambre forte.":"Er legt 1 seiner Siegpunkte in die Schatzkammer.",
    "Quêtes":"Quests","Quêtes de charité":"Wohltätigkeitsquests","Ressource":"Ressource","Palier 1":"Stufe 1","Palier 2":"Stufe 2","Palier 3":"Stufe 3","Or":"Gold","Cuivre":"Kupfer","Argent":"Silber","Obsidienne":"Obsidian","Tour de garde :":"Wachturm:","Quêtes de chasse":"Jagdquests","Biome":"Biom","Monstre 2":"Monster 2","Monstre 4":"Monster 4","Monstre 6":"Monster 6","Cité":"Stadt","Forêt":"Wald","Désert":"Wüste","Montagne":"Berg",
    "Objectifs":"Ziele","Le premier joueur à acheter l’objectif gagne 3 Points de Victoire.":"Der erste Spieler, der das Ziel kauft, erhält 3 Siegpunkte.","Objectif":"Ziel","Coût":"Kosten","Récompense":"Belohnung",
    "Monopoles":"Monopole","À la fin de la partie, le joueur possédant le plus de chaque ressource obtient 3 Points de Victoire : Or, Cuivre, Argent et Obsidienne.":"Am Spielende erhält der Spieler mit der größten Menge jeder Ressource 3 Siegpunkte: Gold, Kupfer, Silber und Obsidian.",
    "Personnages":"Charaktere","Arbalétrier":"Armbrustschütze","Les jets d’attaque à son initiative peuvent cibler une cible située à un biome d’écart.":"Vom Armbrustschützen ausgelöste Angriffswürfe dürfen ein Ziel in einem angrenzenden Biom treffen.","Une fois par tour, peut placer un piège à ours sur sa case. Le prochain joueur qui passe dessus subit 3 dégâts.":"Einmal pro Zug darf er eine Bärenfalle auf seinem Feld platzieren. Der nächste Spieler, der sie überquert, erleidet 3 Schaden.","Lors du décompte final, obtient +1 PV par quête de chasse terminée.":"Bei der Schlusswertung erhält er +1 SP pro abgeschlossener Jagdquest.","Lors d’une attaque à distance, ne reçoit pas de dégâts de contre-attaque.":"Bei einem Fernangriff erleidet er keinen Gegenangriffsschaden.",
    "Vicaire":"Vikar","Peut donner une carte Anomalie à un autre joueur au lieu d’en appliquer les effets sur lui-même.":"Darf eine Anomaliekarte einem anderen Spieler geben, statt deren Effekte auf sich selbst anzuwenden.","Une fois par tour, peut appliquer une bénédiction à un joueur de son choix et lui prend 4 pièces d’or.":"Einmal pro Zug darf er einem gewählten Spieler einen Segen geben und ihm 4 Goldmünzen abnehmen.","Lors du décompte final, obtient +1 PV par quête de charité terminée.":"Bei der Schlusswertung erhält er +1 SP pro abgeschlossener Wohltätigkeitsquest.","À chaque fois qu’une bénédiction est appliquée durant la partie, il pioche une carte.":"Immer wenn während des Spiels ein Segen angewandt wird, zieht der Vikar eine Karte.",
    "Hérétique":"Ketzer","Peut sacrifier 1 Point de Vie pour choisir la statistique comparée lors d’un jet d’attaque à son initiative.":"Darf 1 Lebenspunkt opfern, um den bei einem eigenen Angriffswurf verglichenen Wert zu wählen.","Une fois par tour, peut appliquer une malédiction à un joueur de son choix et lui vole 3 Points de Vie.":"Einmal pro Zug darf er einen gewählten Spieler verfluchen und ihm 3 Lebenspunkte stehlen.","Vole +1 Point de Victoire au joueur qu’il élimine.":"Stiehlt einem von ihm eliminierten Spieler +1 Siegpunkt.","Inverse les effets des bénédictions et des malédictions sur lui-même.":"Kehrt die Wirkungen von Segen und Flüchen auf sich selbst um.",
    "Marchand":"Händler","Peut acheter les territoires contre un montant de pièces d’or équivalent à la difficulté de conquête.":"Darf Gebiete für eine Anzahl Goldmünzen kaufen, die ihrer Eroberungsschwierigkeit entspricht.","Au début de la partie et à chaque passage par la case Départ, obtient une bourse qui donne 4 pièces d’or lorsqu’elle est ouverte.":"Zu Spielbeginn und bei jedem Passieren des Startfelds erhält er einen Beutel, der beim Öffnen 4 Goldmünzen gewährt.","Lors du décompte final, obtient +1 PV par monopole.":"Bei der Schlusswertung erhält er +1 SP pro Monopol.","Peut effectuer un échange forcé supplémentaire.":"Darf einen zusätzlichen erzwungenen Tausch durchführen.",
    "Chevalier":"Ritter","Les jets d’attaque à son initiative bénéficient d’un bonus de +1 contre les territoires neutres.":"Vom Ritter ausgelöste Angriffswürfe erhalten +1 gegen neutrale Gebiete.","Une fois par tour, peut construire un autel sur un territoire possédé : niveau du territoire +1 et impossibilité pour les autres joueurs de le conquérir.":"Einmal pro Zug darf er auf einem eigenen Gebiet einen Altar bauen: Gebietsstufe +1 und andere Spieler können es nicht erobern.","Lors du décompte final, obtient +1 PV par territoire possédé.":"Bei der Schlusswertung erhält er +1 SP pro eigenem Gebiet.","N’a pas besoin de réussir un jet d’attaque critique pour capturer un territoire adverse.":"Benötigt keinen kritischen Angriffswurf, um ein gegnerisches Gebiet zu erobern.",
    "Homme-Bête":"Tiermensch","Peut effectuer un second jet d’attaque si son premier a échoué.":"Darf einen zweiten Angriffswurf ausführen, wenn der erste fehlschlägt.","Une fois par tour, pour son prochain jet d’attaque, lance deux dés simultanément et additionne les résultats.":"Einmal pro Zug wirft er für seinen nächsten Angriff zwei Würfel gleichzeitig und addiert die Ergebnisse.","Lors du décompte final, obtient +1 PV par boss de zone éliminé.":"Bei der Schlusswertung erhält er +1 SP pro besiegtem Gebiets-Boss.","Recharge une potion lorsqu’il effectue un jet d’attaque critique.":"Lädt bei einem kritischen Angriffswurf einen Trank auf.",
    "L’Altération":"Die Alteration","Cet événement se déclenche chaque fois qu’un palier est atteint au niveau de la fresque.":"Dieses Ereignis wird ausgelöst, sobald auf dem Fresko eine Schwelle erreicht wird.","Pour chaque joueur, dévoiler une carte Anomalie.":"Deckt für jeden Spieler eine Anomaliekarte auf.","Le joueur déclencheur en choisit une et applique immédiatement son effet.":"Der auslösende Spieler wählt eine Karte und wendet ihren Effekt sofort an.","Les autres joueurs choisissent ensuite chacun une anomalie jusqu’à ce que tous aient joué.":"Danach wählen die anderen Spieler jeweils eine Anomalie, bis jeder an der Reihe war.","Lors de son choix, un joueur peut placer 2 Points de Victoire dans la chambre forte pour appliquer l’effet de l’anomalie à tous les joueurs, lui compris.":"Bei seiner Wahl darf ein Spieler 2 Siegpunkte in die Schatzkammer legen, um den Effekt der Anomalie auf alle Spieler einschließlich sich selbst anzuwenden.",
    "Cartes Anomalie":"Anomaliekarten","Les cartes Anomalie existent pour le joueur actuel, le joueur suivant et le joueur précédent.":"Anomaliekarten gibt es für den aktuellen, den nächsten und den vorherigen Spieler.","Cartes vertes — effets positifs":"Grüne Karten — positive Effekte","Cartes rouges — malédictions":"Rote Karten — Flüche","Rechargement de compétence":"Fähigkeit aufladen","Rechargement de potion":"Trank aufladen","Bénédiction aléatoire":"Zufälliger Segen","Déchargement de compétence":"Fähigkeit entladen","Déchargement de potion":"Trank entladen","Malédiction aléatoire":"Zufälliger Fluch",
    "Résumé rapide":"Kurzübersicht","Déplacement":"Bewegung","D10, critique = chambre forte.":"W10, kritischer Wurf = Schatzkammer.","Statistique":"Wert","Le symbole sélectionne la statistique.":"Das Symbol wählt den Wert aus.","Attaque":"Angriff","Lancer le dé d’attaque.":"Werft den Angriffswürfel.","Calcul":"Berechnung","Ajouter bonus et malus.":"Addiert Boni und Mali.","Résolution":"Auswertung","Comparer et appliquer l’effet.":"Vergleicht und wendet den Effekt an.","◆ Bonne partie à tous ! ◆":"◆ Viel Spaß beim Spielen! ◆",
    "Carte du monde":"Weltkarte","La carte du plateau regroupe les différents biomes, les territoires de difficulté 4, 6 et 8, les campements, les obélisques, les tours de garde, la Cité impériale ainsi que les emplacements des quêtes et des anomalies.":"Die Spielplan-Karte zeigt die verschiedenen Biome, Gebiete der Schwierigkeitsgrade 4, 6 und 8, Lager, Obelisken, Wachtürme, die Kaiserstadt sowie die Positionen von Quests und Anomalien.","Ouvrir la carte en grand":"Karte in voller Größe öffnen","Carte complète du plateau de jeu":"Vollständige Spielplan-Karte","Cliquez sur la carte pour l’ouvrir séparément.":"Klickt auf die Karte, um sie separat zu öffnen."
  }
};

const SIMPLE_REPLACEMENTS={
  en:[["Points de Vie","Health Points"],["Point de Vie","Health Point"],["Points de Victoire","Victory Points"],["Point de Victoire","Victory Point"],["Gain de","Gain of"],["Perte de","Loss of"],["pièces d’or","gold coins"],["Icône ","Icon "],["Cuivre","Copper"],["Argent","Silver"],["Obsidienne","Obsidian"],[" Or"," Gold"],[" PV"," VP"]],
  de:[["Points de Vie","Lebenspunkte"],["Point de Vie","Lebenspunkt"],["Points de Victoire","Siegpunkte"],["Point de Victoire","Siegpunkt"],["Gain de","Gewinn:"],["Perte de","Verlust:"],["pièces d’or","Goldmünzen"],["Icône ","Symbol "],["Cuivre","Kupfer"],["Argent","Silber"],["Obsidienne","Obsidian"],[" Or"," Gold"],[" PV"," SP"]]
};

const originalText=new WeakMap();
const originalAttributes=new WeakMap();

function translateValue(value,language){
  if(language==='fr') return value;
  const exact=RULEBOOK_I18N[language]?.[value];
  if(exact) return exact;
  let translated=value;
  for(const [source,target] of SIMPLE_REPLACEMENTS[language]||[]) translated=translated.split(source).join(target);
  return translated;
}

function captureTranslatableContent(){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let node;
  while(node=walker.nextNode()){
    if(node.parentElement?.closest('.language-switcher')) continue;
    const trimmed=node.nodeValue.trim();
    if(trimmed) originalText.set(node,{raw:node.nodeValue,trimmed});
  }
  document.querySelectorAll('[aria-label],[title],[alt]').forEach(element=>{
    const values={};
    ['aria-label','title','alt'].forEach(name=>{if(element.hasAttribute(name)) values[name]=element.getAttribute(name);});
    originalAttributes.set(element,values);
  });
}

function applyLanguage(language){
  document.documentElement.lang=language;
  localStorage.setItem('rulebook-language',language);
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let node;
  while(node=walker.nextNode()){
    const source=originalText.get(node);
    if(!source) continue;
    node.nodeValue=source.raw.replace(source.trimmed,translateValue(source.trimmed,language));
  }
  document.querySelectorAll('[aria-label],[title],[alt]').forEach(element=>{
    const values=originalAttributes.get(element);
    if(!values) return;
    Object.entries(values).forEach(([name,value])=>element.setAttribute(name,translateValue(value,language)));
  });
  const titles={fr:'Livre de règles',en:'Rulebook',de:'Regelbuch'};
  const descriptions={fr:'Livret de règles complet du jeu',en:'Complete game rulebook',de:'Vollständiges Regelbuch des Spiels'};
  document.title=titles[language];
  document.querySelector('meta[name="description"]')?.setAttribute('content',descriptions[language]);
  document.querySelectorAll('.language-switcher button').forEach(button=>button.classList.toggle('active',button.dataset.language===language));
}

function initializeLanguages(){
  const selector=document.createElement('div');
  selector.className='language-switcher';
  selector.setAttribute('role','group');
  selector.setAttribute('aria-label','Langue');
  selector.innerHTML='<button type="button" data-language="fr" title="Français">🇫🇷 FR</button><button type="button" data-language="en" title="English">🇬🇧 EN</button><button type="button" data-language="de" title="Deutsch">🇩🇪 DE</button>';
  document.body.appendChild(selector);
  captureTranslatableContent();
  selector.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>applyLanguage(button.dataset.language)));
  const saved=localStorage.getItem('rulebook-language');
  applyLanguage(['fr','en','de'].includes(saved)?saved:'fr');
}

harmonizeCharacterText();
enrichRulebook()
  .catch(error=>console.error('Chargement des visuels impossible :',error))
  .finally(initializeLanguages);
