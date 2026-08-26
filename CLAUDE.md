# Stellar Academy

Outil interne de formation, évaluation et suivi des conseillers en gestion de patrimoine du cabinet **Stellar Invest**. Utilisé par la direction, les managers et les conseillers.

Développé et maintenu par Stellar IT (pôle de développement interne). Interlocuteur : Benjamin Rizzi, président.

---

## Architecture

Application **single-file** : tout le HTML, le CSS et le JavaScript tiennent dans `index.html`. Pas de framework, pas de build, pas de bundler. C'est volontaire — le déploiement se résume à pousser un fichier.

```
index.html        Application complète (~235 Ko)
api/analyze.js    Proxy serverless Vercel pour l'API Anthropic
vercel.json       Configuration de déploiement
```

**Backend** : Supabase (PostgreSQL) — `https://bkrzqitbzedmuwvuqxth.supabase.co`
**Hébergement** : Vercel, déploiement automatique à chaque push sur `main`
**IA** : API Anthropic (`claude-sonnet-4-6`) via le proxy serverless

---

## Règles absolues

**Ne jamais mettre de clé API dans `index.html`.** La clé Anthropic vit uniquement dans la variable d'environnement `ANTHROPIC_API_KEY` sur Vercel. Toute clé poussée sur GitHub est détectée et révoquée automatiquement — cette erreur a déjà cassé la production deux fois.

**Vérifier la syntaxe avant chaque commit.** Le fichier est volumineux et une erreur JavaScript casse toute l'application, y compris l'écran de connexion :

```bash
node -e "const fs=require('fs');const h=fs.readFileSync('index.html','utf8');const s=h.indexOf('<script>');const e=h.lastIndexOf('</script>');fs.writeFileSync('/tmp/check.js',h.slice(s+8,e));"
node --check /tmp/check.js
```

**Le bloc `<script>` doit toujours se trouver avant `</body>`.** Un script placé après `</html>` s'affiche comme du texte brut dans le navigateur — plusieurs pannes ont eu cette cause.

**Interface intégralement en français.** Libellés, messages, dates au format `JJ/MM/AA`, montants en euros. Éviter les caractères accentués dans les chaînes JavaScript (préférer « Acces » à « Accès ») — les apostrophes et accents ont provoqué des erreurs de syntaxe à répétition.

---

## Pièges connus

Ces erreurs se sont produites plusieurs fois. Elles se ressemblent toutes : des guillemets qui s'emboîtent mal.

**Apostrophes françaises dans les chaînes JavaScript.** `'L'analyse'` casse le parsing. Écrire `'L&#39;analyse'` en HTML, ou reformuler.

**Chaînes adjacentes dans les attributs `onclick`.** Le motif `onclick="fn(''+id+'')"` produit une `SyntaxError`. Passer par des attributs de données :

```javascript
'<button data-id="' + item.id + '" onclick="maFonction(this.dataset.id)">'
```

**Construction de gros blocs HTML.** Au-delà de quelques niveaux d'imbrication, préférer l'API DOM (`createElement`, `appendChild`, `onclick = function(){}`) à la concaténation de chaînes. Plus verbeux, mais élimine toute une classe de bugs.

**Vérification par `new Function()`.** Donne des faux positifs sur le code `async`/`await`. Utiliser `node --check`, qui est fiable.

---

## Charte graphique

```
--n   #0F1824   Bleu nuit    Couleur principale, textes, fonds sombres
--ow  #FFF4E9   Beige clair  Fonds de page, zones de lecture
--g   #E2F67E   Vert         Accent uniquement
```

Le vert sert exclusivement aux boutons d'action, badges, KPI, statuts positifs et éléments actifs sur fond sombre. **Jamais de texte vert sur fond blanc** — le contraste est insuffisant. Les titres de section sont en bleu nuit.

Le logo est un « S » stylisé, encodé en base64 dans le fichier, affiché en pastille beige sur fond bleu nuit.

---

## Rôles et accès

**Administrateur** (Benjamin Rizzi) — accès complet, paramètres, tous les conseillers.
**Manager** — uniquement ses conseillers affiliés, peut évaluer, pas d'accès aux paramètres.
**Conseiller** — son espace personnel en lecture seule. Ne voit jamais les synthèses ni les commentaires privés des managers.

L'authentification est volontairement simple : objet `USERS` en dur pour l'admin et les managers, colonne `pwd` sur la table `conseillers` (créé à la première connexion). **Ne pas migrer vers Supabase Auth** — décision explicite de Benjamin.

Un manager peut aussi être conseiller : la colonne `managers.cons_id` pointe alors vers sa fiche.

---

## Tables Supabase

Toutes ont RLS activé avec une policy permissive `allow_all`.

| Table | Rôle |
|---|---|
| `conseillers` | Fiches conseillers (`pwd`, `active`, `observable`, `statut`, `freq`) |
| `evaluations` | Drills, écoutes, oraux, analyses IA (`edit_log`, `source`, `ai_report`) |
| `managers` | Managers et leurs équipes (`team` jsonb, `active`, `observable`, `cons_id`) |
| `planning` | Évaluations planifiées (`deleted` pour la corbeille) |
| `config` | Clé/valeur : `blocs`, `weights`, `objections`, `kb` |
| `suivi_managerial` | Points mensuels et commentaires |
| `rh_entries` | Points d'intégration et annuels |
| `analyses_junior` | Analyses de RDV rédigées par les conseillers juniors |
| `eval_snapshots` | Sauvegardes avant modification |
| `modification_log` | Traçabilité des corrections |
| `ia_errors` | Journal technique des erreurs d'analyse IA |
| `objections_suggestions` | Suggestions d'objections en attente de validation |

---

## Modules

**Dashboard** — KPI, alertes, dernières évaluations.
**Équipe** — tableau triable avec recherche et filtres (manager, niveau, statut).
**Fiche conseiller** — six onglets : Évaluations, Planning, Suivi, Évolution, Analyses de RDV, Historique complet.
**Évaluation** — grille par blocs, scoring pondéré par type de RDV, objections, synthèse.
**Analyse IA** — retranscription comparée à la base de connaissances du cabinet, scores ajustables avant enregistrement.
**Planning** — vues semaine et mois, édition inline, corbeille avec restauration.
**Paramètres** (admin) — blocs et scripts, managers, pondérations, objections, suggestions, contrôle, base de connaissances IA.

---

## Manière de travailler avec Benjamin

Style direct, réponses concises, pas de préambule. Il tranche vite et préfère une solution livrable aujourd'hui à une architecture parfaite dans un mois.

Ne poser que les questions réellement bloquantes — au maximum deux ou trois, et seulement si la réponse change la conception. Sur le reste, décider et annoncer le choix.

Livrer un fichier complet et vérifié, pas des fragments. Après modification : vérification syntaxique, puis commit et push.

Challenger les spécifications quand elles peuvent être améliorées. Il préfère un désaccord argumenté à une exécution complaisante.

---

## Déploiement

```bash
node --check /tmp/check.js    # après extraction du script
git add -A
git commit -m "Description courte de la modification"
git push
```

Vercel redéploie en une trentaine de secondes. Vérifier ensuite dans le navigateur avec un rechargement forcé (Cmd + Shift + R).

Si des tables ou colonnes changent, **fournir le SQL avant de livrer le code** — Benjamin l'exécute dans l'éditeur SQL de Supabase.
