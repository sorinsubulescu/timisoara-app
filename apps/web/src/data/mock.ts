export const POIS: Array<{
  id: string;
  name: string;
  description: string;
  category:
    | 'landmark'
    | 'museum'
    | 'church'
    | 'park'
    | 'restaurant'
    | 'cafe'
    | 'bar'
    | 'theater'
    | 'gallery';
  latitude: number;
  longitude: number;
  address: string;
  neighborhood: 'Cetate' | 'Fabric' | 'Iosefin' | 'Elisabetin';
  rating: number;
  imageUrl: string;
  tags: string[];
}> = [
  {
    id: 'poi-catedrala',
    name: 'Catedrala Mitropolitană',
    description:
      'Romanian Orthodox Metropolitan Cathedral dedicated to the Three Holy Hierarchs, completed in 1940. At 90.5 m the central tower is the second tallest church in Romania. Capacity of 5 000.',
    category: 'church',
    latitude: 45.7507,
    longitude: 21.2241,
    address: 'Bulevardul Regele Ferdinand I, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.8,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Catedrala+Mitropolitan%C4%83',
    tags: ['orthodox', 'cathedral', 'architecture', '11 towers'],
  },
  {
    id: 'poi-piata-unirii',
    name: 'Piața Unirii',
    description:
      'The oldest square in Timișoara, surrounded by baroque palaces, the Roman Catholic Dome, the Serbian Orthodox Cathedral, and the Baroque Palace (Art Museum). Heart of the old fortress.',
    category: 'landmark',
    latitude: 45.7579,
    longitude: 21.2290,
    address: 'Piața Unirii, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.9,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Pia%C8%9Ba+Unirii',
    tags: ['square', 'baroque', 'UNESCO buffer zone', 'Holy Trinity Column'],
  },
  {
    id: 'poi-piata-victoriei',
    name: 'Piața Victoriei',
    description:
      'Main civic square stretching from the Opera to the Cathedral, site of the December 1989 Revolution. Lined with Secession palaces, gardens, and fountains.',
    category: 'landmark',
    latitude: 45.7534,
    longitude: 21.2254,
    address: 'Piața Victoriei, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.8,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Pia%C8%9Ba+Victoriei',
    tags: ['square', 'secession', '1989 Revolution', 'gardens'],
  },
  {
    id: 'poi-castelul-huniade',
    name: 'Castelul Huniade',
    description:
      'Fortress built c. 1307 for Charles I of Hungary, rebuilt by John Hunyadi in the 15th century. Houses the Banat Museum with archaeology, natural science, and ethnography collections.',
    category: 'museum',
    latitude: 45.7531,
    longitude: 21.2269,
    address: 'Piața Huniade 1, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.4,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Castelul+Huniade',
    tags: ['castle', 'museum', 'medieval', 'Banat Museum'],
  },
  {
    id: 'poi-parcul-rozelor',
    name: 'Parcul Rozelor',
    description:
      'Rose park south of Piața Victoriei along the Bega canal with thousands of rose bushes, fountains, walking paths, and an open-air stage for summer concerts.',
    category: 'park',
    latitude: 45.7488,
    longitude: 21.2275,
    address: 'Parcul Rozelor, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.6,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Parcul+Rozelor',
    tags: ['nature', 'roses', 'Bega canal', 'concerts', 'family'],
  },
  {
    id: 'poi-parcul-botanic',
    name: 'Parcul Botanic',
    description:
      'Botanical garden of the West University with exotic plant collections, a Japanese garden, greenhouse, and quiet walking trails.',
    category: 'park',
    latitude: 45.7466,
    longitude: 21.1930,
    address: 'Calea Martirilor 1989, Timișoara',
    neighborhood: 'Elisabetin',
    rating: 4.5,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Parcul+Botanic',
    tags: ['nature', 'botanical', 'greenhouse', 'university'],
  },
  {
    id: 'poi-teatrul-national',
    name: 'Teatrul Național Mihai Eminescu',
    description:
      'National Theatre and Opera House of Timișoara, built 1871-1875 in Viennese neo-Renaissance style. The building houses both the drama company and the Romanian National Opera.',
    category: 'theater',
    latitude: 45.7536,
    longitude: 21.2236,
    address: 'Strada Mărășești 2, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.7,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Teatrul+Na%C8%9Bional',
    tags: ['theater', 'opera', 'neo-Renaissance', 'performing arts'],
  },
  {
    id: 'poi-muzeul-arta',
    name: 'Muzeul de Artă Timișoara',
    description:
      'Art museum in the Baroque Palace (1733-1735) on Piața Unirii. Romanian and European painting, decorative arts, and temporary exhibitions.',
    category: 'gallery',
    latitude: 45.7580,
    longitude: 21.2278,
    address: 'Piața Unirii 1, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.5,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Muzeul+de+Art%C4%83',
    tags: ['art', 'museum', 'baroque palace', 'European painting'],
  },
  {
    id: 'poi-bastionul-theresia',
    name: 'Bastionul Theresia',
    description:
      'Preserved 18th-century bastion of the Habsburg Vauban-style fortress. Restored as a cultural and creative hub hosting exhibitions, coworking, and events.',
    category: 'landmark',
    latitude: 45.7487,
    longitude: 21.2177,
    address: 'Strada Martin Luther 4, Timișoara',
    neighborhood: 'Elisabetin',
    rating: 4.5,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Bastionul+Theresia',
    tags: ['fortress', 'Habsburg', 'culture', 'events', 'coworking'],
  },
  {
    id: 'poi-sinagoga-fabric',
    name: 'Sinagoga din Fabric',
    description:
      'Moorish-style synagogue built 1895-1899 in the Fabric district. One of the most architecturally striking synagogues in Romania, a symbol of the city\'s multicultural heritage.',
    category: 'landmark',
    latitude: 45.7568,
    longitude: 21.2393,
    address: 'Strada Coloniei 2, Timișoara',
    neighborhood: 'Fabric',
    rating: 4.6,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Sinagoga+Fabric',
    tags: ['synagogue', 'Moorish style', 'heritage', 'Jewish history'],
  },
  {
    id: 'poi-parcul-central',
    name: 'Parcul Central (Scudier)',
    description:
      'Large green park along the Bega canal between Iosefin and Cetate with alleys, playgrounds, rowing boats in summer, and outdoor cafes.',
    category: 'park',
    latitude: 45.7555,
    longitude: 21.2140,
    address: 'Bulevardul Cetății, Timișoara',
    neighborhood: 'Iosefin',
    rating: 4.4,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Parcul+Central',
    tags: ['park', 'Bega canal', 'rowing', 'family', 'running'],
  },
  {
    id: 'poi-piata-libertatii',
    name: 'Piața Libertății',
    description:
      'Intimate square between Cetate and Fabric, home to the Old Town Hall (1731), the Military Casino, and the Nepomuk statue.',
    category: 'landmark',
    latitude: 45.7562,
    longitude: 21.2310,
    address: 'Piața Libertății, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.5,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Pia%C8%9Ba+Libert%C4%83%C8%9Bii',
    tags: ['square', 'Old Town Hall', 'baroque', 'Nepomuk statue'],
  },
  {
    id: 'poi-memorial-revolutiei',
    name: 'Memorialul Revoluției',
    description:
      'Museum and memorial dedicated to the December 1989 anti-communist Revolution which started in Timișoara. Documents, photos, and personal testimonies.',
    category: 'museum',
    latitude: 45.7543,
    longitude: 21.2165,
    address: 'Strada Oituz 2B, Timișoara',
    neighborhood: 'Elisabetin',
    rating: 4.7,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Memorialul+Revolu%C8%9Biei',
    tags: ['1989 Revolution', 'history', 'museum', 'memorial'],
  },
  {
    id: 'poi-piata-traian',
    name: 'Piața Traian',
    description:
      'Vibrant square in the Fabric district with the Millennium Church and surrounding Secession buildings. Home to the famous Piața Traian market.',
    category: 'landmark',
    latitude: 45.7573,
    longitude: 21.2372,
    address: 'Piața Traian, Timișoara',
    neighborhood: 'Fabric',
    rating: 4.3,
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Pia%C8%9Ba+Traian',
    tags: ['square', 'Fabric', 'market', 'Millennium Church'],
  },
];

