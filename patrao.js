// O Patrão do site (21/10/2026): a cabeça segue o mouse (35 renders do Blender, 7 colunas × 5 linhas) e ele
// comenta em balão o que a pessoa faz. Sem biblioteca, sem rastreamento.
// Fluidez: o olhar vai até o alvo com desaceleração (não pula de ponta a ponta). Uma imagem só, trocada apenas
// quando a próxima já está decodificada (21/10: o esmaecimento entre duas camadas deixava o Patrão transparente e
// piscava; o deslize de poucos pixels dava tranco a cada troca; os dois saíram).
(() => {
  const rosto = document.getElementById("rosto"), balao = document.getElementById("balao");
  const caixa = document.getElementById("patrao"), cena = document.getElementById("cena");
  const COLS = 7, LINS = 5, MEIO_C = 3, MEIO_L = 2;

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
    tempoBalao = setTimeout(() => balao.classList.add("some"), 4200);
    reiniciarParado();
  }
  window.patraoFalar = falar;

  // seguir o mouse (e o dedo no celular)
  let px = innerWidth / 2, py = innerHeight / 2, pendente = false;
  addEventListener("pointermove", (e) => {
    px = e.clientX; py = e.clientY;
    if (cena) cena.style.transform = `translate(${(px / innerWidth - .5) * -18}px, ${(py / innerHeight - .5) * -10}px)`;
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
  function reiniciarParado() { clearTimeout(parado); parado = setTimeout(() => falar("parado", true), 14000); }

  // olhadas sozinho de vez em quando (celular e quem não mexe o mouse)
  setInterval(() => {
    if (Date.now() - ultimaFala < 3000) return;
    olharPara(Math.random() * innerWidth, Math.random() * innerHeight);
  }, 4000);

  setTimeout(() => falar("chegou", true), 600);

  // ---------------------------------------------------------------- formulário → planilha do Google
  const PLANILHA = "";   // endereço /exec do Apps Script (preenchido depois de publicar o script)
  const f = document.getElementById("lista"), r = document.getElementById("resposta");
  f.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    if (d.site) return;
    const aceite = document.querySelector('input[name="aceite"]');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || "")) { r.textContent = "Isso não é e-mail. Nem isso tu consegue?"; falar("email", true); return; }
    if (!aceite.checked) { r.textContent = "Marca a caixinha. Regra é regra, até pra mim."; return; }
    if (!PLANILHA) { r.textContent = "(prévia: a planilha ainda não está ligada)"; falar("enviado", true); return; }
    f.querySelector("button").disabled = true;
    r.textContent = "Mandando…";
    try {
      await fetch(PLANILHA, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ email: d.email, aceite: true, origem: location.hostname }) });
      f.reset(); aceite.checked = false;
      r.textContent = "Anotado. Tu vai saber antes dos outros. Infelizmente.";
      falar("enviado", true);
    } catch (e) {
      r.textContent = "Não foi. Deve ser o dono economizando na internet. Tenta de novo.";
    } finally { f.querySelector("button").disabled = false; }
  });
})();
