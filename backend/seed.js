import 'dotenv/config';
import mongoose from 'mongoose';
import Book from './models/Book.js';
import User from './models/User.js';

const PLACEHOLDER_COVER_URL = 'https://via.placeholder.com/300x450?text=No+Cover';
const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVER_BASE_URL = 'https://covers.openlibrary.org/b/id';

// ─────────────────────────────────────────────────────────────────────────────
// Per compilare addedBy: metti lo username dell'utente che ha aggiunto il libro.
// Se l'utente non esiste nel DB o vuoi lasciarlo vuoto, metti null.
// ─────────────────────────────────────────────────────────────────────────────
const sampleBooks = [
  // ── Libri già presenti in archivio ──────────────────────────────────────────
  {
    title: 'A Fine Balance',
    author: 'Rohinton Mistry',
    year: 1995,
    genre: 'Literary Fiction',
    synopsis: "Set in India in the mid-1970s, A Fine Balance follows four unlikely people who come together in a city flat soon after the government declares a State of Internal Emergency. Through days of bleakness and hope, their lives become entwined in circumstances no one could have foreseen.",
    addedBy: 'FineHairstylist2010',
  },
  {
    title: 'A Fine and Private Place',
    author: 'Peter S. Beagle',
    year: 1960,
    genre: 'Ghost Stories',
    synopsis: 'Fine .',
    addedBy: 'FineHairstylist2010',
  },
  {
    title: 'Big in Japan',
    author: 'Dario Moccia',
    year: 2018,
    genre: 'Description and Travel',
    synopsis: "Ohddarione ma hi hettuffai deh!!! Shivalletto!",
    addedBy: 'dariomocciadepefforza',
  },
  {
    title: 'Claudio Frollo; o, Nuestra Señora de Paris',
    author: 'Emilio Boix Serra',
    year: 1913,
    genre: 'LGBTQ+',
    synopsis: 'Mah boh',
    addedBy: 'LosChianchiBus', 
  },
  {
    title: 'Correggio',
    author: 'Lucia Fornari Schianchi',
    year: 1994,
    genre: 'Schilderijen',
    synopsis: 'Scorreggio',
    addedBy: 'LosChianchiBus',
  },
  {
    title: 'Fortnite. Trucchi e segreti. Independent and unofficial guide',
    author: 'CiccioGamer89',
    year: 2018,
    genre: 'Paguronium',
    synopsis: "Paracadute sulle spalle e Let's go! Buono sto cornettozzo deh!",
    addedBy: 'goldo', 
  },
  {
    title: 'High performance habits',
    author: 'Brendon Burchard',
    year: 2017,
    genre: 'Self-actualization (Psychology)',
    synopsis: "After extensive original research and a decade as the world's leading high performance coach, Burchard found that just six deliberate habits give you the edge: seek clarity, generate energy, raise necessity, increase productivity, develop influence, and demonstrate courage.",
    addedBy: 'MarcoMerro1945',
  },
  {
    title: 'La chartreuse de Parme',
    author: 'Stendhal',
    year: 1800,
    genre: 'Young Men',
    synopsis: "Headstrong and naive, the young Italian aristocrat Fabrizio del Dongo is determined to defy his father and fight for Napoleon. He stumbles on the Battle of Waterloo, ill-prepared yet filled with enthusiasm, and becomes embroiled in amorous exploits fuelled by his impetuous nature.",
    addedBy: 'LosChianchiBus',
  },
  {
    title: 'Mefisto',
    author: 'John Banville',
    year: 1986,
    genre: 'Order (Philosophy)',
    synopsis: 'Mefisto Manna in the ogrer ofiur gater major.',
    addedBy: 'LosChianchiBus',
  },
  {
    title: 'Per amore o per forza?',
    author: 'Diego Gambetta',
    year: 1990,
    genre: 'Educazione - Sociologia',
    synopsis: 'Boia! Per forza!',
    addedBy: 'dariomocciadepefforza', 
  },
  {
    title: 'The Fine Print',
    author: 'Lauren Asher',
    year: 2021,
    genre: 'Romance',
    synopsis: "Rowan is in the business of creating fairy tales — theme parks, production companies, five-star hotels. Everything could be his if he renovated Dreamland. His plan to hire Zahra was good in theory, but then he kissed her.",
    addedBy: 'FineHairstylist2010',
  },

  // ── Libri classici originali del seed ───────────────────────────────────────
  {
    title: 'Il Nome della Rosa',
    author: 'Umberto Eco',
    year: 1980,
    genre: 'Romanzo storico',
    synopsis: "Nell'abbazia benedettina del XIV secolo, il frate Guglielmo da Baskerville e il novizio Adso indagano su misteriose morti. Al centro del mistero una biblioteca labirintica che custodisce un libro proibito.",
    addedBy: 'admin',
  },
  {
    title: 'Il Signore degli Anelli',
    author: 'J.R.R. Tolkien',
    year: 1954,
    genre: 'Fantasy',
    synopsis: "Lo hobbit Frodo Baggins eredita l'Unico Anello e intraprende un viaggio epico attraverso la Terra di Mezzo per distruggerlo nel fuoco del Monte Fato.",
    addedBy: 'admin',
  },
  {
    title: "Cent'anni di solitudine",
    author: 'Gabriel García Márquez',
    year: 1967,
    genre: 'Realismo magico',
    synopsis: "La saga della famiglia Buendía attraverso sette generazioni nel villaggio immaginario di Macondo. Capolavoro del realismo magico latinoamericano.",
    addedBy: 'admin',
  },
  {
    title: 'La Divina Commedia',
    author: 'Dante Alighieri',
    year: 1320,
    genre: 'Poesia epica',
    synopsis: "Il poeta Dante, guidato da Virgilio e poi da Beatrice, compie un viaggio attraverso Inferno, Purgatorio e Paradiso.",
    addedBy: 'admin',
  },
  {
    title: '1984',
    author: 'George Orwell',
    year: 1949,
    genre: 'Distopia',
    synopsis: "In un futuro totalitario, Winston Smith lavora per il Partito riscrivendo la storia. Un romanzo profetico sull'oppressione politica e la sorveglianza di massa.",
    addedBy: 'admin',
  },
  {
    title: 'Delitto e Castigo',
    author: 'Fëdor Dostoevskij',
    year: 1866,
    genre: 'Romanzo psicologico',
    synopsis: "Lo studente Raskolnikov uccide una vecchia usuraia convinto di essere al di sopra della morale comune. Il romanzo segue il suo tormento psicologico e il percorso verso la redenzione.",
    addedBy: 'admin',
  },
  {
    title: 'Il Piccolo Principe',
    author: 'Antoine de Saint-Exupéry',
    year: 1943,
    genre: 'Favola',
    synopsis: "Un aviatore nel deserto del Sahara incontra un bambino venuto da un piccolo asteroide. Una favola sull'amicizia, l'amore e il modo in cui i bambini vedono il mondo.",
    addedBy: 'admin',
  },
  {
    title: 'Don Chisciotte della Mancia',
    author: 'Miguel de Cervantes',
    year: 1605,
    genre: 'Romanzo cavalleresco',
    synopsis: "Alonso Quijano si convince di essere un cavaliere errante e parte per avventure immaginarie con lo scudiero Sancho Panza. Considerato il primo romanzo moderno.",
    addedBy: 'admin',
  },
];