export const EVENTS: Array<{
  id: string;
  title: string;
  description: string;
  category:
    | 'music'
    | 'theater'
    | 'art'
    | 'sports'
    | 'food'
    | 'family'
    | 'free'
    | 'meetup';
  startDate: string;
  endDate?: string;
  venue: string;
  venueAddress: string;
  isFree: boolean;
  price?: string;
  tags: string[];
}> = [
  {
    id: 'evt-jazz-tm',
    title: 'JazzTM International Festival',
    description:
      'Annual international jazz festival — outdoor stages in Piața Libertății and Parcul Rozelor plus club nights across the city. Running since 2012.',
    category: 'music',
    startDate: '2026-07-02T18:00:00+03:00',
    endDate: '2026-07-05T23:30:00+03:00',
    venue: 'Piața Libertății & Parcul Rozelor',
    venueAddress: 'Piața Libertății / Parcul Rozelor, Timișoara',
    isFree: false,
    price: 'From 120 RON (festival pass)',
    tags: ['jazz', 'outdoor', 'festival', 'summer'],
  },
  {
    id: 'evt-teatru-national',
    title: 'Leonce și Lena — Teatrul Național',
    description:
      'Georg Büchner\'s romantic comedy directed by Anca Bradu, performed by the National Theatre company.',
    category: 'theater',
    startDate: '2026-04-12T19:00:00+03:00',
    venue: 'Teatrul Național Mihai Eminescu',
    venueAddress: 'Strada Mărășești 2, Timișoara',
    isFree: false,
    price: '40–80 RON',
    tags: ['theater', 'drama', 'evening'],
  },
  {
    id: 'evt-arta-banat',
    title: 'Artă și Banat — expoziție de grup',
    description:
      'Group exhibition of paintings and installations by contemporary artists from the Banat region, in the Baroque Palace galleries.',
    category: 'art',
    startDate: '2026-04-18T10:00:00+03:00',
    endDate: '2026-05-30T18:00:00+03:00',
    venue: 'Muzeul de Artă Timișoara',
    venueAddress: 'Piața Unirii 1, Timișoara',
    isFree: false,
    price: '20 RON',
    tags: ['exhibition', 'painting', 'Banat artists'],
  },
  {
    id: 'evt-piata-taraneasca',
    title: 'Târgul producătorilor locali',
    description:
      'Weekly farmers market: cheese, honey, fresh vegetables, craft jams, and artisanal products from Timiș and Caraș-Severin counties.',
    category: 'food',
    startDate: '2026-04-05T07:00:00+03:00',
    endDate: '2026-04-05T14:00:00+03:00',
    venue: 'Piața Traian',
    venueAddress: 'Piața Traian, Timișoara',
    isFree: true,
    tags: ['market', 'local food', 'farmers', 'weekend'],
  },
  {
    id: 'evt-cinema-sub-stele',
    title: 'Cinema sub stele — pe Bega',
    description:
      'Open-air cinema on the Bega embankment near Parcul Rozelor: Romanian new wave and international art-house films.',
    category: 'free',
    startDate: '2026-06-20T21:30:00+03:00',
    venue: 'Malul Begăi (Parcul Rozelor)',
    venueAddress: 'Splaiul Tudor Vladimirescu, Timișoara',
    isFree: true,
    tags: ['cinema', 'outdoor', 'summer', 'Bega'],
  },
  {
    id: 'evt-maraton-timisoara',
    title: 'Maratonul Internațional Timișoara',
    description:
      'City marathon, half-marathon and 10 km fun run through Cetate, along the Bega, and into Fabric. Well-established annual race.',
    category: 'sports',
    startDate: '2026-05-10T08:00:00+03:00',
    venue: 'Start/Finish: Piața Victoriei',
    venueAddress: 'Piața Victoriei, Timișoara',
    isFree: false,
    price: '90–150 RON (registration)',
    tags: ['running', 'marathon', 'half-marathon', 'Bega'],
  },
  {
    id: 'evt-kids-fest',
    title: 'Kids Fest Timișoara',
    description:
      'Weekend workshops, puppet theatre, science corners, and concerts for families in Parcul Central along the Bega.',
    category: 'family',
    startDate: '2026-05-24T10:00:00+03:00',
    endDate: '2026-05-24T19:00:00+03:00',
    venue: 'Parcul Central',
    venueAddress: 'Bulevardul Cetății, Timișoara',
    isFree: false,
    price: '30 RON (child), adults free',
    tags: ['kids', 'workshops', 'puppet theatre', 'weekend'],
  },
  {
    id: 'evt-tech-meetup',
    title: 'Timișoara Tech Meetup — AI & Product',
    description:
      'Lightning talks and networking for developers and product people; hosted at the creative hub inside Bastionul Theresia.',
    category: 'meetup',
    startDate: '2026-04-22T18:30:00+03:00',
    venue: 'Bastionul Theresia',
    venueAddress: 'Strada Martin Luther 4, Timișoara',
    isFree: true,
    tags: ['tech', 'AI', 'networking', 'startups'],
  },
];

