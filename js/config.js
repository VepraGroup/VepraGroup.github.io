/* =========================================================
   KONFIGURASI VEPRACUAN
   ---------------------------------------------------------
   Ini SATU-SATUNYA file yang perlu kamu ubah untuk mengganti
   link, nomor WhatsApp, dan harga. Semua halaman membaca
   nilai dari sini secara otomatis.
   Aturan penulisan:
   - Teks/link ditulis di antara tanda kutip "..."
   - Angka (HARGA_KARTU) ditulis TANPA titik & tanpa tanda kutip
   - Setiap baris diakhiri koma, kecuali baris terakhir
   ========================================================= */

window.VEPRA_CONFIG = {
  // Link checkout paket "Akses Supplier" (Rp49.000)
  // GANTI dengan link checkout kamu (mis. Lynk.id, Mayar, Scalev, dll)
  CHECKOUT_SUPPLIER: "https://lynk.id/vepracuan/zoge10l6wp0y/checkout",

  // Link checkout paket "Reseller Pro" (Rp68.000)
  // GANTI dengan link checkout kamu
  CHECKOUT_RESELLER: "https://lynk.id/vepracuan/d3vlz67g7p5e/checkout",

  // Nomor WhatsApp admin: format internasional, TANPA "+", spasi, atau "0" di depan
  // Contoh benar: "6281234567890"
  WA_NUMBER: "6287792004009",

  // URL Web App Google Apps Script (lihat apps-script/Code.gs)
  // Bentuknya: "https://script.google.com/macros/s/XXXXXXXX/exec"
  // Kalau masih kosong, form di gabung.html jalan dalam "mode uji" (data tidak tersimpan)
  FORM_ENDPOINT: "https://script.google.com/macros/s/AKfycbx4VWR4Dz-tvEznxTHHANgajhbEVhOujMucDNQF-wXeBg542stg8u1r6gHEpDmUxK8s/exec",

  // Link checkout KARTU untuk pemilik usaha (Rp50.000) di Lynk.
  // Kalau masih kosong, tombol "Pesan Kartu" otomatis membuka chat WhatsApp admin.
  CHECKOUT_KARTU_USAHA: "",

  // Sistem aktivasi kartu yang sudah kamu punya. Biarkan kalau tidak berubah.
  ACTIVATION_URL: "https://vepracuan.com/kartu/",

  // Harga modal kartu fisik per pcs dari supplier (angka saja, tanpa titik)
  // Nilai ini dipakai di semua teks harga kartu + kalkulator "Hitung Cuan"
  HARGA_KARTU: 15000
};
