// contenu.js — LE fichier à modifier pour changer un texte ou une durée.
//
// scenes : début de chaque scène, en secondes. Les animations 3D de chaque scène sont calées sur ces débuts.
// textes : chaque texte a sa scène (1 à 9) et ses temps d'entrée / de sortie, en secondes depuis le début de la scène.
//   zone "titre" : grand titre en haut ; "haut" : texte en haut de l'écran ; "bas" : carte blanche en bas de l'écran ;
//   "liste" : carte en bas avec des lignes qui apparaissent une par une.
// Après une modification : npm run preview (images fixes), puis npm run render (vidéo).
window.REEL = {
  fps: 30,
  duration: 59.5,
  scenes: [0, 4.0, 10.5, 19.0, 25.0, 31.5, 38.0, 45.0, 55.0],

  textes: [
    { scene: 1, zone: 'titre', in: 0.5, out: 3.85, texte: 'Comment purger ses radiateurs ?' },

    { scene: 2, zone: 'haut', in: 0.2, out: 6.35, texte: 'Il vous faut :' },
    { scene: 2, zone: 'liste', in: 0.6, out: 6.35, lignes: [
      { in: 0.6, texte: 'Une clé de purge (ou un tournevis plat)' },
      { in: 2.1, texte: 'Un petit récipient ou une bassine' },
      { in: 3.6, texte: 'Un chiffon ou une serviette' },
    ] },

    { scene: 3, zone: 'haut', in: 0.2, out: 8.35, texte: '1. Éteignez le chauffage (ou mettez la chaudière en position été)' },
    { scene: 3, zone: 'bas', in: 1.4, out: 4.6, texte: 'Attendez 15 à 30 min que les radiateurs refroidissent' },
    { scene: 3, zone: 'bas', in: 4.8, out: 8.35, texte: 'Ouvrez les robinets thermostatiques au maximum' },

    { scene: 4, zone: 'haut', in: 0.2, out: 5.85, texte: '2. Placez le récipient et le chiffon sous la vis de purge' },
    { scene: 4, zone: 'bas', in: 2.3, out: 5.85, texte: 'Elle se trouve en haut, à l\'opposé du robinet' },

    { scene: 5, zone: 'haut', in: 0.2, out: 6.35, texte: '3. Tournez doucement la vis dans le sens inverse des aiguilles d\'une montre' },
    { scene: 5, zone: 'bas', in: 3.0, out: 6.35, texte: 'L\'air s\'échappe en sifflant' },

    { scene: 6, zone: 'haut', in: 0.2, out: 6.35, texte: '4. Dès que l\'eau coule en jet continu, sans bulles, refermez' },
    { scene: 6, zone: 'bas', in: 3.4, out: 6.35, texte: 'Sans forcer, pour ne pas abîmer le filetage' },

    { scene: 7, zone: 'haut', in: 0.3, out: 6.85, texte: '5. Répétez sur chaque radiateur' },
    { scene: 7, zone: 'bas', in: 1.6, out: 6.85, texte: 'En commençant par le rez-de-chaussée ou le plus proche de la chaudière, puis les étages' },

    { scene: 8, zone: 'haut', in: 0.3, out: 9.85, texte: '6. Contrôlez le manomètre de la chaudière' },
    { scene: 8, zone: 'bas', in: 1.6, out: 5.4, texte: 'Entre 1 et 1,5 bar (jusqu\'à 2 bars pour une maison à étages)' },
    { scene: 8, zone: 'bas', in: 5.6, out: 9.85, texte: 'Trop basse ? Ouvrez légèrement le robinet de remplissage sous la chaudière' },

    // Fin : la zone en bas de l'écran reste vide pour votre logo.
    { scene: 9, zone: 'haut', in: 0.3, out: 99, texte: 'Des radiateurs purgés = plus de confort, moins de gaspillage' },
  ],

  couverture: { texte: 'Purger ses radiateurs en 6 étapes', instant: 9.4 },
};
