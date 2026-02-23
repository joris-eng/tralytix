Engineering Playbook

Objectif

Ce playbook définit les règles minimales pour garantir un flux PR/CI stable, reproductible et sans dette opérationnelle.

⸻

Rôle de make check

make check est le gate unique de qualité du monorepo.
	•	Il exécute les validations API et Web dans un ordre déterministe.
	•	Il doit passer en local avant ouverture ou mise à jour d’une PR.
	•	Il est la référence unique utilisée aussi par la CI GitHub.

Commande standard :

make check


⸻

Workflow PR obligatoire

Chaque contribution suit ce flux, sans exception :
	1.	Créer une branche dédiée à un seul objectif.
	2.	Produire des commits atomiques (une responsabilité par commit).
	3.	Exécuter make check localement.
	4.	Ouvrir la PR avec description claire (pourquoi, quoi, risques/rollback).
	5.	Attendre CI verte.
	6.	Merge uniquement si toutes les conditions de protection sont satisfaites.

⸻

Règles de branch protection (branche main)

La branche main est protégée avec les règles suivantes :
	•	Interdire les pushes directs.
	•	Exiger une Pull Request pour merger.
	•	Exiger que le workflow CI check soit au vert.
	•	Exiger la branche à jour avec main avant merge.
	•	(Recommandé) Exiger au moins 1 review approuvée.

⸻

Interdiction de bypass CI

Tout contournement de la CI est interdit :
	•	Pas de merge avec checks rouges, neutralisés ou ignorés.
	•	Pas de désactivation temporaire de protection pour “passer vite”.
	•	Pas de validation “manuelle” qui remplace make check.

⸻

Règle absolue : CI verte ou pas de merge

Si la CI échoue, la PR n’est pas mergeable.
	•	Corriger la cause racine.
	•	Relancer la CI.
	•	Merger uniquement après retour au vert.

⸻

Principe de petits commits atomiques

Les commits doivent être petits, cohérents et réversibles.
	•	Un commit = un but clair.
	•	Éviter les mélanges (feature + refactor + infra dans le même commit).
	•	Faciliter la revue, le rollback et la traçabilité.

⸻

Checklist PR: branche=1 objectif, commits atomiques, make check local, PR claire, CI verte, merge seulement si protections OK.