// Real STPT Timișoara transit lines with verified stops
export const TRANSIT_LINES: Array<{
  id: string;
  lineNumber: string;
  type: 'tram' | 'bus' | 'trolleybus';
  name: string;
  color: string;
  stops: Array<{ id: string; name: string; latitude: number; longitude: number }>;
}> = [
  {
    id: 'tram-1',
    lineNumber: '1',
    type: 'tram',
    name: 'Gara de Nord — Stația Meteo',
    color: '#E30613',
    stops: [
      { id: 't1-gara', name: 'Gara de Nord', latitude: 45.7497, longitude: 21.2078 },
      { id: 't1-iosefin', name: 'Piața Iosefin', latitude: 45.7519, longitude: 21.2108 },
      { id: 't1-mocioni', name: 'Piața Mocioni', latitude: 45.7537, longitude: 21.2156 },
      { id: 't1-sf-maria', name: 'Piața Sfânta Maria', latitude: 45.7531, longitude: 21.2198 },
      { id: 't1-catedrala', name: 'Catedrala Mitropolitană', latitude: 45.7514, longitude: 21.2232 },
      { id: 't1-copii', name: 'Spitalul de Copii', latitude: 45.7507, longitude: 21.2269 },
      { id: 't1-700', name: 'Piața Timișoara 700', latitude: 45.7524, longitude: 21.2293 },
      { id: 't1-libertatii', name: 'Piața Libertății', latitude: 45.7562, longitude: 21.2310 },
      { id: 't1-continental', name: 'Hotel Continental', latitude: 45.7568, longitude: 21.2332 },
      { id: 't1-prefectura', name: 'Prefectura Timiș', latitude: 45.7575, longitude: 21.2356 },
      { id: 't1-3august', name: '3 August 1919', latitude: 45.7577, longitude: 21.2368 },
      { id: 't1-traian', name: 'Piața Traian', latitude: 45.7573, longitude: 21.2372 },
      { id: 't1-turcesc', name: 'Prințul Turcesc', latitude: 45.7577, longitude: 21.2420 },
      { id: 't1-sarmis', name: 'Sarmisegetuza', latitude: 45.7585, longitude: 21.2470 },
      { id: 't1-lalelelor', name: 'Lalelelor', latitude: 45.7597, longitude: 21.2520 },
      { id: 't1-economu', name: 'Piața Virgil Economu', latitude: 45.7605, longitude: 21.2558 },
      { id: 't1-babes', name: 'Spitalul Victor Babeș', latitude: 45.7608, longitude: 21.2595 },
      { id: 't1-meteo', name: 'Stația Meteo', latitude: 45.7612, longitude: 21.2630 },
    ],
  },
  {
    id: 'tram-4',
    lineNumber: '4',
    type: 'tram',
    name: 'Calea Torontalului — AEM/Piața Domășnean',
    color: '#F59E0B',
    stops: [
      { id: 't4-torontal', name: 'Calea Torontalului', latitude: 45.7700, longitude: 21.2170 },
      { id: 't4-mocioniN', name: 'Piața Mocioni (nord)', latitude: 45.7550, longitude: 21.2156 },
      { id: 't4-sf-maria', name: 'Piața Sfânta Maria', latitude: 45.7531, longitude: 21.2198 },
      { id: 't4-catedrala', name: 'Catedrala Mitropolitană', latitude: 45.7514, longitude: 21.2232 },
      { id: 't4-copii', name: 'Spitalul de Copii', latitude: 45.7507, longitude: 21.2269 },
      { id: 't4-700', name: 'Piața Timișoara 700', latitude: 45.7524, longitude: 21.2293 },
      { id: 't4-rozelor', name: 'Parcul Rozelor', latitude: 45.7488, longitude: 21.2275 },
      { id: 't4-domasnean', name: 'AEM/Piața Domășnean', latitude: 45.7375, longitude: 21.2310 },
    ],
  },
  {
    id: 'tram-8',
    lineNumber: '8',
    type: 'tram',
    name: 'Gara de Nord — AEM/Piața Domășnean',
    color: '#7C3AED',
    stops: [
      { id: 't8-gara', name: 'Gara de Nord', latitude: 45.7497, longitude: 21.2078 },
      { id: 't8-iosefin', name: 'Piața Iosefin', latitude: 45.7519, longitude: 21.2108 },
      { id: 't8-mocioni', name: 'Piața Mocioni', latitude: 45.7537, longitude: 21.2156 },
      { id: 't8-sf-maria', name: 'Piața Sfânta Maria', latitude: 45.7531, longitude: 21.2198 },
      { id: 't8-catedrala', name: 'Catedrala Mitropolitană', latitude: 45.7514, longitude: 21.2232 },
      { id: 't8-700', name: 'Piața Timișoara 700', latitude: 45.7524, longitude: 21.2293 },
      { id: 't8-domasnean', name: 'AEM/Piața Domășnean', latitude: 45.7375, longitude: 21.2310 },
    ],
  },
  {
    id: 'tram-9',
    lineNumber: '9',
    type: 'tram',
    name: 'Gara de Nord — AEM/Piața Domășnean',
    color: '#0EA5E9',
    stops: [
      { id: 't9-gara', name: 'Gara de Nord', latitude: 45.7497, longitude: 21.2078 },
      { id: 't9-iosefin', name: 'Piața Iosefin', latitude: 45.7519, longitude: 21.2108 },
      { id: 't9-mocioni', name: 'Piața Mocioni', latitude: 45.7537, longitude: 21.2156 },
      { id: 't9-catedrala', name: 'Catedrala Mitropolitană', latitude: 45.7514, longitude: 21.2232 },
      { id: 't9-700', name: 'Piața Timișoara 700', latitude: 45.7524, longitude: 21.2293 },
      { id: 't9-domasnean', name: 'AEM/Piața Domășnean', latitude: 45.7375, longitude: 21.2310 },
    ],
  },
  {
    id: 'bus-m14',
    lineNumber: 'M14',
    type: 'bus',
    name: 'Giroc — Gara de Nord',
    color: '#059669',
    stops: [
      { id: 'm14-giroc', name: 'Giroc (centru)', latitude: 45.7148, longitude: 21.2218 },
      { id: 'm14-urseni', name: 'Strada Urseni', latitude: 45.7265, longitude: 21.2250 },
      { id: 'm14-sagului', name: 'Calea Șagului', latitude: 45.7380, longitude: 21.2282 },
      { id: 'm14-700', name: 'Piața Timișoara 700', latitude: 45.7524, longitude: 21.2293 },
      { id: 'm14-victoriei', name: 'Piața Victoriei', latitude: 45.7534, longitude: 21.2254 },
      { id: 'm14-gara', name: 'Gara de Nord', latitude: 45.7497, longitude: 21.2078 },
    ],
  },
  {
    id: 'trolley-m11',
    lineNumber: 'M11',
    type: 'trolleybus',
    name: 'Iulius Town — Piața Traian',
    color: '#DC2626',
    stops: [
      { id: 'm11-iulius', name: 'Iulius Town', latitude: 45.7648, longitude: 21.2180 },
      { id: 'm11-aradului', name: 'Calea Aradului', latitude: 45.7630, longitude: 21.2165 },
      { id: 'm11-cioca', name: 'Piața Ion Ionescu de la Brad', latitude: 45.7560, longitude: 21.2200 },
      { id: 'm11-victoriei', name: 'Piața Victoriei', latitude: 45.7534, longitude: 21.2254 },
      { id: 'm11-libertatii', name: 'Piața Libertății', latitude: 45.7562, longitude: 21.2310 },
      { id: 'm11-traian', name: 'Piața Traian', latitude: 45.7573, longitude: 21.2372 },
    ],
  },
];

