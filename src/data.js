import { uid } from './lib.js';

const part = (name, rows) => ({ id: uid(), name, cards: rows.map(([front, hint, back]) => ({ id: uid(), front, hint, back })) });
export function seedDecks() {
  return [
    { id: uid(), name: 'Mandarin sehari-hari', description: 'Mulai dari nǐ hǎo, satu kata setiap hari.', color: 'pink', createdAt: new Date().toISOString(), parts: [
      part('Salam & perkenalan', [['你好','nǐ hǎo','Halo'],['谢谢','xiè xie','Terima kasih'],['再见','zài jiàn','Sampai jumpa'],['对不起','duì bu qǐ','Maaf'],['没关系','méi guān xi','Tidak apa-apa'],['早上好','zǎo shang hǎo','Selamat pagi'],['你叫什么名字？','nǐ jiào shén me míng zi?','Siapa namamu?'],['很高兴认识你','hěn gāo xìng rèn shi nǐ','Senang berkenalan denganmu']]),
      part('Angka & waktu', [['一','yī','Satu'],['二','èr','Dua'],['三','sān','Tiga'],['十','shí','Sepuluh'],['今天','jīn tiān','Hari ini'],['明天','míng tiān','Besok'],['昨天','zuó tiān','Kemarin'],['现在','xiàn zài','Sekarang']]),
      part('Makan & minum', [['水','shuǐ','Air'],['茶','chá','Teh'],['咖啡','kā fēi','Kopi'],['米饭','mǐ fàn','Nasi'],['面条','miàn tiáo','Mi'],['好吃','hǎo chī','Enak'],['多少钱？','duō shǎo qián?','Berapa harganya?'],['我饿了','wǒ è le','Saya lapar']]),
    ] },
    { id: uid(), name: 'Everyday English', description: 'Small words. A world of possibilities.', color: 'mint', createdAt: new Date().toISOString(), parts: [
      part('Daily expressions', [['How are you?','Sapaan','Apa kabar?'],['Nice to meet you','Perkenalan','Senang berkenalan denganmu'],['You’re welcome','Balasan ucapan terima kasih','Sama-sama'],['See you later','Perpisahan','Sampai nanti'],['Excuse me','Ungkapan sopan','Permisi'],['Take care','Perpisahan','Jaga diri baik-baik']]),
      part('Useful vocabulary', [['Curious','Adjective','Penasaran / ingin tahu'],['Remember','Verb','Mengingat'],['Practice','Verb / noun','Berlatih / latihan'],['Journey','Noun','Perjalanan'],['Improve','Verb','Meningkatkan'],['Confident','Adjective','Percaya diri']]),
    ] },
    { id: uid(), name: 'Web development', description: 'Bangun fondasi, satu konsep setiap kali.', color: 'purple', createdAt: new Date().toISOString(), parts: [
      part('The fundamentals', [['Apa kepanjangan HTML?','Struktur sebuah halaman','HyperText Markup Language'],['Apa fungsi CSS?','Presentasi visual','Mengatur tampilan, tata letak, dan gaya halaman web.'],['Apa itu DOM?','Representasi halaman','Document Object Model: representasi dokumen sebagai pohon objek.'],['Apa itu array?','Struktur data','Kumpulan nilai terurut yang diakses menggunakan indeks.'],['Apa fungsi JSON.parse()?','Konversi data','Mengubah string JSON menjadi nilai JavaScript.'],['Apa itu responsive design?','Berbagai ukuran layar','Desain yang menyesuaikan tata letak dengan ukuran layar perangkat.']]),
    ] },
  ];
}
