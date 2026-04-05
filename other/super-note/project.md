Super Note

- start point index.html di folder ini (/other/super-note)
- ada file css dan js script didalam folder assets
- ui utama pakai tailwind, baru kalau butuh lebih customize pakai css file
- ui minimmalis clean tapi nyaman
- responsive di berbagai perangkat baik mobile sampai desktop

adalah aplikasi web untuk membuan catatan seperti notes, todolist, dll

teknologi

- simpan menggunakan localStorage

fitur

- semacam notes gitu buat menyimpan notes, jadi bisa input judul dan isi prompt, nanti bisa di edit dan dihapus juga
- kategori (tiap kategori beda warna) :

 - note biasa
 - todolist (nanti berarti kayak daftar todolist, ada checklist box)
 - link (langsung diklik mengarah ke tujuan)
 - reminder/jadwal gitu, nanti set catatan dan dikasih waktu dan tanggal, nah nanti muncul countdownnya
 - code snippet (potongan kode gitu, kayak gis mungkin nanti user bisa pilih bahasa apa/struktur apa misal python, kotlin, java, javascriptt, typescript, php, html, css, json, xml dsb selengkap mungkin). nah tampilan juga menyesuaikan style bahasa yg dipilih
 

 tiap notes bisa lebih dari 1, jadi ada kayak variant gitu, contoh bikin note kategori snippet, judulnya Struktur class Person, nah nanti misal mau buat varian dalam versi java, php, kotlin dll bisa





- bisa kasih tags  (opsional)
- ada fitur filter (by category, by tags) search (judul prompt, isi prompt) dan sort  (by date)

- bissa export dan import data format json
 waktu export dan import bisa pilih export atau import sebagian atau dg pilih checkbox atau langsung semua, lalu pas import ada opsi apakah import data dan gabubng dengan data yg sudaha da atau hapus dulu semua data baru import data biar persis hanya yg di json

- bisa delete banyak prompt sekaligus, nanti kayak ada checkbock selected gitu kalau mau bulk delete


untuk referensi UI bisa cek project di ai\prompt-manager\index.html, tapi itu versi prompt manager, 