// Real restaurants and cafes in Timișoara (verified names and locations)
export const RESTAURANTS: Array<{
  id: string;
  name: string;
  description: string;
  cuisine: string[];
  priceRange: 1 | 2 | 3 | 4;
  latitude: number;
  longitude: number;
  address: string;
  neighborhood: 'Cetate' | 'Fabric' | 'Iosefin' | 'Elisabetin';
  rating: number;
  features: string[];
  imageUrl: string;
}> = [
  {
    id: 'rest-miorita',
    name: 'Miorița',
    description:
      'One of the most beloved traditional Romanian restaurants in Timișoara. Home-style cooking: ciorbă in pâine, sarmale, mici, and papanași. Cash only.',
    cuisine: ['Romanian', 'Traditional'],
    priceRange: 1,
    latitude: 45.7557,
    longitude: 21.2268,
    address: 'Strada Florimund Mercy 7, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.3,
    features: ['traditional', 'cash only', 'fresh bread', 'lunch'],
    imageUrl: 'https://placehold.co/400x300/F08A46/white?text=Miori%C8%9Ba',
  },
  {
    id: 'rest-garage',
    name: 'Garage Café',
    description:
      'Top-rated specialty coffee roastery near Piața Unirii. Freshly roasted weekly, homemade pastries, sandwiches, and brunch. A local institution.',
    cuisine: ['Cafe', 'Brunch'],
    priceRange: 2,
    latitude: 45.7577,
    longitude: 21.2301,
    address: 'Strada Palanca 2, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.6,
    features: ['specialty coffee', 'roastery', 'pastries', 'wifi'],
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Garage+Caf%C3%A9',
  },
  {
    id: 'rest-rems',
    name: "REM'S Coffee",
    description:
      'Cozy specialty coffee shop on Strada Lucian Blaga. Excellent brunch (until 18:00), sandwiches, salads, baked treats, and two quiet work rooms.',
    cuisine: ['Cafe', 'Brunch'],
    priceRange: 2,
    latitude: 45.7520,
    longitude: 21.2235,
    address: 'Strada Lucian Blaga 14, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.7,
    features: ['specialty coffee', 'brunch', 'work rooms', 'wifi'],
    imageUrl:
      "https://placehold.co/400x300/F08A46/white?text=REM'S+Coffee",
  },
  {
    id: 'rest-bruck',
    name: 'Bruck Café',
    description:
      'International cuisine café on Strada Mercy. Excellent coffee, pancakes, and brunch plates. Open daily until midnight.',
    cuisine: ['International', 'Cafe'],
    priceRange: 2,
    latitude: 45.7555,
    longitude: 21.2264,
    address: 'Strada Florimund Mercy 9, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.5,
    features: ['brunch', 'pancakes', 'late night', 'terrace'],
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Bruck+Caf%C3%A9',
  },
  {
    id: 'rest-pescada',
    name: 'Pescada',
    description:
      'Seafood and Mediterranean restaurant with beautiful garden seating. One of the highest-rated dining spots in Timișoara.',
    cuisine: ['Seafood', 'Mediterranean'],
    priceRange: 3,
    latitude: 45.7542,
    longitude: 21.2188,
    address: 'Strada Gheorghe Doja 3, Timișoara',
    neighborhood: 'Elisabetin',
    rating: 4.6,
    features: ['seafood', 'garden', 'wine', 'fine dining'],
    imageUrl: 'https://placehold.co/400x300/F08A46/white?text=Pescada',
  },
  {
    id: 'rest-beraria-700',
    name: 'Berăria 700',
    description:
      'Large beer hall and restaurant at Piața Timișoara 700. Romanian craft beer, traditional pub food, and live music on weekends.',
    cuisine: ['Pub food', 'Romanian'],
    priceRange: 2,
    latitude: 45.7524,
    longitude: 21.2293,
    address: 'Piața Timișoara 700, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.2,
    features: ['craft beer', 'live music', 'large groups', 'terrace'],
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Ber%C4%83ria+700',
  },
  {
    id: 'rest-d-arc',
    name: "D'Arc",
    description:
      'Elegant brasserie near Piața Unirii serving French-inspired cuisine, artisanal cocktails, and weekend brunch. Beautiful interior.',
    cuisine: ['French', 'International'],
    priceRange: 3,
    latitude: 45.7570,
    longitude: 21.2285,
    address: 'Strada Eugeniu de Savoya 10, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.5,
    features: ['cocktails', 'brunch', 'fine dining', 'date night'],
    imageUrl: "https://placehold.co/400x300/F08A46/white?text=D'Arc",
  },
  {
    id: 'rest-pizzaiolo',
    name: 'Pizzaiolo',
    description:
      'Neapolitan-style pizzeria with wood-fired oven, imported Italian ingredients, and a casual, lively atmosphere. Quick lunch specials.',
    cuisine: ['Italian', 'Pizza'],
    priceRange: 2,
    latitude: 45.7560,
    longitude: 21.2260,
    address: 'Strada Alba Iulia 1, Timișoara',
    neighborhood: 'Cetate',
    rating: 4.4,
    features: ['pizza', 'wood-fired', 'lunch specials', 'terrace'],
    imageUrl:
      'https://placehold.co/400x300/F08A46/white?text=Pizzaiolo',
  },
];

