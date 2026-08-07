NCR Portfolio V10.1 — SILK MOTION
=================================
Base : V10 Magnetic Stack conservée.

Objectif de cette version :
- rendre l'ensemble plus élégant, calme et premium ;
- rendre le scroll de la pile de projets beaucoup plus fluide ;
- réduire les effets visuels trop agressifs ;
- limiter les calculs/layout pendant le scroll.

Principales évolutions :
- interpolation inertielle de la progression du Magnetic Stack ;
- métriques de scroll mises en cache au lieu de relire le layout à chaque frame ;
- arrivée des cartes moins violente et plus "gallery object" ;
- empilement plus fin avec profondeur réduite ;
- progression via transform:scaleX (GPU) ;
- effets de halo et de profondeur allégés ;
- carrousel Azzera avec perspective plus subtile ;
- robot du hero plus lent et moins nerveux ;
- étoiles/étoiles filantes conservées mais plus discrètes ;
- animations mises en pause lorsque l'onglet est caché ;
- cache-busting v=10.1.0.
