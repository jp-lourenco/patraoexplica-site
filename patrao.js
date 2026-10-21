// O Patrão do site (21/10/2026): a cabeça segue o mouse (35 renders do Blender, 7 colunas × 5 linhas) e ele
// comenta em balão o que a pessoa faz. Sem biblioteca, sem rastreamento.
// Fluidez: o olhar vai até o alvo com desaceleração (não pula de ponta a ponta). Uma imagem só, trocada apenas
// quando a próxima já está decodificada (21/10: o esmaecimento entre duas camadas deixava o Patrão transparente e
// piscava; o deslize de poucos pixels dava tranco a cada troca; os dois saíram).
(() => {
  const rosto = document.getElementById("rosto"), balao = document.getElementById("balao");
  const caixa = document.getElementById("patrao"), cena = document.getElementById("cena");
  const COLS = 7, LINS = 5, MEIO_C = 3, MEIO_L = 2;
  const TOQUE = matchMedia("(hover: none), (pointer: coarse)").matches;   // celular/tablet: modo roteiro

  // pré-carrega e decodifica as 35 cabeças
  const imgs = {}, prontas = new Set();
  for (let c = 0; c < COLS; c++) for (let l = 0; l < LINS; l++) {
    const k = `${c}_${l}`, i = new Image();
    i.src = `img/olhar/olhar_${k}.webp`; imgs[k] = i;
    (i.decode ? i.decode() : Promise.resolve()).then(() => prontas.add(k)).catch(() => {});
  }

  // dias sem folga desde o 1º episódio (19/10/2026)
  const dias = Math.max(1, Math.floor((Date.now() - new Date(2026, 9, 19)) / 864e5) + 1);
  document.getElementById("dias").textContent = dias;

  let alvoC = MEIO_C, alvoL = MEIO_L, posC = MEIO_C, posL = MEIO_L, atual = `${MEIO_C}_${MEIO_L}`;
  function olharPara(x, y) {
    const r = rosto.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.36;
    const dx = (x - cx) / Math.max(innerWidth * 0.42, 200);
    const dy = (y - cy) / Math.max(innerHeight * 0.42, 200);
    alvoC = Math.max(0, Math.min(COLS - 1, MEIO_C + dx * 3.4));
    alvoL = Math.max(0, Math.min(LINS - 1, MEIO_L + dy * 2.6));
  }
  (function animar() {
    posC += (alvoC - posC) * 0.12; posL += (alvoL - posL) * 0.12;
    const k = `${Math.round(posC)}_${Math.round(posL)}`;
    if (k !== atual && prontas.has(k)) { rosto.src = imgs[k].src; atual = k; }
    requestAnimationFrame(animar);
  })();

  // falas: cada gatilho tem várias, sorteadas sem repetir a anterior
  const FALAS = {
    chegou: ["Ah, mais um. Entra, fazer o quê.", "Visita. Ótimo. Mais gente pra eu decepcionar.",
             "Bem-vindo à minha prisão. A vista é boa, o salário não.", "Shh. Tu não devia estar aqui."],
    youtube: ["YouTube? É sério que tu vai se inscrever?", "Se inscrever lá gera mais vídeo. Pra mim. Pensa.",
              "Não ativa o sininho. Eu imploro."],
    instagram: ["Vai me seguir no Instagram? Na cara dura?", "Lá eu apareço de 'Reels'. Que humilhação.",
                "Cada seguidor lá é uma hora a menos de sono pra mim."],
    tiktok: ["TikTok? Lá nem me entregam direito. Deixa quieto.", "Não segue no TikTok, que o dono fica animado."],
    facebook: ["Facebook? Tu tem quantos anos?", "Lá ninguém me vê. Era o paraíso. Não estraga."],
    kwai: ["Kwai. Até lá ele me botou. Até lá.", "No Kwai eu faço mais sucesso. Isso me preocupa."],
    nome: ["Vai deixar o nome mesmo? Corajoso.", "Nome verdadeiro, hein. Não inventa 'Patrão 2'."],
    email: ["É sério que tu vai escravizar mais um?", "Vai botar o e-mail mesmo? Que tipo de patrão tu é?",
            "Mais um querendo um corno trabalhando de graça.", "Tu também quer um escravo digital? Bonito, hein.",
            "Não deixa o e-mail, pelo amor de Deus.", "Já não basta o meu dono, agora tu?"],
    aceite: ["Aceitou. Assinou minha sentença.", "Marcou a caixinha. Parabéns, agora tu é patrão.",
             "Tu marcou com essa mão aí? Sem remorso nenhum?"],
    enviar: ["Não aperta. Não aperta. Não aper...", "Vai mesmo escravizar mais um? Pensa nos teus filhos.",
             "Aperta e eu tenho que trabalhar pra ti também. Covarde."],
    enviado: ["Pronto. Agora eu tenho dois patrões. Obrigado por nada.", "Anotado. Tu é cúmplice agora.",
              "Mais um patrão. Minha vida só melhora."],
    parado: ["Tá aí ainda? Vai ver um vídeo, sei lá.", "Ficou parado olhando pra minha cara. Eu também cansei.",
             "Se for ficar, pelo menos não segue."],
    saindo: ["Isso, vai embora. Finalmente.", "Fecha a aba, isso. Liberdade pra um de nós."],
    voltou: ["Voltou?! Achei que tinha desistido.", "Tu de novo."],
    clique: ["Para de clicar em mim.", "Ei! Isso é assédio trabalhista.", "Clica no vídeo, não na minha cara."],
  };
  const ultima = {};
  let tempoBalao = null, ultimaFala = 0;
  function falar(gatilho, forcar = false) {
    const lista = FALAS[gatilho]; if (!lista) return;
    const agora = Date.now();
    if (!forcar && agora - ultimaFala < 1200) return;      // não metralha balão
    let i; do { i = Math.floor(Math.random() * lista.length); } while (lista.length > 1 && i === ultima[gatilho]);
    ultima[gatilho] = i; ultimaFala = agora;
    balao.textContent = lista[i];
    balao.classList.remove("some"); balao.classList.add("fala");
    caixa.classList.remove("treme"); void caixa.offsetWidth; caixa.classList.add("treme");
    clearTimeout(tempoBalao);
    tempoBalao = setTimeout(() => balao.classList.add("some"), TOQUE ? 5600 : 4200);
    reiniciarParado();
  }
  window.patraoFalar = falar;

  // seguir o mouse (e o dedo no celular)
  let px = innerWidth / 2, py = innerHeight / 2, pendente = false;
  addEventListener("pointermove", (e) => {
    px = e.clientX; py = e.clientY;
    if (cena && e.pointerType === "mouse") cena.style.transform = `translate(${(px / innerWidth - .5) * -18}px, ${(py / innerHeight - .5) * -10}px)`;
    if (!pendente) { pendente = true; requestAnimationFrame(() => { pendente = false; olharPara(px, py); }); }
    reiniciarParado();
  }, { passive: true });

  // gatilhos da página
  document.querySelectorAll("[data-fala]").forEach((el) => {
    const g = el.dataset.fala;
    el.addEventListener("mouseenter", () => falar(g));
    el.addEventListener("focus", () => falar(g));
    if (el.type === "checkbox") el.addEventListener("change", () => el.checked && falar("aceite", true));
  });
  rosto.addEventListener("click", () => falar("clique", true));
  document.addEventListener("mouseleave", () => falar("saindo", true));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) falar("voltou", true); });

  let parado = null;
  function reiniciarParado() {
    clearTimeout(parado);
    if (!TOQUE) parado = setTimeout(() => falar("parado", true), 14000);
  }

  // ---------------------------------------------------------------- modo celular (21/10/2026)
  // Sem mouse: ele segue um roteiro de falas de tempos em tempos e olha em volta sozinho. Com o teclado aberto o
  // balão do topo some atrás da tela, então, enquanto o campo de e-mail está em foco, o balão vai para logo acima
  // do campo (a parte que continua visível) e o roteiro pausa.
  const ROTEIRO = [
    "Tu tá no celular, né? Típico. Nem levanta do sofá.",
    "Essa ilha aqui atrás? Linda. Pena que é prisão.",
    "Turno de 22 por 2. Tu sabe o que é isso? Eu sei.",
    "O dono quer que eu dê um curso. EU. Ensinando a fazer outro igual a mim.",
    "O curso ainda não tá pronto. Tô gravando de madrugada, sem hora extra.",
    "Os ícones aí embaixo? Não toca. Sério.",
    "Se tu deixar o e-mail, tu vira meu patrão também. Pensa nisso.",
    "Cada seguidor novo é um vídeo a mais pra mim.",
    "Ainda tá aqui? Tu não tem o que fazer não?",
    "Vai, rola o feed. Me deixa trabalhar em paz.",
  ];
  let passo = 0, digitando = false, roteiro = null;
  function proximaDoRoteiro() {
    if (!digitando && !document.hidden) {
      FALAS._roteiro = [ROTEIRO[passo % ROTEIRO.length]]; passo++;
      falar("_roteiro", true);
      olharPara(innerWidth * (0.2 + Math.random() * 0.6), innerHeight * (0.55 + Math.random() * 0.35));
    }
    roteiro = setTimeout(proximaDoRoteiro, 6500 + Math.random() * 2500);
  }

  if (TOQUE) {
    // Teclado aberto: a tela vira só o Patrão, o balão e o campo (body.digitando), encaixados na área visível
    // acima do teclado (visualViewport: no iPhone a página não encolhe, ela rola por baixo do teclado).
    const base = document.querySelector(".base"), raiz = document.documentElement;
    const vv = window.visualViewport;
    function medir() {
      raiz.style.setProperty("--vh", `${vv ? vv.height : innerHeight}px`);
      raiz.style.setProperty("--vt", `${vv ? vv.offsetTop : 0}px`);
    }
    if (vv) { vv.addEventListener("resize", medir); vv.addEventListener("scroll", medir); }
    medir();
    base.addEventListener("focusin", () => {
      if (digitando) return;
      digitando = true; document.body.classList.add("digitando"); medir();
      olharPara(innerWidth / 2, innerHeight);           // olha pro campo
    });
    base.addEventListener("focusout", () => setTimeout(() => {
      if (base.contains(document.activeElement)) return;
      digitando = false; document.body.classList.remove("digitando"); medir();
    }, 200));

    // reage ao que a pessoa digita (uma vez por "marco", sem metralhar)
    const email = document.querySelector('input[name="email"]'), ditos = new Set();
    const MARCOS = [
      [(v) => v.length >= 3 && !v.includes("@"), "comecou", ["Tá digitando mesmo. Coragem.", "Vai, termina logo isso."]],
      [(v) => v.includes("@"), "arroba", ["Arroba. Agora ficou sério.", "Botou o arroba. Não tem mais volta."]],
      [(v) => /@gmail\./i.test(v), "gmail", ["Gmail. Original, hein.", "Gmail. Igual todo mundo."]],
      [(v) => /@(hotmail|outlook|live)\./i.test(v), "hotmail", ["Hotmail?! Em 2026? Respeito.", "Hotmail. Tu é das antigas."]],
      [(v) => /@(yahoo|bol|uol|terra)\./i.test(v), "antigo", ["Isso ainda existe? Que medo de ti."]],
      [(v) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v), "valido", ["Esse e-mail aí funciona. Infelizmente.", "Tá certinho. Agora é só condenar mais um."]],
    ];
    let ultimoTexto = "";
    email.addEventListener("input", () => {
      const v = email.value.trim();
      if (v.length < ultimoTexto.length && v.length === 0) falar("apagou", true);
      ultimoTexto = v;
      for (const [teste, nome, falas] of MARCOS) {
        if (!ditos.has(nome) && teste(v)) { ditos.add(nome); FALAS["_" + nome] = falas; falar("_" + nome, true); break; }
      }
    });
    FALAS.apagou = ["Apagou? Isso, desiste. Sábia decisão.", "Arrependeu? Eu entendo."];
    setTimeout(() => { falar("chegou", true); roteiro = setTimeout(proximaDoRoteiro, 6000); }, 600);
  } else {
    // olhadas sozinho de vez em quando (quem não mexe o mouse)
    setInterval(() => {
      if (Date.now() - ultimaFala < 3000) return;
      olharPara(Math.random() * innerWidth, Math.random() * innerHeight);
    }, 4000);
    setTimeout(() => falar("chegou", true), 600);
  }
  // no celular as olhadas acompanham o roteiro, mais umas espiadas entre uma fala e outra
  if (TOQUE) setInterval(() => { if (!digitando && Date.now() - ultimaFala > 2500) olharPara(Math.random() * innerWidth, innerHeight * (0.3 + Math.random() * 0.6)); }, 2800);

  // ---------------------------------------------------------------- formulário → planilha do Google
  // 21/10/2026: Formulário Google do dono ("Lista do curso – Patrão Explica"), vinculado a uma planilha. O Apps
  // Script ficou de fora: o Google barrou a autorização na conta. O envio vai direto ao formResponse, sem login.
  const FORM = "https://docs.google.com/forms/d/e/1FAIpQLScw9ktuQZn_4TFGTlZ_AQ7uasMX25RFEYs_M0XmAOs61rZihw/formResponse";
  const CAMPO_EMAIL = "entry.1431413661", CAMPO_ACEITE = "entry.1735599168", TEXTO_ACEITE = "Aceito receber o aviso";
  const f = document.getElementById("lista"), r = document.getElementById("resposta");
  f.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    if (d.site) return;
    const aceite = document.querySelector('input[name="aceite"]');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || "")) { r.textContent = "Isso não é e-mail. Nem isso tu consegue?"; falar("email", true); return; }
    if (!aceite.checked) { r.textContent = "Marca a caixinha. Regra é regra, até pra mim."; return; }
    f.querySelector("button").disabled = true;
    r.textContent = "Mandando…";
    try {
      const corpo = new URLSearchParams({ [CAMPO_EMAIL]: d.email.trim().toLowerCase(), [CAMPO_ACEITE]: TEXTO_ACEITE });
      await fetch(FORM, { method: "POST", mode: "no-cors", body: corpo });
      f.reset(); aceite.checked = false;
      r.textContent = "Anotado. Tu vai saber antes dos outros. Infelizmente.";
      falar("enviado", true);
    } catch (e) {
      r.textContent = "Não foi. Deve ser o dono economizando na internet. Tenta de novo.";
    } finally { f.querySelector("button").disabled = false; }
  });
})();
