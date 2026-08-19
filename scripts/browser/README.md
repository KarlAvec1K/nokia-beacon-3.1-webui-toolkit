# Browser scripts — mode d’emploi

## Script recommandé : un seul copier-coller

Pour l’inventaire global, utilise :

- [comprehensive-passive-inventory.js](https://github.com/KarlAvec1K/nokia-beacon-3.1-webui-toolkit/blob/main/scripts/browser/comprehensive-passive-inventory.js)

C’est le script omnibus. Il :

- découvre les bundles JavaScript same-origin jusqu’à 250 fichiers;
- ne les exécute pas;
- inspecte les rôles, guards, routes, resolvers, permissions et mappings CGI;
- couvre GenericService/UBUS, command CGI, radio access, conteneurs, RRM, optimisation Wi-Fi, STA, mesh et modèles LAN;
- extrait les méthodes frontend ciblées;
- ne lit pas le stockage navigateur;
- ne lit pas les réponses runtime;
- n’appelle aucun CGI;
- ne change aucune configuration.

Le JSON est limité pour rester copiable : les occurrences par catégorie et les méthodes sont plafonnées, tandis que les compteurs indiquent si une section a été tronquée.

## Consignes d’utilisation

1. Ouvrir la WebUI du Beacon dans le navigateur déjà connecté.
2. Ouvrir DevTools → Console.
3. Copier-coller tout le contenu de `comprehensive-passive-inventory.js`.
4. Envoyer uniquement le JSON produit.
5. Ne pas copier les tokens, cookies, PSK, SSID privés, MAC, numéros de série ou valeurs de réponse.

Le script peut retourner une erreur `zone.js 404` pendant la découverte : cela correspond généralement à un fichier de support absent et n’empêche pas l’inventaire des bundles applicatifs.

## Scripts spécialisés conservés

Les scripts spécialisés restent dans ce dossier pour reproduire une seule branche ou réduire le volume de sortie :

- `all-js-command-cgi-inventory.js`
- `all-js-route-permission-inventory.js`
- `authorizedcgi-stability-check.js`
- `container-management-source-inventory.js`
- `container-visibility-source-inventory.js`
- `deep-route-resolver-inventory.js`
- `hidden-feature-read-shape-probe.js`
- `radio-access-capability-acl-check.js`
- `radio-access-source-inventory.js`
- `resolver-alias-map.js`
- `route-resolver-action-inventory.js`
- `rrm-optimization-method-extractor.js`
- `rrm-source-inventory.js`
- `service-function-function-inventory.js`
- `service-function-source-inventory.js`
- `sta-info-parser-inventory.js`
- `sta-info2-consumer-model-inventory.js`
- `targeted-route-guard-role-map.js`

Les sondes runtime de lecture seule restent séparées et ne sont pas incluses dans l’omnibus, afin qu’aucune requête réseau ne soit déclenchée par inadvertance :

- `client-capabilities.js`
- `genericservice-probe-getwebdbflag.js`
- `hidden-feature-read-shape-probe.js`
- `radio-access-capability-acl-check.js`
- `runtime-read-probe.js`
- `authorizedcgi-stability-check.js`

Les appels POST mutateurs (RRM, Optimize Network, command CGI et cycle de vie conteneur) ne sont jamais inclus dans le script global.
