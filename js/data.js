/* =========================================================
   CONTENU DU PORTFOLIO
   ---------------------------------------------------------
   Tout le texte du site est ici : modifiez ce fichier
   pour personnaliser le portfolio sans toucher au code.
   Les valeurs marquées « À REMPLACER » sont des exemples.
   ========================================================= */

window.PORTFOLIO = {
  profile: {
    firstName: "Prénom", // À REMPLACER
    lastName: "Nom", // À REMPLACER
    role: "Marketing & Communication",
    company: "Logista Hometech",
    location: "France",
    email: "contact@exemple.fr", // À REMPLACER
    linkedin: "https://www.linkedin.com/", // À REMPLACER
    photo: "", // ex. "assets/photo.jpg" — laissez vide pour le monogramme
    intro:
      "Je pilote le marketing et la communication de plusieurs filiales de Logista Hometech. " +
      "Des réseaux sociaux au print, en passant par le référencement naturel, je fais exister " +
      "chaque marque avec sa propre voix — et je mesure ce que ça rapporte.",
    skills: [
      "Stratégie de marque",
      "Community management",
      "Création graphique",
      "Print & PLV",
      "SEO on-page",
      "SEO local",
      "Gestion de sites web",
      "Vidéo YouTube",
      "Reporting & analytics",
    ],
    tools: ["Suite Adobe", "Canva", "Figma", "WordPress", "Search Console", "GA4", "Semrush", "Meta Business Suite"],
  },

  // Chiffres clés (section profil)
  stats: [
    { value: 9, label: "sites web gérés" },
    { value: 4, label: "sites travaillés en SEO" },
    { value: 5, label: "marques accompagnées" },
    { value: 5, label: "comptes sociaux animés" },
  ],

  // Marques / filiales
  brands: [
    {
      name: "Soltys",
      color: "#FF5A1F",
      tagline: "Filiale Logista Hometech",
      channels: ["Facebook", "LinkedIn", "Site web", "Print"],
    },
    {
      name: "Nevyo",
      color: "#2B50FF",
      tagline: "Filiale Logista Hometech",
      channels: ["Facebook", "Site web", "Print"],
    },
    {
      name: "Airelys",
      color: "#12A88F",
      tagline: "Filiale Logista Hometech",
      channels: ["LinkedIn", "Site web", "Print"],
    },
    {
      name: "Hygelys",
      color: "#8A5CFF",
      tagline: "Filiale Logista Hometech",
      channels: ["Site web", "Print"],
    },
    {
      name: "Logista Hybride",
      color: "#0F0F0F",
      tagline: "Agences — bailleurs & particuliers",
      channels: ["Sites web", "Print"],
    },
    {
      name: "Logista Hometech",
      color: "#E8B500",
      tagline: "Groupe",
      channels: ["YouTube"],
    },
  ],

  // Comptes réseaux sociaux gérés
  socials: [
    { platform: "Facebook", brand: "Soltys", url: "#" },
    { platform: "Facebook", brand: "Nevyo", url: "#" },
    { platform: "LinkedIn", brand: "Soltys", url: "#" },
    { platform: "LinkedIn", brand: "Airelys", url: "#" },
    { platform: "YouTube", brand: "Logista Hometech", url: "#" },
  ],

  /* Réalisations graphiques
     category : "social" | "print" | "video"
     format   : "square" | "portrait" | "landscape" | "story"
     image    : chemin vers votre visuel (ex. "assets/realisations/soltys-post.jpg")
                laissez vide pour afficher une maquette générée. */
  projects: [
    { title: "Campagne printemps", brand: "Soltys", category: "social", format: "square", year: 2026, image: "",
      description: "Série de posts Facebook & LinkedIn pour la campagne saisonnière." },
    { title: "Plaquette commerciale", brand: "Airelys", category: "print", format: "portrait", year: 2026, image: "",
      description: "Brochure 8 pages présentant l'offre et les engagements de la marque." },
    { title: "Témoignage client", brand: "Logista Hometech", category: "video", format: "landscape", year: 2025, image: "",
      description: "Miniatures et habillage pour la chaîne YouTube du groupe." },
    { title: "Carrousel conseils", brand: "Nevyo", category: "social", format: "square", year: 2025, image: "",
      description: "Carrousel pédagogique pensé pour l'engagement et le partage." },
    { title: "Flyer agences", brand: "Logista Hybride", category: "print", format: "portrait", year: 2025, image: "",
      description: "Flyer A5 distribué auprès des bailleurs et des particuliers." },
    { title: "Story recrutement", brand: "Soltys", category: "social", format: "story", year: 2026, image: "",
      description: "Format vertical pour une campagne de recrutement." },
    { title: "Kakémono salon", brand: "Hygelys", category: "print", format: "story", year: 2025, image: "",
      description: "Roll-up et supports pour la présence sur salon professionnel." },
    { title: "Post marque employeur", brand: "Airelys", category: "social", format: "square", year: 2026, image: "",
      description: "Mise en avant des équipes terrain sur LinkedIn." },
    { title: "Affiche locale", brand: "Nevyo", category: "print", format: "portrait", year: 2026, image: "",
      description: "Affiche A3 pour une opération de communication de proximité." },
    { title: "Série tutoriels", brand: "Logista Hometech", category: "video", format: "landscape", year: 2026, image: "",
      description: "Charte graphique des vidéos tutoriels YouTube." },
  ],

  /* Résultats SEO — À REMPLACER par vos vrais chiffres.
     traffic : trafic organique mensuel (12 derniers mois), utilisé pour le graphique */
  seo: [
    {
      site: "soltys.fr", // À REMPLACER
      brand: "Soltys",
      period: "12 mois",
      metrics: [
        { value: 148, prefix: "+", suffix: "%", label: "trafic organique" },
        { value: 62, prefix: "", suffix: "", label: "mots-clés en top 10" },
        { value: 3, prefix: "x", suffix: "", label: "demandes de devis" },
      ],
      traffic: [820, 900, 870, 1040, 1180, 1250, 1390, 1520, 1610, 1780, 1900, 2030],
    },
    {
      site: "nevyo.fr", // À REMPLACER
      brand: "Nevyo",
      period: "12 mois",
      metrics: [
        { value: 92, prefix: "+", suffix: "%", label: "trafic organique" },
        { value: 41, prefix: "", suffix: "", label: "mots-clés en top 10" },
        { value: 8, prefix: "", suffix: "", label: "positions gagnées en moy." },
      ],
      traffic: [540, 560, 600, 590, 680, 720, 760, 820, 870, 930, 990, 1040],
    },
    {
      site: "airelys.fr", // À REMPLACER
      brand: "Airelys",
      period: "12 mois",
      metrics: [
        { value: 120, prefix: "+", suffix: "%", label: "trafic organique" },
        { value: 35, prefix: "", suffix: "", label: "mots-clés en top 10" },
        { value: 2, prefix: "x", suffix: "", label: "taux de clic (CTR)" },
      ],
      traffic: [310, 330, 360, 400, 420, 470, 520, 560, 590, 620, 650, 690],
    },
    {
      site: "logista-hybride.fr", // À REMPLACER
      brand: "Logista Hybride",
      period: "12 mois",
      metrics: [
        { value: 75, prefix: "+", suffix: "%", label: "trafic organique" },
        { value: 28, prefix: "", suffix: "", label: "fiches locales optimisées" },
        { value: 54, prefix: "+", suffix: "%", label: "appels via Google" },
      ],
      traffic: [400, 410, 450, 440, 480, 520, 540, 580, 610, 640, 670, 700],
    },
  ],

  seoMethod: [
    { title: "Audit", text: "Analyse technique, sémantique et concurrentielle de chaque site." },
    { title: "Contenus", text: "Pages services, articles et FAQ construits autour des vraies recherches." },
    { title: "Local", text: "Optimisation des fiches Google et des pages agences, ville par ville." },
    { title: "Suivi", text: "Reporting mensuel : positions, trafic, conversions — et ajustements." },
  ],
};