const fetchCoverUrl = async (title, author) => {
  try {
    const params = new URLSearchParams({ q: `${title} ${author}` });
    const response = await fetch(`${OPEN_LIBRARY_SEARCH_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Open Library API returned ${response.status}`);
    const data = await response.json();
    const doc = Array.isArray(data.docs) ? data.docs[0] : null;
    if (doc?.cover_i) return `${OPEN_LIBRARY_COVER_BASE_URL}/${doc.cover_i}-L.jpg`;
    console.warn(`No cover found for "${title}" — using placeholder.`);
    return PLACEHOLDER_COVER_URL;
  } catch (error) {
    console.error(`Error fetching cover for "${title}":`, error.message);
    return PLACEHOLDER_COVER_URL;
  }
};

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/biblioteca';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    await Book.deleteMany({});
    console.log('Cleared existing books');

    const booksToInsert = [];
    for (const book of sampleBooks) {
      const coverUrl = await fetchCoverUrl(book.title, book.author);

      // Risolvi addedBy: se è uno username stringa, cerca l'utente nel DB
      let addedById = null;
      if (book.addedBy && typeof book.addedBy === 'string') {
        const user = await User.findOne({ username: book.addedBy });
        if (user) {
          addedById = user._id;
        } else {
          console.warn(`  ⚠ Utente "${book.addedBy}" non trovato — addedBy impostato a null per "${book.title}"`);
        }
      }

      booksToInsert.push({ ...book, coverUrl, addedBy: addedById });
      console.log(`  ✓ "${book.title}" — addedBy: ${addedById ? book.addedBy : 'null'}`);
    }

    const inserted = await Book.insertMany(booksToInsert);
    console.log(`\nInseriti ${inserted.length} libri con successo.`);

    await mongoose.disconnect();
    console.log('Seed completato.');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seed();
