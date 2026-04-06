import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Timișoara App database...');

  // --- Points of Interest (verified coordinates) ---
  const pois = [
    {
      name: 'Catedrala Mitropolitană',
      description: 'Romanian Orthodox Metropolitan Cathedral dedicated to the Three Holy Hierarchs, completed in 1940. At 90.5 m the central tower is the second tallest church in Romania.',
      category: 'church',
      latitude: 45.7507,
      longitude: 21.2241,
      address: 'Bulevardul Regele Ferdinand I, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.8,
      tags: ['orthodox', 'cathedral', 'architecture', '11 towers'],
    },
    {
      name: 'Piața Unirii',
      description: 'The oldest square in Timișoara, surrounded by baroque palaces, the Roman Catholic Dome, the Serbian Orthodox Cathedral, and the Baroque Palace (Art Museum).',
      category: 'landmark',
      latitude: 45.7579,
      longitude: 21.2290,
      address: 'Piața Unirii, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.9,
      tags: ['square', 'baroque', 'UNESCO buffer zone', 'Holy Trinity Column'],
    },
    {
      name: 'Piața Victoriei',
      description: 'Main civic square stretching from the Opera to the Cathedral, site of the December 1989 Revolution. Lined with Secession palaces, gardens, and fountains.',
      category: 'landmark',
      latitude: 45.7534,
      longitude: 21.2254,
      address: 'Piața Victoriei, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.8,
      tags: ['square', 'secession', '1989 Revolution', 'gardens'],
    },
    {
      name: 'Castelul Huniade',
      description: 'Fortress built c. 1307 for Charles I of Hungary, rebuilt by John Hunyadi. Houses the Banat Museum with archaeology, natural science, and ethnography collections.',
      category: 'museum',
      latitude: 45.7531,
      longitude: 21.2269,
      address: 'Piața Huniade 1, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.4,
      tags: ['castle', 'museum', 'medieval', 'Banat Museum'],
    },
    {
      name: 'Parcul Rozelor',
      description: 'Rose park south of Piața Victoriei along the Bega canal with thousands of rose bushes, fountains, walking paths, and a summer open-air stage.',
      category: 'park',
      latitude: 45.7488,
      longitude: 21.2275,
      address: 'Parcul Rozelor, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.6,
      tags: ['park', 'roses', 'Bega canal', 'concerts'],
    },
    {
      name: 'Parcul Botanic',
      description: 'Botanical garden of the West University with exotic plant collections, a Japanese garden, greenhouse, and quiet walking trails.',
      category: 'park',
      latitude: 45.7466,
      longitude: 21.1930,
      address: 'Calea Martirilor 1989, Timișoara',
      neighborhood: 'Elisabetin',
      rating: 4.5,
      tags: ['park', 'botanical', 'greenhouse', 'university'],
    },
    {
      name: 'Teatrul Național Mihai Eminescu',
      description: 'National Theatre and Opera House, built 1871-1875 in Viennese neo-Renaissance style. Houses both the drama company and the Romanian National Opera.',
      category: 'theater',
      latitude: 45.7536,
      longitude: 21.2236,
      address: 'Strada Mărășești 2, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.7,
      tags: ['theater', 'opera', 'neo-Renaissance', 'performing arts'],
    },
    {
      name: 'Muzeul de Artă Timișoara',
      description: 'Art museum in the Baroque Palace (1733-1735) on Piața Unirii. Romanian and European painting, decorative arts, and temporary exhibitions.',
      category: 'museum',
      latitude: 45.7580,
      longitude: 21.2278,
      address: 'Piața Unirii 1, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.5,
      tags: ['art', 'museum', 'baroque palace', 'European painting'],
    },
    {
      name: 'Bastionul Theresia',
      description: 'Preserved 18th-century bastion of the Habsburg Vauban-style fortress, restored as a cultural and creative hub with exhibitions and events.',
      category: 'landmark',
      latitude: 45.7487,
      longitude: 21.2177,
      address: 'Strada Martin Luther 4, Timișoara',
      neighborhood: 'Elisabetin',
      rating: 4.5,
      tags: ['fortress', 'Habsburg', 'culture', 'events'],
    },
    {
      name: 'Sinagoga din Fabric',
      description: 'Moorish-style synagogue built 1895-1899 in the Fabric district. One of the most architecturally striking synagogues in Romania.',
      category: 'landmark',
      latitude: 45.7568,
      longitude: 21.2393,
      address: 'Strada Coloniei 2, Timișoara',
      neighborhood: 'Fabric',
      rating: 4.6,
      tags: ['synagogue', 'Moorish style', 'heritage', 'Jewish history'],
    },
    {
      name: 'Parcul Central (Scudier)',
      description: 'Large green park along the Bega canal between Iosefin and Cetate with alleys, playgrounds, rowing boats, and outdoor cafes.',
      category: 'park',
      latitude: 45.7555,
      longitude: 21.2140,
      address: 'Bulevardul Cetății, Timișoara',
      neighborhood: 'Iosefin',
      rating: 4.4,
      tags: ['park', 'Bega canal', 'rowing', 'family'],
    },
    {
      name: 'Piața Libertății',
      description: 'Intimate square between Cetate and Fabric, home to the Old Town Hall (1731), the Military Casino, and the Nepomuk statue.',
      category: 'landmark',
      latitude: 45.7562,
      longitude: 21.2310,
      address: 'Piața Libertății, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.5,
      tags: ['square', 'Old Town Hall', 'baroque', 'Nepomuk statue'],
    },
    {
      name: 'Memorialul Revoluției',
      description: 'Museum and memorial dedicated to the December 1989 anti-communist Revolution which started in Timișoara. Documents, photos, and testimonies.',
      category: 'museum',
      latitude: 45.7543,
      longitude: 21.2165,
      address: 'Strada Oituz 2B, Timișoara',
      neighborhood: 'Elisabetin',
      rating: 4.7,
      tags: ['1989 Revolution', 'history', 'museum', 'memorial'],
    },
    {
      name: 'Piața Traian',
      description: 'Vibrant square in the Fabric district with the Millennium Church and surrounding Secession buildings. Home to the Piața Traian market.',
      category: 'landmark',
      latitude: 45.7573,
      longitude: 21.2372,
      address: 'Piața Traian, Timișoara',
      neighborhood: 'Fabric',
      rating: 4.3,
      tags: ['square', 'Fabric', 'market', 'Millennium Church'],
    },
  ];

  for (const poi of pois) {
    await prisma.poi.create({ data: poi });
  }
  console.log(`Created ${pois.length} POIs`);

  // --- Events ---
  const events = [
    {
      title: 'JazzTM International Festival',
      description: 'Annual international jazz festival — outdoor stages in Piața Libertății and Parcul Rozelor plus club nights across the city.',
      category: 'music',
      startDate: new Date('2026-07-02T18:00:00+03:00'),
      endDate: new Date('2026-07-05T23:30:00+03:00'),
      venue: 'Piața Libertății & Parcul Rozelor',
      venueAddress: 'Piața Libertății / Parcul Rozelor, Timișoara',
      latitude: 45.7562,
      longitude: 21.2310,
      isFree: false,
      price: 'From 120 RON (festival pass)',
      tags: ['jazz', 'outdoor', 'festival', 'summer'],
    },
    {
      title: 'Leonce și Lena — Teatrul Național',
      description: "Georg Büchner's romantic comedy directed by Anca Bradu, performed by the National Theatre company.",
      category: 'theater',
      startDate: new Date('2026-04-12T19:00:00+03:00'),
      venue: 'Teatrul Național Mihai Eminescu',
      venueAddress: 'Strada Mărășești 2, Timișoara',
      latitude: 45.7536,
      longitude: 21.2236,
      isFree: false,
      price: '40–80 RON',
      tags: ['theater', 'drama', 'evening'],
    },
    {
      title: 'Artă și Banat — expoziție de grup',
      description: 'Group exhibition of paintings and installations by contemporary artists from the Banat region.',
      category: 'art',
      startDate: new Date('2026-04-18T10:00:00+03:00'),
      endDate: new Date('2026-05-30T18:00:00+03:00'),
      venue: 'Muzeul de Artă Timișoara',
      venueAddress: 'Piața Unirii 1, Timișoara',
      latitude: 45.7580,
      longitude: 21.2278,
      isFree: false,
      price: '20 RON',
      tags: ['exhibition', 'painting', 'Banat artists'],
    },
    {
      title: 'Târgul producătorilor locali',
      description: 'Weekly farmers market: cheese, honey, fresh vegetables, and artisanal products from Timiș and Caraș-Severin counties.',
      category: 'food',
      startDate: new Date('2026-04-05T07:00:00+03:00'),
      endDate: new Date('2026-04-05T14:00:00+03:00'),
      venue: 'Piața Traian',
      venueAddress: 'Piața Traian, Timișoara',
      latitude: 45.7573,
      longitude: 21.2372,
      isFree: true,
      tags: ['market', 'local food', 'farmers', 'weekend'],
    },
    {
      title: 'Cinema sub stele — pe Bega',
      description: 'Open-air cinema on the Bega embankment near Parcul Rozelor: Romanian new wave and international art-house films.',
      category: 'free',
      startDate: new Date('2026-06-20T21:30:00+03:00'),
      venue: 'Malul Begăi (Parcul Rozelor)',
      venueAddress: 'Splaiul Tudor Vladimirescu, Timișoara',
      latitude: 45.7488,
      longitude: 21.2275,
      isFree: true,
      tags: ['cinema', 'outdoor', 'summer', 'Bega'],
    },
    {
      title: 'Maratonul Internațional Timișoara',
      description: 'City marathon, half-marathon and 10 km fun run through Cetate, along the Bega, and into Fabric.',
      category: 'sports',
      startDate: new Date('2026-05-10T08:00:00+03:00'),
      venue: 'Start/Finish: Piața Victoriei',
      venueAddress: 'Piața Victoriei, Timișoara',
      latitude: 45.7534,
      longitude: 21.2254,
      isFree: false,
      price: '90–150 RON (registration)',
      tags: ['running', 'marathon', 'half-marathon'],
    },
    {
      title: 'Kids Fest Timișoara',
      description: 'Weekend workshops, puppet theatre, science corners, and concerts for families in Parcul Central along the Bega.',
      category: 'family',
      startDate: new Date('2026-05-24T10:00:00+03:00'),
      endDate: new Date('2026-05-24T19:00:00+03:00'),
      venue: 'Parcul Central',
      venueAddress: 'Bulevardul Cetății, Timișoara',
      latitude: 45.7555,
      longitude: 21.2140,
      isFree: false,
      price: '30 RON (child), adults free',
      tags: ['kids', 'workshops', 'puppet theatre'],
    },
    {
      title: 'Timișoara Tech Meetup — AI & Product',
      description: 'Lightning talks and networking for developers and product people, hosted at the creative hub inside Bastionul Theresia.',
      category: 'meetup',
      startDate: new Date('2026-04-22T18:30:00+03:00'),
      venue: 'Bastionul Theresia',
      venueAddress: 'Strada Martin Luther 4, Timișoara',
      latitude: 45.7487,
      longitude: 21.2177,
      isFree: true,
      tags: ['tech', 'AI', 'networking', 'startups'],
    },
  ];

  for (const event of events) {
    await prisma.event.create({ data: event });
  }
  console.log(`Created ${events.length} events`);

  // --- Transit Lines (real STPT data) ---
  const transitStops: Record<string, { name: string; lat: number; lng: number }> = {
    gara: { name: 'Gara de Nord', lat: 45.7497, lng: 21.2078 },
    iosefin: { name: 'Piața Iosefin', lat: 45.7519, lng: 21.2108 },
    mocioni: { name: 'Piața Mocioni', lat: 45.7537, lng: 21.2156 },
    sfMaria: { name: 'Piața Sfânta Maria', lat: 45.7531, lng: 21.2198 },
    catedrala: { name: 'Catedrala Mitropolitană', lat: 45.7514, lng: 21.2232 },
    copii: { name: 'Spitalul de Copii', lat: 45.7507, lng: 21.2269 },
    tm700: { name: 'Piața Timișoara 700', lat: 45.7524, lng: 21.2293 },
    libertatii: { name: 'Piața Libertății', lat: 45.7562, lng: 21.2310 },
    continental: { name: 'Hotel Continental', lat: 45.7568, lng: 21.2332 },
    traian: { name: 'Piața Traian', lat: 45.7573, lng: 21.2372 },
    turcesc: { name: 'Prințul Turcesc', lat: 45.7577, lng: 21.2420 },
    sarmis: { name: 'Sarmisegetuza', lat: 45.7585, lng: 21.2470 },
    meteo: { name: 'Stația Meteo', lat: 45.7612, lng: 21.2630 },
    torontal: { name: 'Calea Torontalului', lat: 45.7700, lng: 21.2170 },
    domasnean: { name: 'AEM/Piața Domășnean', lat: 45.7375, lng: 21.2310 },
    giroc: { name: 'Giroc (centru)', lat: 45.7148, lng: 21.2218 },
    sagului: { name: 'Calea Șagului', lat: 45.7380, lng: 21.2282 },
    victoriei: { name: 'Piața Victoriei', lat: 45.7534, lng: 21.2254 },
    iulius: { name: 'Iulius Town', lat: 45.7648, lng: 21.2180 },
    aradului: { name: 'Calea Aradului', lat: 45.7630, lng: 21.2165 },
  };

  const stops: Record<string, any> = {};
  for (const [key, data] of Object.entries(transitStops)) {
    stops[key] = await prisma.transitStop.create({
      data: { name: data.name, latitude: data.lat, longitude: data.lng },
    });
  }

  const lines = [
    { lineNumber: '1', type: 'tram', name: 'Gara de Nord — Stația Meteo', color: '#E30613',
      stops: ['gara', 'iosefin', 'mocioni', 'sfMaria', 'catedrala', 'copii', 'tm700', 'libertatii', 'continental', 'traian', 'turcesc', 'sarmis', 'meteo'] },
    { lineNumber: '4', type: 'tram', name: 'Calea Torontalului — AEM/Piața Domășnean', color: '#F59E0B',
      stops: ['torontal', 'mocioni', 'sfMaria', 'catedrala', 'copii', 'tm700', 'domasnean'] },
    { lineNumber: '8', type: 'tram', name: 'Gara de Nord — AEM/Piața Domășnean', color: '#7C3AED',
      stops: ['gara', 'iosefin', 'mocioni', 'sfMaria', 'catedrala', 'tm700', 'domasnean'] },
    { lineNumber: '9', type: 'tram', name: 'Gara de Nord — AEM/Piața Domășnean', color: '#0EA5E9',
      stops: ['gara', 'iosefin', 'mocioni', 'catedrala', 'tm700', 'domasnean'] },
    { lineNumber: 'M14', type: 'bus', name: 'Giroc — Gara de Nord', color: '#059669',
      stops: ['giroc', 'sagului', 'tm700', 'victoriei', 'gara'] },
    { lineNumber: 'M11', type: 'trolleybus', name: 'Iulius Town — Piața Traian', color: '#DC2626',
      stops: ['iulius', 'aradului', 'victoriei', 'libertatii', 'traian'] },
  ];

  for (const line of lines) {
    const created = await prisma.transitLine.create({
      data: {
        lineNumber: line.lineNumber,
        type: line.type,
        name: line.name,
        color: line.color,
      },
    });
    for (let i = 0; i < line.stops.length; i++) {
      await prisma.transitLineStop.create({
        data: { lineId: created.id, stopId: stops[line.stops[i]].id, stopOrder: i },
      });
    }
  }
  console.log(`Created ${lines.length} transit lines with stops`);

  // --- Restaurants (real places, verified) ---
  const restaurants = [
    {
      name: 'Miorița',
      description: 'One of the most beloved traditional Romanian restaurants. Home-style cooking: ciorbă in pâine, sarmale, mici, and papanași. Cash only.',
      cuisine: ['Romanian', 'Traditional'],
      priceRange: 1,
      latitude: 45.7557,
      longitude: 21.2268,
      address: 'Strada Florimund Mercy 7, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.3,
      features: ['traditional', 'cash only', 'fresh bread'],
    },
    {
      name: 'Garage Café',
      description: 'Top-rated specialty coffee roastery near Piața Unirii. Freshly roasted weekly, homemade pastries, sandwiches, and brunch.',
      cuisine: ['Cafe', 'Brunch'],
      priceRange: 2,
      latitude: 45.7577,
      longitude: 21.2301,
      address: 'Strada Palanca 2, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.6,
      features: ['specialty coffee', 'roastery', 'pastries', 'wifi'],
    },
    {
      name: "REM'S Coffee",
      description: 'Cozy specialty coffee shop on Strada Lucian Blaga. Excellent brunch (until 18:00), sandwiches, salads, and two quiet work rooms.',
      cuisine: ['Cafe', 'Brunch'],
      priceRange: 2,
      latitude: 45.7520,
      longitude: 21.2235,
      address: 'Strada Lucian Blaga 14, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.7,
      features: ['specialty coffee', 'brunch', 'work rooms', 'wifi'],
    },
    {
      name: 'Bruck Café',
      description: 'International cuisine café on Strada Mercy. Coffee, pancakes, and brunch plates. Open daily until midnight.',
      cuisine: ['International', 'Cafe'],
      priceRange: 2,
      latitude: 45.7555,
      longitude: 21.2264,
      address: 'Strada Florimund Mercy 9, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.5,
      features: ['brunch', 'pancakes', 'late night', 'terrace'],
    },
    {
      name: 'Pescada',
      description: 'Seafood and Mediterranean restaurant with beautiful garden seating. One of the highest-rated restaurants in Timișoara.',
      cuisine: ['Seafood', 'Mediterranean'],
      priceRange: 3,
      latitude: 45.7542,
      longitude: 21.2188,
      address: 'Strada Gheorghe Doja 3, Timișoara',
      neighborhood: 'Elisabetin',
      rating: 4.6,
      features: ['seafood', 'garden', 'wine', 'fine dining'],
    },
    {
      name: 'Berăria 700',
      description: 'Large beer hall and restaurant at Piața Timișoara 700. Romanian craft beer, traditional pub food, and live music on weekends.',
      cuisine: ['Pub food', 'Romanian'],
      priceRange: 2,
      latitude: 45.7524,
      longitude: 21.2293,
      address: 'Piața Timișoara 700, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.2,
      features: ['craft beer', 'live music', 'large groups'],
    },
    {
      name: "D'Arc",
      description: 'Elegant brasserie near Piața Unirii serving French-inspired cuisine, artisanal cocktails, and weekend brunch.',
      cuisine: ['French', 'International'],
      priceRange: 3,
      latitude: 45.7570,
      longitude: 21.2285,
      address: 'Strada Eugeniu de Savoya 10, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.5,
      features: ['cocktails', 'brunch', 'fine dining'],
    },
    {
      name: 'Pizzaiolo',
      description: 'Neapolitan-style pizzeria with wood-fired oven, imported Italian ingredients, and a casual lively atmosphere.',
      cuisine: ['Italian', 'Pizza'],
      priceRange: 2,
      latitude: 45.7560,
      longitude: 21.2260,
      address: 'Strada Alba Iulia 1, Timișoara',
      neighborhood: 'Cetate',
      rating: 4.4,
      features: ['pizza', 'wood-fired', 'lunch specials'],
    },
  ];

  for (const restaurant of restaurants) {
    await prisma.restaurant.create({ data: restaurant });
  }
  console.log(`Created ${restaurants.length} restaurants`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
