/* ========================================
AGROTESP PULVERIZAÇÃO - SISTEMA WEB
app.js (corrigido e funcional)
======================================== */

(() => {
  "use strict";

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const nowIso = () => new Date().toISOString();
  const formatDateTimeBR = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("pt-BR");
  };

  const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function safeNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function showToast(message, type = "info") {
    const container = $("#toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${type === "success" ? "✅" : type === "error" ? "❌" : type === "warning" ? "⚠️" : "ℹ️"}</span>
        <span class="toast-text"></span>
      </div>
    `;
    $(".toast-text", toast).textContent = message;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 250);
    }, 2600);
  }

  function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  // ---------- App State ----------
  const STORAGE_KEYS = {
    atendimentos: "agrotesp_atendimentos",
    atendimentoAtivo: "agrotesp_atendimento_ativo",
    config: "agrotesp_config",
    apiKeys: "agrotesp_api_keys",
  };

  const appState = {
    atendimentos: [],
    atendimentoAtivo: null,
    config: {
      emailDestino: "",
      emailjs: { serviceId: "", templateId: "", publicKey: "" },
    },
    apiKeys: { weatherApiKey: "" },
  };

  function loadFromStorage() {
    try {
      const atend = localStorage.getItem(STORAGE_KEYS.atendimentos);
      if (atend) appState.atendimentos = JSON.parse(atend) || [];

      const ativo = localStorage.getItem(STORAGE_KEYS.atendimentoAtivo);
      if (ativo) appState.atendimentoAtivo = JSON.parse(ativo);

      const cfg = localStorage.getItem(STORAGE_KEYS.config);
      if (cfg) appState.config = { ...appState.config, ...(JSON.parse(cfg) || {}) };

      const keys = localStorage.getItem(STORAGE_KEYS.apiKeys);
      if (keys) appState.apiKeys = { ...appState.apiKeys, ...(JSON.parse(keys) || {}) };
    } catch (e) {
      console.error(e);
      showToast("Erro ao carregar dados salvos", "error");
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.atendimentos, JSON.stringify(appState.atendimentos));
      localStorage.setItem(STORAGE_KEYS.atendimentoAtivo, JSON.stringify(appState.atendimentoAtivo));
      localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(appState.config));
      localStorage.setItem(STORAGE_KEYS.apiKeys, JSON.stringify(appState.apiKeys));
    } catch (e) {
      console.error(e);
      showToast("Erro ao salvar dados", "error");
    }
  }

  // ---------- Navigation ----------
  function setActiveNav(page) {
    $$(".nav-item").forEach((a) => a.classList.toggle("active", a.dataset.page === page));
  }

  function showPage(page) {
    $$(".page").forEach((sec) => sec.classList.remove("active"));
    const target = $(`#page-${page}`);
    if (target) target.classList.add("active");
    setActiveNav(page);
  }

  function initNav() {
    $$(".nav-item").forEach((a) => {
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        const page = a.dataset.page;
        if (page) navigateToPage(page);
      });
    });
  }

  // exposed for inline onclick
  function navigateToPage(page) {
    showPage(page);
    // refresh page-specific UI
    if (page === "dashboard") renderDashboard();
    if (page === "execucao") renderExecucao();
    if (page === "produtos") renderProdutos();
    if (page === "calculadora") renderCalculadora();
    if (page === "clima") renderClima();
    if (page === "fila") renderFila();
    if (page === "configuracoes") renderConfig();
  }
  window.navigateToPage = navigateToPage;

  // ---------- Dashboard ----------
  function renderDashboard() {
    const total = appState.atendimentos.length + (appState.atendimentoAtivo ? 1 : 0);
    const emAnd = appState.atendimentoAtivo ? 1 : 0;
    const aguard = appState.atendimentos.filter((a) => a.status === "FINALIZADO").length;
    const enviados = appState.atendimentos.filter((a) => a.status === "ENVIADO").length;

    const setText = (id, val) => {
      const el = $(`#${id}`);
      if (el) el.textContent = String(val);
    };

    setText("totalAtendimentos", total);
    setText("emAndamento", emAnd);
    setText("aguardandoEnvio", aguard);
    setText("enviados", enviados);

    // areaTotal / caldaTotal: somatório de cálculos do histórico + ativo
    const all = [
      ...appState.atendimentos,
      ...(appState.atendimentoAtivo ? [appState.atendimentoAtivo] : []),
    ];
    const areaTotal = all.reduce((acc, a) => acc + safeNumber(a.calculos?.areaTotal), 0);
    const caldaTotal = all.reduce((acc, a) => acc + safeNumber(a.calculos?.caldaTotal), 0);
    setText("areaTotal", areaTotal ? areaTotal.toFixed(2) : "0");
    setText("caldaTotal", caldaTotal ? caldaTotal.toFixed(0) : "0");

    renderAtendimentosLista();
    updateNavExecucaoVisibility();
  }

  function renderAtendimentosLista() {
    const container = $("#atendimentosLista");
    if (!container) return;

    const items = [
      ...(appState.atendimentoAtivo
        ? [{ ...appState.atendimentoAtivo, _isActive: true, status: "EM_EXECUCAO" }]
        : []),
      ...appState.atendimentos.slice().sort((a, b) => (b.fimISO || b.inicioISO || "").localeCompare(a.fimISO || a.inicioISO || "")),
    ];

    if (items.length === 0) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon">📋</span><p>Nenhum atendimento registrado</p></div>`;
      return;
    }

    container.innerHTML = items
      .map((a) => {
        const statusLabel =
          a.status === "ENVIADO" ? "Enviado" : a.status === "FINALIZADO" ? "Aguardando envio" : "Em execução";
        const badge =
          a.status === "ENVIADO"
            ? "badge-success"
            : a.status === "FINALIZADO"
            ? "badge-warning"
            : "badge-info";

        const dt = a._isActive ? a.inicioISO : a.fimISO || a.inicioISO;
        return `
          <div class="card atendimento-card">
            <div class="card-header">
              <div>
                <div class="card-title">${escapeHtml(a.proprietario || "-")}</div>
                <div class="card-subtitle">${escapeHtml(a.fazenda || "-")} • ${formatDateTimeBR(dt)}</div>
              </div>
              <span class="badge ${badge}">${statusLabel}</span>
            </div>
            <div class="card-body">
              <div class="info-row"><span class="label">Operador:</span><span class="value">${escapeHtml(a.operador || "-")}</span></div>
              <div class="info-row"><span class="label">GPS:</span><span class="value">${a.gps?.lat ? `${a.gps.lat.toFixed(6)}, ${a.gps.lng.toFixed(6)}` : "-"}</span></div>
              <div class="info-row"><span class="label">Produtos:</span><span class="value">${(a.produtos || []).length}</span></div>
            </div>
            <div class="card-actions">
              ${
                a._isActive
                  ? `<button class="btn btn-secondary btn-sm" data-action="go-exec">Abrir</button>`
                  : `<button class="btn btn-secondary btn-sm" data-action="export" data-id="${a.id}">Exportar</button>`
              }
            </div>
          </div>
        `;
      })
      .join("");

    $$(".atendimento-card [data-action]", container).forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        if (action === "go-exec") return navigateToPage("execucao");
        if (action === "export") {
          const id = btn.dataset.id;
          const a = appState.atendimentos.find((x) => x.id === id);
          if (!a) return showToast("Atendimento não encontrado", "error");
          downloadJSON(`atendimento-${id}.json`, a);
        }
      });
    });
  }

  function updateNavExecucaoVisibility() {
    const navExec = $("#navExecucao");
    if (!navExec) return;
    navExec.classList.toggle("hidden", !appState.atendimentoAtivo);
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- Novo Atendimento ----------
  async function captureGPS() {
    if (!navigator.geolocation) {
      showToast("Geolocalização não suportada neste dispositivo", "error");
      return;
    }

    const set = (id, v) => {
      const el = $(`#${id}`);
      if (el) el.textContent = v;
    };

    set("gpsStatus", "Capturando...");
    $("#gpsPrecisaoBadge")?.classList.remove("good", "ok", "bad");

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          set("gpsLat", latitude.toFixed(6));
          set("gpsLng", longitude.toFixed(6));
          set("gpsPrecisao", `${Math.round(accuracy)} m`);
          set("gpsStatus", "OK");

          const badge = $("#gpsPrecisaoBadge");
          if (badge) {
            badge.classList.remove("good", "ok", "bad");
            if (accuracy <= 10) badge.classList.add("good");
            else if (accuracy <= 30) badge.classList.add("ok");
            else badge.classList.add("bad");
          }
          resolve({ lat: latitude, lng: longitude, precisao: accuracy });
        },
        (err) => {
          console.error(err);
          set("gpsStatus", "Falha");
          showToast("Não foi possível capturar GPS. Verifique permissões.", "error");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }

  function initNovoAtendimento() {
    $("#btnCapturarGPS")?.addEventListener("click", async () => {
      const gps = await captureGPS();
      if (gps) showToast("GPS capturado", "success");
    });

    $("#formNovoAtendimento")?.addEventListener("submit", (ev) => {
      ev.preventDefault();

      if (appState.atendimentoAtivo) {
        showToast("Já existe um atendimento em execução. Finalize antes de iniciar outro.", "warning");
        navigateToPage("execucao");
        return;
      }

      const proprietario = $("#proprietario")?.value?.trim() || "";
      const fazenda = $("#fazenda")?.value?.trim() || "";
      const operador = $("#operador")?.value?.trim() || "";

      if (!proprietario || !fazenda || !operador) {
        showToast("Preencha Proprietário, Fazenda e Operador.", "error");
        return;
      }

      const lat = parseFloat($("#gpsLat")?.textContent || "");
      const lng = parseFloat($("#gpsLng")?.textContent || "");
      const precisaoTxt = $("#gpsPrecisao")?.textContent || "";
      const precisao = parseFloat(precisaoTxt.replace(/[^\d.]/g, "")) || null;

      const atendimento = {
        id: uid(),
        proprietario,
        fazenda,
        operador,
        observacoes: $("#observacoes")?.value?.trim() || "",
        inicioISO: nowIso(),
        fimISO: null,
        status: "EM_EXECUCAO",
        gps: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng, precisao } : null,
        produtos: [],
        calculos: null,
        climas: [],
      };

      appState.atendimentoAtivo = atendimento;
      saveToStorage();

      // limpar formulário
      ev.target.reset();
      ["gpsLat", "gpsLng", "gpsPrecisao", "gpsStatus", "gpsMunicipio", "gpsEstado"].forEach((id) => {
        const el = $(`#${id}`);
        if (el) el.textContent = "-";
      });

      showToast("Atendimento iniciado", "success");
      renderDashboard();
      renderExecucao();
      navigateToPage("execucao");
    });
  }

  // ---------- Execução ----------
  function renderExecucao() {
    const msg = $("#noExecucaoMsg");
    const content = $("#execucaoContent");
    if (!msg || !content) return;

    if (!appState.atendimentoAtivo) {
      msg.classList.remove("hidden");
      content.classList.add("hidden");
      updateNavExecucaoVisibility();
      return;
    }

    msg.classList.add("hidden");
    content.classList.remove("hidden");

    const a = appState.atendimentoAtivo;
    $("#execProprietario").textContent = a.proprietario || "-";
    $("#execFazenda").textContent = a.fazenda || "-";
    $("#execOperador").textContent = a.operador || "-";
    $("#execLocal").textContent = a.gps?.lat ? `${a.gps.lat.toFixed(6)}, ${a.gps.lng.toFixed(6)}` : "-";
    $("#execInicio").textContent = formatDateTimeBR(a.inicioISO);

    setChecklist("checkGPS", !!a.gps);
    setChecklist("checkProdutos", (a.produtos || []).length > 0);
    setChecklist("checkCalculos", !!a.calculos);
    setChecklist("checkClima", (a.climas || []).length > 0);

    updateNavExecucaoVisibility();
  }

  function setChecklist(id, ok) {
    const item = $(`#${id}`);
    if (!item) return;
    const icon = $(".check-icon", item);
    if (icon) icon.textContent = ok ? "✅" : "⬜";
    item.classList.toggle("done", !!ok);
  }

  window.viewAtendimentoDetalhado = function () {
    if (!appState.atendimentoAtivo) return showToast("Nenhum atendimento ativo", "warning");
    downloadJSON(`atendimento-ativo-${appState.atendimentoAtivo.id}.json`, appState.atendimentoAtivo);
  };

  function finalizarAtendimento() {
    if (!appState.atendimentoAtivo) return;

    const a = { ...appState.atendimentoAtivo };
    a.fimISO = nowIso();
    a.status = "FINALIZADO";

    appState.atendimentos.push(a);
    appState.atendimentoAtivo = null;
    saveToStorage();

    showToast("Atendimento finalizado (entrou na fila de envio)", "success");
    renderDashboard();
    renderExecucao();
    renderProdutos();
    renderCalculadora();
    renderClima();
    renderFila();
    navigateToPage("fila");
  }

  function initExecucao() {
    $("#btnFinalizarAtendimento")?.addEventListener("click", () => {
      if (!appState.atendimentoAtivo) return showToast("Nenhum atendimento ativo", "warning");
      finalizarAtendimento();
    });
  }

  // ---------- Produtos ----------
  let produtoEditIndex = null;

  function initProdutos() {
    $("#btnAdicionarProduto")?.addEventListener("click", () => openModalProduto());

    $("#btnFecharModalProduto")?.addEventListener("click", closeModalProduto);
    $("#btnCancelarProduto")?.addEventListener("click", closeModalProduto);
    $("#modalProduto")?.addEventListener("click", (ev) => {
      if (ev.target && ev.target.id === "modalProduto") closeModalProduto();
    });

    $("#btnSalvarProduto")?.addEventListener("click", () => {
      if (!appState.atendimentoAtivo) return showToast("Nenhum atendimento ativo", "warning");

      const nome = $("#produtoNome")?.value?.trim() || "";
      const dose = safeNumber($("#produtoDose")?.value);
      if (!nome || dose <= 0) {
        showToast("Informe Nome Comercial e Dose (> 0).", "error");
        return;
      }

      const produto = {
        tipo: $("#produtoTipo")?.value || "Outro",
        nome,
        ingrediente: $("#produtoIngrediente")?.value?.trim() || "",
        fabricante: $("#produtoFabricante")?.value?.trim() || "",
        lote: $("#produtoLote")?.value?.trim() || "",
        dose,
        obs: $("#produtoObs")?.value?.trim() || "",
      };

      if (produtoEditIndex === null) appState.atendimentoAtivo.produtos.push(produto);
      else appState.atendimentoAtivo.produtos[produtoEditIndex] = produto;

      produtoEditIndex = null;
      saveToStorage();
      closeModalProduto();
      renderProdutos();
      renderExecucao();
      showToast("Produto salvo", "success");
    });
  }

  function openModalProduto(produto = null, index = null) {
    const modal = $("#modalProduto");
    if (!modal) return;

    produtoEditIndex = index;

    $("#modalProdutoTitle").textContent = produto ? "Editar Produto" : "Adicionar Produto";
    $("#formProduto")?.reset();

    if (produto) {
      $("#produtoTipo").value = produto.tipo || "Outro";
      $("#produtoNome").value = produto.nome || "";
      $("#produtoIngrediente").value = produto.ingrediente || "";
      $("#produtoFabricante").value = produto.fabricante || "";
      $("#produtoLote").value = produto.lote || "";
      $("#produtoDose").value = produto.dose ?? "";
      $("#produtoObs").value = produto.obs || "";
    }

    modal.classList.add("show");
  }

  function closeModalProduto() {
    $("#modalProduto")?.classList.remove("show");
    produtoEditIndex = null;
  }

  function renderProdutos() {
    const noMsg = $("#noProdutosMsg");
    const content = $("#produtosContent");
    if (!noMsg || !content) return;

    if (!appState.atendimentoAtivo) {
      noMsg.classList.remove("hidden");
      content.classList.add("hidden");
      return;
    }

    noMsg.classList.add("hidden");
    content.classList.remove("hidden");

    const list = $("#produtosLista");
    if (!list) return;

    const produtos = appState.atendimentoAtivo.produtos || [];
    if (produtos.length === 0) {
      list.innerHTML = `<div class="empty-state"><span class="empty-icon">🧪</span><p>Nenhum produto adicionado</p></div>`;
    } else {
      list.innerHTML = produtos
        .map((p, idx) => {
          return `
            <div class="card">
              <div class="card-header">
                <div>
                  <div class="card-title">${escapeHtml(p.nome)}</div>
                  <div class="card-subtitle">${escapeHtml(p.tipo)} • Dose: ${Number(p.dose).toFixed(2)} (L/ha ou kg/ha)</div>
                </div>
                <div style="display:flex; gap:8px;">
                  <button class="btn btn-secondary btn-sm" data-action="edit" data-idx="${idx}">Editar</button>
                  <button class="btn btn-danger btn-sm" data-action="del" data-idx="${idx}">Excluir</button>
                </div>
              </div>
              ${p.obs ? `<div class="card-body"><div class="info-row"><span class="label">Obs:</span><span class="value">${escapeHtml(p.obs)}</span></div></div>` : ""}
            </div>
          `;
        })
        .join("");

      $$("[data-action]", list).forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.dataset.idx);
          if (!Number.isInteger(idx)) return;
          if (btn.dataset.action === "edit") openModalProduto(produtos[idx], idx);
          if (btn.dataset.action === "del") {
            produtos.splice(idx, 1);
            saveToStorage();
            renderProdutos();
            renderExecucao();
            showToast("Produto removido", "success");
          }
        });
      });
    }

    renderResumoCalda();
  }

  function renderResumoCalda() {
    const el = $("#resumoCalda");
    if (!el || !appState.atendimentoAtivo) return;

    const a = appState.atendimentoAtivo;
    const area = safeNumber(a.calculos?.areaTotal);
    const taxa = safeNumber(a.calculos?.taxaAplicacao);
    const caldaTotal = safeNumber(a.calculos?.caldaTotal);

    if (!a.calculos) {
      el.innerHTML = `<div class="card"><div class="card-body"><p><strong>Resumo da calda:</strong> faça o cálculo na Calculadora para preencher automaticamente.</p></div></div>`;
      return;
    }

    const produtos = a.produtos || [];
    const linhas = produtos
      .map((p) => {
        const total = area > 0 ? p.dose * area : 0;
        return `<div class="info-row"><span class="label">${escapeHtml(p.nome)}:</span><span class="value">${total.toFixed(2)} (total)</span></div>`;
      })
      .join("");

    el.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">Resumo da Calda</div></div>
        <div class="card-body">
          <div class="info-row"><span class="label">Área (ha):</span><span class="value">${area.toFixed(2)}</span></div>
          <div class="info-row"><span class="label">Taxa (L/ha):</span><span class="value">${taxa.toFixed(1)}</span></div>
          <div class="info-row"><span class="label">Calda total (L):</span><span class="value">${caldaTotal.toFixed(0)}</span></div>
          ${produtos.length ? `<hr style="margin:12px 0; opacity:.2;">${linhas}` : `<p class="subtitle-sm">Adicione produtos para ver o consumo total por produto.</p>`}
        </div>
      </div>
    `;
  }

  // ---------- Calculadora ----------
  function initCalculadora() {
    $("#formCalculadora")?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (!appState.atendimentoAtivo) return showToast("Nenhum atendimento ativo", "warning");

      const areaTotal = safeNumber($("#areaTotal")?.value);
      const taxaAplicacao = safeNumber($("#taxaAplicacao")?.value);
      const capacidadeTanque = safeNumber($("#capacidadeTanque")?.value);
      const produtividade = safeNumber($("#produtividade")?.value); // ha/h
      const margemOperacional = safeNumber($("#margemOperacional")?.value); // %

      if (areaTotal <= 0 || taxaAplicacao <= 0) {
        showToast("Informe Área Total e Taxa de Aplicação (> 0).", "error");
        return;
      }

      const caldaTotal = areaTotal * taxaAplicacao;
      const tanques = capacidadeTanque > 0 ? Math.ceil(caldaTotal / capacidadeTanque) : null;

      const tempoBaseH = produtividade > 0 ? areaTotal / produtividade : null;
      const tempoMargemH =
        tempoBaseH !== null ? tempoBaseH * (1 + Math.max(0, margemOperacional) / 100) : null;

      appState.atendimentoAtivo.calculos = {
        areaTotal,
        taxaAplicacao,
        capacidadeTanque: capacidadeTanque || null,
        produtividade: produtividade || null,
        margemOperacional: margemOperacional || 0,
        caldaTotal,
        tanques,
        tempoBaseH,
        tempoMargemH,
        updatedAt: nowIso(),
      };

      saveToStorage();
      renderCalculadora();
      renderExecucao();
      renderProdutos();

      showToast("Cálculo salvo", "success");
    });

    $("#btnCalcular")?.addEventListener("click", () => {
      $("#formCalculadora")?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });
  }

  function renderCalculadora() {
    const noMsg = $("#noCalcMsg");
    const content = $("#calculadoraContent");
    if (!noMsg || !content) return;

    if (!appState.atendimentoAtivo) {
      noMsg.classList.remove("hidden");
      content.classList.add("hidden");
      return;
    }

    noMsg.classList.add("hidden");
    content.classList.remove("hidden");

    const a = appState.atendimentoAtivo;
    // prefill
    if (a.calculos) {
      $("#areaTotal").value = a.calculos.areaTotal ?? "";
      $("#taxaAplicacao").value = a.calculos.taxaAplicacao ?? "";
      $("#capacidadeTanque").value = a.calculos.capacidadeTanque ?? "";
      $("#produtividade").value = a.calculos.produtividade ?? "";
      $("#margemOperacional").value = a.calculos.margemOperacional ?? "";
    }

    const out = $("#resultadosCalc");
    if (!out) return;

    if (!a.calculos) {
      out.innerHTML = `<div class="empty-state"><span class="empty-icon">🔢</span><p>Faça o cálculo para ver os resultados</p></div>`;
      return;
    }

    const c = a.calculos;
    out.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">Resultado</div></div>
        <div class="card-body">
          <div class="info-row"><span class="label">Calda total (L):</span><span class="value">${c.caldaTotal.toFixed(0)}</span></div>
          <div class="info-row"><span class="label">Tanques:</span><span class="value">${c.tanques ?? "-"}</span></div>
          <div class="info-row"><span class="label">Tempo base (h):</span><span class="value">${c.tempoBaseH !== null ? c.tempoBaseH.toFixed(2) : "-"}</span></div>
          <div class="info-row"><span class="label">Tempo c/ margem (h):</span><span class="value">${c.tempoMargemH !== null ? c.tempoMargemH.toFixed(2) : "-"}</span></div>
          <div class="info-row"><span class="label">Atualizado:</span><span class="value">${formatDateTimeBR(c.updatedAt)}</span></div>
        </div>
      </div>
    `;
  }

  // ---------- Clima ----------
  function initClima() {
    $("#btnFecharModalClima")?.addEventListener("click", closeModalClima);
    $("#modalClimaManual")?.addEventListener("click", (ev) => {
      if (ev.target && ev.target.id === "modalClimaManual") closeModalClima();
    });

    $("#btnRegistrarClimaManual")?.addEventListener("click", () => {
      if (!appState.atendimentoAtivo) return showToast("Nenhum atendimento ativo", "warning");
      openModalClima();
    });

    $("#btnRegistrarClimaAuto")?.addEventListener("click", () => {
      if (!appState.atendimentoAtivo) return showToast("Nenhum atendimento ativo", "warning");
      showToast("Registro automático depende de API (não configurado no MVP). Use o Manual.", "info");
    });


    $("#formClimaManual")?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (!appState.atendimentoAtivo) return;

      const temp = safeNumber($("#climaTemp")?.value);
      const umid = safeNumber($("#climaUmidade")?.value);
      const vento = safeNumber($("#climaVento")?.value);

      if (!Number.isFinite(temp) || !Number.isFinite(umid) || !Number.isFinite(vento)) {
        showToast("Preencha Temperatura, Umidade e Vento.", "error");
        return;
      }

      appState.atendimentoAtivo.climas.push({ temp, umid, vento, ts: nowIso(), origem: "manual" });
      saveToStorage();
      closeModalClima();
      renderClima();
      renderExecucao();
      showToast("Clima registrado", "success");
    });
  }

  function openModalClima() {
    $("#formClimaManual")?.reset();
    $("#modalClimaManual")?.classList.add("show");
  }
  function closeModalClima() {
    $("#modalClimaManual")?.classList.remove("show");
  }

  function renderClima() {
    const noMsg = $("#noClimaMsg");
    const content = $("#climaContent");
    if (!noMsg || !content) return;

    if (!appState.atendimentoAtivo) {
      noMsg.classList.remove("hidden");
      content.classList.add("hidden");
      return;
    }

    noMsg.classList.add("hidden");
    content.classList.remove("hidden");

    const list = $("#climaLista");
    if (!list) return;

    const climas = appState.atendimentoAtivo.climas || [];
    if (climas.length === 0) {
      list.innerHTML = `<div class="empty-state"><span class="empty-icon">🌤️</span><p>Nenhum registro de clima</p></div>`;
      return;
    }

    list.innerHTML = climas
      .slice()
      .reverse()
      .map((c, idxRev) => {
        const idx = climas.length - 1 - idxRev;
        return `
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">${formatDateTimeBR(c.ts)}</div>
                <div class="card-subtitle">Origem: ${escapeHtml(c.origem || "-")}</div>
              </div>
              <button class="btn btn-danger btn-sm" data-action="del" data-idx="${idx}">Excluir</button>
            </div>
            <div class="card-body">
              <div class="info-row"><span class="label">Temp (°C):</span><span class="value">${c.temp.toFixed(1)}</span></div>
              <div class="info-row"><span class="label">Umidade (%):</span><span class="value">${c.umid.toFixed(0)}</span></div>
              <div class="info-row"><span class="label">Vento (m/s):</span><span class="value">${c.vento.toFixed(1)}</span></div>
            </div>
          </div>
        `;
      })
      .join("");

    $$("[data-action='del']", list).forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.idx);
        if (!Number.isInteger(idx)) return;
        climas.splice(idx, 1);
        saveToStorage();
        renderClima();
        renderExecucao();
        showToast("Registro removido", "success");
      });
    });
  }

  // ---------- Fila ----------
  function renderFila() {
    const container = $("#filaLista");
    if (!container) return;

    const fila = appState.atendimentos
      .filter((a) => a.status === "FINALIZADO")
      .slice()
      .sort((a, b) => (b.fimISO || "").localeCompare(a.fimISO || ""));

    if (fila.length === 0) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon">📤</span><p>Nenhum relatório na fila</p></div>`;
      return;
    }

    container.innerHTML = fila
      .map((a) => {
        return `
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">${escapeHtml(a.proprietario)}</div>
                <div class="card-subtitle">${escapeHtml(a.fazenda)} • Finalizado: ${formatDateTimeBR(a.fimISO)}</div>
              </div>
              <span class="badge badge-warning">Aguardando envio</span>
            </div>
            <div class="card-body">
              <div class="info-row"><span class="label">Produtos:</span><span class="value">${(a.produtos || []).length}</span></div>
              <div class="info-row"><span class="label">Clima:</span><span class="value">${(a.climas || []).length}</span></div>
              <div class="info-row"><span class="label">Área (ha):</span><span class="value">${safeNumber(a.calculos?.areaTotal).toFixed(2)}</span></div>
            </div>
            <div class="card-actions" style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" data-action="export" data-id="${a.id}">Exportar</button>
              <button class="btn btn-primary btn-sm" data-action="sent" data-id="${a.id}">Marcar como enviado</button>
            </div>
          </div>
        `;
      })
      .join("");

    $$("[data-action]", container).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const a = appState.atendimentos.find((x) => x.id === id);
        if (!a) return showToast("Atendimento não encontrado", "error");

        if (btn.dataset.action === "export") {
          downloadJSON(`atendimento-${id}.json`, a);
          return;
        }

        if (btn.dataset.action === "sent") {
          a.status = "ENVIADO";
          saveToStorage();
          renderDashboard();
          renderFila();
          showToast("Marcado como enviado", "success");
          return;
        }
      });
    });
  }

  // ---------- Config ----------
  function initConfig() {
    $("#btnSalvarConfig")?.addEventListener("click", () => {
      appState.config.emailDestino = $("#emailDestino")?.value?.trim() || "";
      appState.config.emailjs = {
        serviceId: $("#emailjsServiceId")?.value?.trim() || "",
        templateId: $("#emailjsTemplateId")?.value?.trim() || "",
        publicKey: $("#emailjsPublicKey")?.value?.trim() || "",
      };
      saveToStorage();
      showToast("Configurações salvas", "success");
    });

    $("#btnSalvarApiKeys")?.addEventListener("click", () => {
      appState.apiKeys.weatherApiKey = $("#weatherApiKey")?.value?.trim() || "";
      saveToStorage();
      showToast("API Keys salvas", "success");
    });

    $("#btnExportarDados")?.addEventListener("click", () => {
      const data = {
        exportedAt: nowIso(),
        atendimentos: appState.atendimentos,
        atendimentoAtivo: appState.atendimentoAtivo,
        config: appState.config,
        apiKeys: appState.apiKeys,
      };
      downloadJSON(`agrotesp-backup-${new Date().toISOString().slice(0, 10)}.json`, data);
    });

    $("#btnLimparDados")?.addEventListener("click", () => {
      const ok = confirm("Isso vai apagar TODOS os dados locais deste dispositivo. Continuar?");
      if (!ok) return;

      localStorage.removeItem(STORAGE_KEYS.atendimentos);
      localStorage.removeItem(STORAGE_KEYS.atendimentoAtivo);
      localStorage.removeItem(STORAGE_KEYS.config);
      localStorage.removeItem(STORAGE_KEYS.apiKeys);

      appState.atendimentos = [];
      appState.atendimentoAtivo = null;
      appState.config = { emailDestino: "", emailjs: { serviceId: "", templateId: "", publicKey: "" } };
      appState.apiKeys = { weatherApiKey: "" };

      renderDashboard();
      renderExecucao();
      renderProdutos();
      renderCalculadora();
      renderClima();
      renderFila();
      renderConfig();

      showToast("Dados apagados", "success");
      navigateToPage("dashboard");
    });
  }

  function renderConfig() {
    $("#emailDestino").value = appState.config.emailDestino || "";
    $("#emailjsServiceId").value = appState.config.emailjs?.serviceId || "";
    $("#emailjsTemplateId").value = appState.config.emailjs?.templateId || "";
    $("#emailjsPublicKey").value = appState.config.emailjs?.publicKey || "";
    $("#weatherApiKey").value = appState.apiKeys.weatherApiKey || "";
  }

  // ---------- Init ----------
  function init() {
    loadFromStorage();

    initNav();
    initNovoAtendimento();
    initExecucao();
    initProdutos();
    initCalculadora();
    initClima();
    initConfig();

    // Inicial render
    renderConfig();
    renderDashboard();
    renderExecucao();
    renderProdutos();
    renderCalculadora();
    renderClima();
    renderFila();

    // Hash navigation (opcional)
    const hash = (location.hash || "").replace("#", "");
    if (hash) navigateToPage(hash);

    // PWA service worker (opcional)
    if ("serviceWorker" in navigator) {
      // se existir sw.js no projeto futuro, registre; se não, ignora silenciosamente
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