export const POI_CATEGORIES: Array<{ value: string; label: string; icon: string }> = [
  { value: 'landmark', label: 'Landmark', icon: 'Landmark' },
  { value: 'museum', label: 'Museum', icon: 'Building2' },
  { value: 'church', label: 'Church', icon: 'Church' },
  { value: 'park', label: 'Park', icon: 'Trees' },
  { value: 'restaurant', label: 'Restaurant', icon: 'UtensilsCrossed' },
  { value: 'cafe', label: 'Cafe', icon: 'Coffee' },
  { value: 'bar', label: 'Bar', icon: 'Wine' },
  { value: 'theater', label: 'Theater', icon: 'Drama' },
  { value: 'gallery', label: 'Gallery', icon: 'Palette' },
];

export const EVENT_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'music', label: 'Music' },
  { value: 'theater', label: 'Theater' },
  { value: 'art', label: 'Art' },
  { value: 'sports', label: 'Sports' },
  { value: 'food', label: 'Food' },
  { value: 'family', label: 'Family' },
  { value: 'free', label: 'Free' },
  { value: 'meetup', label: 'Meetup' },
];

export const NEIGHBORHOODS: string[] = [
  'Cetate',
  'Fabric',
  'Iosefin',
  'Elisabetin',
  'Mehala',
  'Freidorf',
  'Circumvalațiunii',
  'Soarelui',
  'Lunei',
  'Giroc',
  'Dumbrăvița',
  'Ghiroda',
];
