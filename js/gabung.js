/* =========================================================
   VEPRACUAN — FORM PENDAFTARAN (gabung.html)
   Alur: validasi -> kirim ke FORM_ENDPOINT (Google Apps Script)
         -> tampilkan pesan sukses + tombol chat WhatsApp
   ========================================================= */
(function () {
  "use strict";

  var CFG = window.VEPRA_CONFIG || {};
  var V = window.Vepra;
  var joinTabs = document.getElementById("join-tabs");

  // Buka tab mitra otomatis kalau URL-nya gabung.html?jalur=mitra
  var params = new URLSearchParams(location.search);
  if (params.get("jalur") === "mitra" && joinTabs.selectTab) joinTabs.selectTab("tab-mitra");
  // Pilih paket otomatis: gabung.html?paket=pro atau ?paket=supplier
  var paketParam = { pro: "Reseller Pro", supplier: "Akses Supplier" }[params.get("paket")];
  if (paketParam) {
    var radio = document.querySelector('#form-reseller input[name="paket"][value="' + paketParam + '"]');
    if (radio) radio.checked = true;
  }

  /* ---------- Nomor WhatsApp Indonesia ----------
     Menerima 0812..., 62812..., +62 812-..., lalu diubah ke 62812... */
  function normalisasiWA(nilai) {
    var angka = String(nilai).replace(/\D/g, "");
    if (angka.indexOf("0") === 0) angka = "62" + angka.slice(1);
    else if (angka.indexOf("8") === 0) angka = "62" + angka;
    return angka;
  }
  function waValid(nilai) {
    // 62 + 8 + 8–11 digit  (total 11–14 digit)
    return /^628\d{8,11}$/.test(normalisasiWA(nilai));
  }

  /* ---------- Validasi satu field ---------- */
  function cekField(el, form) {
    var wadah = el.closest(".field");
    var ok = true;

    if (el.type === "radio") {
      ok = !!form.querySelector('input[name="' + el.name + '"]:checked');
    } else {
      var v = el.value.trim();
      if (el.required && !v) ok = false;
      else if (el.hasAttribute("data-wa-field")) ok = waValid(v);
      else if (el.type === "number" && v) ok = Number(v) >= Number(el.min || 0) && Number(v) > 0;
    }

    if (wadah) wadah.classList.toggle("has-error", !ok);
    el.setAttribute("aria-invalid", String(!ok));
    return ok;
  }

  function validasiForm(form) {
    var semuaOk = true, pertamaSalah = null;
    form.querySelectorAll("[required]").forEach(function (el) {
      var ok = cekField(el, form);
      if (!ok && !pertamaSalah) pertamaSalah = el;
      semuaOk = semuaOk && ok;
    });
    if (pertamaSalah) pertamaSalah.focus();
    return semuaOk;
  }

  /* ---------- Pesan WhatsApp otomatis ---------- */
  function pesanWA(tipe, d) {
    if (tipe === "reseller") {
      return "Halo admin VepraCuan, saya baru saja daftar sebagai reseller.\n\n" +
        "Nama: " + d.nama + "\nKota: " + d.kota + "\nPaket diminati: " + d.paket +
        "\n\nMohon info langkah selanjutnya, terima kasih.";
    }
    return "Halo admin VepraCuan, saya baru saja mengajukan diri sebagai supplier/mitra.\n\n" +
      "Nama usaha: " + d.nama_usaha + "\nPIC: " + d.pic + "\nKota: " + d.kota +
      "\nKapasitas: " + d.kapasitas_per_bulan + " pcs/bulan\nHarga: " + V.rupiah(d.harga_per_pcs) +
      "/pcs\nJenis kartu: " + d.jenis_kartu + "\n\nMohon info langkah selanjutnya, terima kasih.";
  }

  function tampilSukses(tipe, data, modeUji) {
    document.querySelectorAll("#join-tabs .tablist, #join-tabs .tabpanel").forEach(function (el) { el.hidden = true; });
    var box = document.getElementById("success");
    document.getElementById("success-title").textContent =
      tipe === "reseller" ? "Pendaftaran reseller terkirim" : "Pengajuan mitra terkirim";
    document.getElementById("success-wa").href = V.waLink(pesanWA(tipe, data));
    var uji = document.getElementById("success-test");
    if (modeUji) {
      uji.textContent = "Mode uji: FORM_ENDPOINT di js/config.js masih kosong, jadi data belum tersimpan ke Google Sheet.";
      uji.classList.add("is-show");
    }
    box.hidden = false;
    box.focus();
    box.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function alertForm(form, pesan) {
    var a = form.querySelector(".form-alert");
    a.textContent = pesan;
    a.className = "form-alert error is-show";
  }

  /* ---------- Pasang ke kedua form ---------- */
  document.querySelectorAll("form[data-tipe]").forEach(function (form) {
    var tipe = form.getAttribute("data-tipe");
    var tombol = form.querySelector('button[type="submit"]');
    var teksTombol = tombol.innerHTML;

    // Cek ulang saat pengguna mengetik / meninggalkan field
    form.addEventListener("input", function (e) {
      if (e.target.closest(".field.has-error")) cekField(e.target, form);
    });
    form.addEventListener("change", function (e) { if (e.target.required || e.target.type === "radio") cekField(e.target, form); });
    form.addEventListener("focusout", function (e) {
      if (e.target.required && e.target.value && e.target.type !== "radio") cekField(e.target, form);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.querySelector(".form-alert").className = "form-alert";
      if (!validasiForm(form)) {
        alertForm(form, "Masih ada isian yang perlu dibetulkan. Cek bagian yang ditandai merah.");
        return;
      }

      // Ambil semua isian jadi objek {nama: nilai}
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
      if (data.website) return;          // terisi = kemungkinan bot spam
      delete data.website;
      data.whatsapp = normalisasiWA(data.whatsapp);
      data.tipe = tipe;
      data.sumber = location.href;

      // Kalau FORM_ENDPOINT belum diisi -> mode uji
      if (!CFG.FORM_ENDPOINT) {
        tampilSukses(tipe, data, true);
        return;
      }

      tombol.disabled = true;
      tombol.innerHTML = '<span class="spinner" aria-hidden="true"></span> Mengirim…';

      // Content-Type text/plain supaya Apps Script tidak menolak (CORS)
      fetch(CFG.FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      })
        .then(function (res) { return res.json().catch(function () { return { ok: true }; }); })
        .then(function (hasil) {
          if (hasil && hasil.ok === false) throw new Error(hasil.error || "Gagal menyimpan");
          tampilSukses(tipe, data, false);
        })
        .catch(function () {
          alertForm(form, "Maaf, data belum berhasil terkirim. Periksa koneksi internet lalu coba lagi, atau langsung chat admin via WhatsApp.");
          tombol.disabled = false;
          tombol.innerHTML = teksTombol;
        });
    });
  });
})();
