import 'dotenv/config';
import mongoose from 'mongoose';
import Book from './models/Book.js';

const sampleBooks = [
  {
    title: 'Il Nome della Rosa',
    author: 'Umberto Eco',
    year: 1980,
    genre: 'Romanzo storico',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9788845292613-L.jpg',
    synopsis: "Nell'abbazia benedettina del nord Italia del XIV secolo, il frate francescano Guglielmo da Baskerville e il suo novizio Adso da Melk indagano su una serie di misteriose morti. Al centro del mistero si trova una biblioteca labirintica che custodisce un libro proibito. Un thriller medievale che intreccia filosofia, semiotica e teologia.",
  },
  {
    title: 'Il Signore degli Anelli',
    author: 'J.R.R. Tolkien',
    year: 1954,
    genre: 'Fantasy',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780618640157-L.jpg',
    synopsis: "Lo hobbit Frodo Baggins eredita l'Unico Anello, un artefatto di immenso potere forgiato dal Signore Oscuro Sauron. Accompagnato da una Compagnia di nove, intraprende un viaggio epico attraverso la Terra di Mezzo per distruggere l'Anello nel fuoco del Monte Fato, unico luogo dove può essere annientato.",
  },
  {
    title: "Cent'anni di solitudine",
    author: 'Gabriel García Márquez',
    year: 1967,
    genre: 'Realismo magico',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780060883287-L.jpg',
    synopsis: "La saga della famiglia Buendía attraverso sette generazioni nel villaggio immaginario di Macondo. Capolavoro del realismo magico latinoamericano, il romanzo intreccia storia, mito e fantasia in una narrazione circolare che esplora temi di solitudine, amore e destino.",
  },
  {
    title: 'La Divina Commedia',
    author: 'Dante Alighieri',
    year: 1320,
    genre: 'Poesia epica',
    coverUrl: 'https://covers.openlibrary.org/b/id/8739161-L.jpg',
    synopsis: "Il poeta Dante, guidato prima da Virgilio e poi da Beatrice, compie un viaggio ultraterreno attraverso i tre regni dell'aldilà: Inferno, Purgatorio e Paradiso. Considerato il capolavoro della letteratura italiana e uno dei più grandi poemi della letteratura mondiale.",
  },
  {
    title: '1984',
    author: 'George Orwell',
    year: 1949,
    genre: 'Distopia',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
    synopsis: "In un futuro totalitario, Winston Smith lavora per il Partito riscrivendo la storia. Oppresso dal Grande Fratello che sorveglia ogni pensiero, Winston cerca di ribellarsi al sistema. Un romanzo profetico sull'oppressione politica, la sorveglianza di massa e la manipolazione della verità.",
  },
  {
    title: 'Delitto e Castigo',
    author: 'Fëdor Dostoevskij',
    year: 1866,
    genre: 'Romanzo psicologico',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780140449136-L.jpg',
    synopsis: "Lo studente Raskolnikov, convinto di essere un uomo straordinario al di sopra della morale comune, uccide una vecchia usuraia. Il romanzo segue il suo tormento psicologico, il senso di colpa e il percorso verso la redenzione.",
  },
  {
    title: 'Il Piccolo Principe',
    author: 'Antoine de Saint-Exupéry',
    year: 1943,
    genre: 'Favola',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg',
    synopsis: "Un aviatore precipitato nel deserto del Sahara incontra un misterioso bambino venuto da un piccolo asteroide. Una favola poetica sull'amicizia, l'amore, la perdita e il modo in cui i bambini vedono il mondo con occhi puri.",
  },
  {
    title: 'Don Chisciotte della Mancia',
    author: 'Miguel de Cervantes',
    year: 1605,
    genre: 'Romanzo cavalleresco',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780060934347-L.jpg',
    synopsis: "Alonso Quijano si convince di essere un cavaliere errante e parte per avventure immaginarie accompagnato dallo scudiero Sancho Panza. Considerato il primo romanzo moderno, esplora il confine tra realtà e fantasia.",
  },
];

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/biblioteca';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    await Book.deleteMany({});
    console.log('🗑️  Cleared existing books');

    const inserted = await Book.insertMany(sampleBooks);
    console.log(`📚 Inserted ${inserted.length} books:`);
    inserted.forEach((b) => console.log(`   - ${b.title} (${b.author}, ${b.year})`));

    await mongoose.disconnect();
    console.log('✅ Seed completed successfully');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
