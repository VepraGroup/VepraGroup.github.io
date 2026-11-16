/* =========================================================
   VEPRACUAN — INTERAKSI HALAMAN
   Dipakai di semua halaman. Setiap bagian dicek dulu:
   "kalau elemennya ada, baru dijalankan".
   ========================================================= */
(function () {
  "use strict";

  var CFG = window.VEPRA_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Tandai bahwa JS aktif (dipakai CSS untuk animasi fade-in)
  document.documentElement.classList.add("js");

  /* ---------- Fungsi bantu ---------- */

  // 15000 -> "Rp15.000"
  function rupiah(n) {
    var angka = Math.round(Number(n) || 0);
    var minus = angka < 0 ? "-" : "";
    return minus + "Rp" + Math.abs(angka).toLocaleString("id-ID");
  }

  // Membuat link WhatsApp dengan pesan yang sudah terisi
  function waLink(pesan) {
    var nomor = String(CFG.WA_NUMBER || "").replace(/\D/g, "");
    return "https://wa.me/" + nomor + (pesan ? "?text=" + encodeURIComponent(pesan) : "");
  }

  // Dibagikan ke file JS lain (gabung.js)
  window.Vepra = { rupiah: rupiah, waLink: waLink, config: CFG };

  /* ---------- 1) Isi nilai dari config.js ke halaman ---------- */

  // <a data-config-href="CHECKOUT_SUPPLIER"> -> href diisi dari config
  document.querySelectorAll("[data-config-href]").forEach(function (el) {
    var nilai = CFG[el.getAttribute("data-config-href")];
    if (nilai) el.href = nilai;
  });

  // <span data-harga-kartu> -> teks harga kartu
  document.querySelectorAll("[data-harga-kartu]").forEach(function (el) {
    el.textContent = rupiah(CFG.HARGA_KARTU);
  });

  // <a data-wa="pesan"> -> link WhatsApp
  document.querySelectorAll("[data-wa]").forEach(function (el) {
    el.href = waLink(el.getAttribute("data-wa"));
  });

  /* ---------- 2) Menu HP (hamburger) ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    function setMenu(buka) {
      menu.classList.toggle("is-open", buka);
      toggle.setAttribute("aria-expanded", String(buka));
      toggle.setAttribute("aria-label", buka ? "Tutup menu" : "Buka menu");
    }
    toggle.addEventListener("click", function () {
      setMenu(!menu.classList.contains("is-open"));
    });
    // Tutup menu setelah link diklik atau tombol Esc ditekan
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
    });
  }

  /* ---------- 3) Fade-in saat di-scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObs.unobserve(entry.target); // cukup sekali
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { revealObs.observe(el); });
  }

  /* ---------- 4) Tab (paket & halaman gabung) ----------
     Keyboard: panah kiri/kanan pindah tab, Home/End ke ujung. */
  document.querySelectorAll("[data-tabs]").forEach(function (wrap) {
    var tabs = Array.prototype.slice.call(wrap.querySelectorAll('[role="tab"]'));

    function pilih(tab, fokus) {
      tabs.forEach(function (t) {
        var aktif = t === tab;
        t.setAttribute("aria-selected", String(aktif));
        t.tabIndex = aktif ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !aktif;
      });
      if (fokus) tab.focus();
      wrap.dispatchEvent(new CustomEvent("tabchange", { detail: { id: tab.id } }));
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { pilih(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var tujuan = null;
        if (e.key === "ArrowRight") tujuan = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") tujuan = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") tujuan = tabs[0];
        if (e.key === "End") tujuan = tabs[tabs.length - 1];
        if (tujuan) { e.preventDefault(); pilih(tujuan, true); }
      });
    });

    // Supaya file lain bisa memilih tab lewat kode: wrap.selectTab("tab-id")
    wrap.selectTab = function (id) {
      var t = document.getElementById(id);
      if (t) pilih(t, false);
    };
  });

  /* ---------- 5) Demo cara pakai kartu (3 tahap) ---------- */
  var stage = document.querySelector(".demo-stage");
  if (stage) {
    var stepBtns = document.querySelectorAll("[data-go]");
    var screens = stage.querySelectorAll("[data-screen]");
    var step = 1, timer = null, terlihat = false;

    function tampilkan(n) {
      step = n;
      stage.setAttribute("data-step", n);
      screens.forEach(function (s) { s.classList.toggle("is-active", s.getAttribute("data-screen") === String(n)); });
      stepBtns.forEach(function (b) {
        if (b.getAttribute("data-go") === String(n)) b.setAttribute("aria-current", "step");
        else b.removeAttribute("aria-current");
      });
    }
    function mulai() {
      berhenti();
      if (reduceMotion || !terlihat) return; // tanpa putar otomatis bila "kurangi gerakan"
      timer = setInterval(function () { tampilkan(step % 3 + 1); }, 3200);
    }
    function berhenti() { clearInterval(timer); timer = null; }

    stepBtns.forEach(function (b) {
      b.addEventListener("click", function () { tampilkan(Number(b.getAttribute("data-go"))); mulai(); });
    });

    // Hanya berputar saat demo terlihat di layar (hemat baterai)
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        terlihat = entries[0].isIntersecting;
        terlihat ? mulai() : berhenti();
      }, { threshold: 0.3 }).observe(stage);
    }
    tampilkan(1);
  }

  /* ---------- 6) Kalkulator Hitung Cuan ---------- */
  var qty = document.getElementById("calc-qty");
  if (qty) {
    var qtyRange = document.getElementById("calc-qty-range");
    var price = document.getElementById("calc-price");
    var modalKartu = Number(CFG.HARGA_KARTU) || 0;

    function hitung() {
      var q = Math.max(0, Math.floor(Number(qty.value) || 0));
      var p = Math.max(0, Number(price.value) || 0);
      var margin = p - modalKartu;
      document.getElementById("calc-omzet").textContent = rupiah(q * p);
      document.getElementById("calc-modal").textContent = rupiah(q * modalKartu);
      document.getElementById("calc-margin").textContent = rupiah(margin);
      document.getElementById("calc-profit").textContent = rupiah(q * margin);
      document.getElementById("calc-warn").classList.toggle("is-show", p > 0 && margin <= 0);
    }
    // Angka dan slider saling mengikuti
    qty.addEventListener("input", function () { qtyRange.value = qty.value; hitung(); });
    qtyRange.addEventListener("input", function () { qty.value = qtyRange.value; hitung(); });
    price.addEventListener("input", hitung);
    hitung();
  }

  /* ---------- 7) Slider testimoni ---------- */
  document.querySelectorAll("[data-slider]").forEach(function (slider) {
    var track = slider.querySelector(".slides-track");
    var slides = slider.querySelectorAll(".slide");
    var dotsWrap = slider.querySelector(".dots");
    var idx = 0;

    slides.forEach(function (_, i) {
      var d = document.createElement("button");
      d.type = "button";
      d.className = "dot";
      d.setAttribute("aria-label", "Tampilkan testimoni " + (i + 1));
      d.addEventListener("click", function () { ke(i); });
      dotsWrap.appendChild(d);
    });
    var dots = dotsWrap.querySelectorAll(".dot");

    function ke(i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = "translateX(" + (-idx * 100) + "%)";
      slides.forEach(function (s, j) { s.setAttribute("aria-hidden", String(j !== idx)); });
      dots.forEach(function (d, j) { d.setAttribute("aria-current", String(j === idx)); });
    }
    slider.querySelector("[data-prev]").addEventListener("click", function () { ke(idx - 1); });
    slider.querySelector("[data-next]").addEventListener("click", function () { ke(idx + 1); });
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") ke(idx - 1);
      if (e.key === "ArrowRight") ke(idx + 1);
    });

    // Geser dengan jari di HP
    var startX = null;
    track.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) ke(idx + (dx < 0 ? 1 : -1));
      startX = null;
    });
    ke(0);
  });

  /* ---------- 8) FAQ accordion ----------
     Tombol bisa dibuka dengan Enter/Spasi (bawaan <button>),
     panah atas/bawah pindah pertanyaan, Home/End ke ujung. */
  document.querySelectorAll("[data-accordion]").forEach(function (acc) {
    var btns = Array.prototype.slice.call(acc.querySelectorAll(".faq-btn"));
    btns.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        var buka = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", String(buka));
        document.getElementById(btn.getAttribute("aria-controls")).hidden = !buka;
      });
      btn.addEventListener("keydown", function (e) {
        var t = null;
        if (e.key === "ArrowDown") t = btns[(i + 1) % btns.length];
        if (e.key === "ArrowUp") t = btns[(i - 1 + btns.length) % btns.length];
        if (e.key === "Home") t = btns[0];
        if (e.key === "End") t = btns[btns.length - 1];
        if (t) { e.preventDefault(); t.focus(); }
      });
    });
  });
})();
