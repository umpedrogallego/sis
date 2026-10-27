# o1_ORCHESTRA — Dossiê central de orquestração (Builds A + B)

- **Projeto:** VoCover — `C:\Users\Pedro\Herd\sandy-box\vocoolder`
- **Criado em:** 22/10/2026 · **Mantido por:** Sessão A (interface)
- **Escopo:** orquestrar o Build A (remodelagem da janela) e o Build B (modo fala) sem colisão.
- **Hierarquia de autoridade:** este documento manda sobre **o quê, quando e por quem**.
  O **como** técnico está nos anexos: `rodada-2a-definicoes-consolidadas.md` (interface) e
  `rodada-2b-consolidacao-modo-fala.md` (motor).
- **Status agora (atualizado em 27/10):** **Build A aprovado e fechado** (22–23/10) — cosmética fina
  (A6) e clique do `🕫` (A7). Do lado B: **B0, B1, encontro, B2, B3 e B4 concluídos** — B2 fechou o
  aceite de extração (0 de 1076 unidades atravessam pausa > 200 ms) em `rodada-5b-extracao-fala.md`;
  **B3** fechou em `rodada-6b-eixo-articulacao-fala.md` (eixo F1/F2, articulação 0 = render bit a bit
  idêntico à referência); **B4** fechou em `rodada-7b-controles-fala-ui.md` (seletor de unidade +
  articulação ao vivo, sem travar a UI, `--selftest` PASS, os dois caches inalterados).
  **Build do modo fala completo.** `src/gui.py` voltou para a **Sessão A** ao fim do B4.
  **Fila aberta em §0** — primeiro item já decidido: **C1 (gate relativo)**.

> **As três regras de ouro**
> 1. Um arquivo tem **um dono por vez**. `src/gui.py` voltou para a **Sessão A** depois do ponto de
>    encontro; a Sessão B só encosta nele no **B4**, com janela combinada.
> 2. Ninguém aprova checkpoint sem **abrir o app e ouvir/ver**.
> 3. Decisão travada não muda no meio de uma fase — vira uma rodada nova.

---

## 0. Fila aberta — o que falta depois desta rodada

Mapa do que ficou em pé ao fechar o Build A (23/10) e das ideias que apareceram nas conversas e
**ainda não foram desenhadas nem implementadas**. Não é cronograma: é o balde de pendências, com dono
sugerido e custo aproximado, para nada se perder. Nada daqui entra em build sem passar por uma rodada
de decisão — exceto o que já está marcado como decidido na primeira tabela.

### Já decidido, falta executar (ordem sugerida)

| # | Item | Estado | Dono | Custo | Observação |
|:--|:--|:--|:--:|--:|:--|
| 0.1 | Ouvir `renders/fala_v2.wav` e dizer se as sílabas soam como fala contínua | **aberto — só depende de você** | usuário | 5 min | é o que fecha o aceite do B2 |
| 0.4 | Testar na janela o A6 (cosmética) e o A7 (clique no `🕫`) | **aberto** | usuário | 10 min | clique no centro, hover sem retângulo, `⋯`/`■` bloqueando |
| 0.5 | C1 — gate relativo ao vivo | **adiado de propósito — virou primeiro item do pós-build** | A ou B | 2–3 h | **é o próximo item agora** (B3/B4 fechados); hoje o gate é fixo e absoluto |
| 0.6 | Cap de 400 unidades por arquivo no modo fala | **opcional** | B | 30–45 min | só `henriquerang` bate no teto e perde 81 fonemas; todas as sílabas e palavras entram |
| 0.7 | Reativar presets (`PRESETS_ENABLED = True`) | **travado nesta rodada** | A | 1–2 h | código e `.json` intactos; falta decidir onde os controles do fala entram |
| 0.8 | Botão `Render de arquivo` na interface | **fora de escopo** | A + B | 1–2 h | hoje só existe por CLI (`main.py --render`) |
| 0.9 | Rodapé de áudio no lugar do popover | **avaliado e recusado por ora** | A | 1–1,5 h | troca 1 clique por nomes truncados e menos folga vertical em 1100×680 |

### Ideias trazidas nas conversas — não começaram

| # | Ideia | O que já existe | O que falta |
|:--|:--|:--|:--|
| 0.10 | **Associação semântica/sintática no modo fala** (a unidade deixa de ser só acústica e passa a considerar contexto) | nada no código; a ideia é desta rodada | sessão dedicada, começando por um **documento de opções** (custos, riscos, o que entra no cache) — sem escrever código antes de você escolher o caminho |
| 0.11 | **Sibilância / fricativas como critério** (ZCR > 3500 Hz, pico perto de 4 kHz) | as constantes existem em `src/microtonal_tables.py` (zonas de fricativa, formante de cantor a 2.800 Hz), mas **o motor não as consome** | usar as zonas na classificação e no realce; hoje `zcr` entra só como feature normalizada |
| 0.12 | **Vogal explícita na seleção** (manter a vogal da sílaba em vez de só a acústica) | o B2 já grava `f1`, `f2`, `formant_conf` e `vowel_class` em cada unidade | o B3 começa a usar F1/F2; depois dele, `vowel_class` pode virar filtro de seleção |
| 0.13 | **Presets por modo/perfil** (seção fala no `presets.py`) | `presets.py` só tem as seções antigas | desenhar junto com o retorno dos presets (0.7) |
| 0.14 | **Adaptar as páginas HTML ao design system** | `html/DESIGN.md` escrito em 23/10; `index.html` e `vocover_broadcast_switcher_interface.html` continuam dark/neon | adaptar `index.html` primeiro (45–70 min) e o switcher depois; nenhum JS muda |
| 0.15 | **Aproveitar o rodapé vazio dos painéis** (atalhos, versão, estado do corpus) | os painéis têm sobra de altura acima de ~700 px | decidir o que mostrar — só vale se for útil; nada de encher por encher |
| 0.16 | **Tooltip com o nome completo da amostra** | o nome é cortado em 46 caracteres com `…` | um balão no hover (30–45 min); a identidade da amostra é o nome, então vale |
| 0.17 | **Pan dinâmico (deriva/modos de movimento)** — ideia `ideias.md` P3/P8 | pan por-grão estático já existe (`_draw_pans`); leque com `pan_spread` | **standby** (decisão 27/10, mais cosmético que P6/P7); modos e default a definir depois |
| 0.18 | **Player-Dashboard de grãos** — ideia `ideias.md` P3/P9 | metadados completos no cache; `--dump-grains` exporta WAV | **standby** (decisão 27/10); caminho decidido: **metadados + re-corte on-demand**; pré-requisito: indexação modular |
| 0.19 | **Limpeza do mix (mic-only) + investigação de estalos/silêncios** — ideia `ideias.md` P2 (P6/P7) | mix hoje é crossfade sin/cos que **derruba os grãos**; `soft_limit` tanh; ocorrência variável com carga da máquina | **em aprofundamento** (27/10); semântica limpa decidida; limites/condições de uso a definir |

### Como usar esta seção

- Item concluído sai daqui e vira linha em **§6 (Registro de estado)** — esta tabela é só o que falta.
- Os itens 0.10 a 0.16 **não têm dono nem prazo**; existem para não se perderem até a próxima rodada de
  decisão.
- 0.9 fica registrado como recusado **com o motivo**, para não ser reaberto sem dado novo.

---

## 1. CHECKLIST DO USUÁRIO

### 1.1 Antes de largar — ✅ **CONCLUÍDO em 22/10/2026**

| ✔ | Ação | Por quê |
|:--:|:--|:--|
| ✅ | **Fazer backup do projeto** (commit ou `.zip` fora da pasta) | o projeto **não tem histórico de versão**: o repositório acima tem um único commit antigo e a pasta do projeto está não rastreada. Sem isso, não existe "desfazer" |
| ✅ | **Gerar o render de referência** (comando em 1.1.1) | é o som granular de hoje, para comparar com o primeiro som do modo fala |
| ✅ | **Fechar qualquer instância do app** | libera dispositivo de áudio e evita cache velho em memória |
| ✅ | **Ler a seção 5 (decisões travadas)** | é a única fonte de verdade; evita reabrir o que já foi decidido |
| ✅ | **Anotar o tamanho/data de `corpus_cache\corpus_data.pkl`** (≈30 MB) | se esse arquivo mudar de data sem você pedir, houve reindexação — sinal de alerta |

#### 1.1.1 Comando da referência (5 min)

```powershell
python main.py --render voice-test\voice-test-02_a-fala-continua.mp3 -o renders\ref_granular_2026-10-22.wav
```

✅ **Gerado em 22/10/2026, 23:13 — 10,6 MB.** Guarde este arquivo. Ele é o **baseline** do modo
granular: mesmo arquivo de entrada que a Sessão B usará no primeiro teste do modo fala, parâmetros
padrão, código de hoje.

### 1.2 Durante — o que você faz em cada checkpoint

| Quando a sessão avisar | Você faz | Isso libera |
|:--|:--|:--|
| **Checkpoint A** (`rodada-3a-checkpoint-a.md`) | Abre o app e confere 5 coisas: lista com 12 amostras e rolagem, marcar/desmarcar, gate + calibrar, mix no topo da coluna 2, janela em 1100×680 sem corte. Depois diz **"aprovado"** | Sessão B pode abrir `src/gui.py` (ponto de encontro) |
| **B1 / F1** | Ouve o render de fala gerado por linha de comando e compara com a referência. **Não julga timbre** — julga se é material de fala e se o granular continua igual | O ponto de encontro fica pronto (falta o seu "aprovado" do Checkpoint A) |
| **Ponto de encontro** | Abre o app, alterna GRANULAR ↔ FALA, confere que a lista troca, que o seletor trava com o motor rodando e que o pitch está desligado no fala | Sessão B pode começar a extração (B2) |
| **B2 / extração** | Ouve as sílabas e confere no log que nenhuma unidade atravessa pausa longa | Sessão B pode fazer a textura (B3) |
| **B3 / textura** | Compara articulação em zero com a referência: **deve soar igual** | Sessão B pode fazer os controles (B4) |
| **B4 / controles** | Teste final ao vivo: unidade e articulação respondendo sem travar | Fim do build |

### 1.3 Boas práticas e alertas

1. **Você é o único que autoriza passagem de bastão.** Nenhuma sessão começa a próxima fase sem o seu "aprovado".
2. **Teste você mesmo.** Relatório de sessão não substitui abrir o app — e o seu ouvido é o critério final.
3. **Uma fase por vez, uma sessão por arquivo.** Se quiser adiantar algo, pergunte antes a esta sessão.
4. **Anote ideias fora de escopo** (num papel, num md) em vez de pedir no meio da fase. Elas viram a próxima rodada.
5. **Feche o app antes de pedir a fase seguinte.** Ele segura o dispositivo de áudio e o cache em memória.
6. **Se o som vier estranho, comece pelo gate/calibração.** É a causa mais comum, e não significa que a extração falhou.
7. **Grave seus testes de voz.** O app grava; use as gravações como material de comparação ao longo do build.
8. **Ao menos uma vez por checkpoint, veja a janela em 1100×680.** É o tamanho mínimo suportado.
9. **Mantenha a janela de rastreamento curta:** no máximo uma sessão ativa por arquivo, e nenhuma em `gui.py` enquanto a Sessão A estiver nele.
10. **Se algo travar no meio, pare tudo e avise** — não peça "conserta rapidinho" no meio de uma fase em andamento.

### 1.4 O que NUNCA fazer enquanto os builds estiverem em curso

| 🚫 | Nunca | Motivo |
|:--:|:--|:--|
| 🚫 | Deixar duas sessões com `src/gui.py` em edição | conflito silencioso; uma sobrescreve a outra |
| 🚫 | Rodar duas instâncias do app ao mesmo tempo | dispositivo de áudio exclusivo; uma delas falha de forma confusa |
| 🚫 | **Renomear, mover ou apagar** arquivos de `amostras/` | a identidade da amostra é o nome; cache e presets dependem dele |
| 🚫 | Apagar `corpus_cache\corpus_data.pkl` | força reindexação dos 12 arquivos (minutos) e não resolve nada |
| 🚫 | Editar o md da outra sessão | quebra o protocolo de comunicação |
| 🚫 | Aprovar checkpoint sem abrir o app | é o único teste que vale |
| 🚫 | Começar a extração (B2) antes do teste do ponto de encontro | 3–4 h construídas sobre uma fundação não validada |
| 🚫 | Deixar uma sessão "consertar de passagem" fora do escopo | renomear classes, mexer em presets, refatorar o motor: tudo isso é churn |
| 🚫 | Mudar decisão travada no meio de uma fase | gera retrabalho dos dois lados; nova rodada resolve |
| 🚫 | Renomear a pasta do projeto ou o sufixo `_vocoolder.wav` | quebra hábitos, scripts e caminhos |
| 🚫 | Testar mudança de corpus com o motor ligado | o corpus é carregado no início; o teste mente |

---

## 2. Mapa de propriedade dos arquivos

| Arquivo / pasta | Dono **agora** | Quando passa | Observação |
|:--|:--|:--|:--|
| `src/gui.py` | **Sessão A** (B4 fechou em 23/10) | — | único arquivo compartilhado; A fechou o A7, B fechou o B4; contrato do `toggle_btn`/`toggle_glyph` (§9.5 do checkpoint A) permanece |
| `src/ui_theme.py` | Sessão A | nunca | paleta, fontes, widgets |
| `src/engine.py` | **Sessão B** | — | modo, extração, textura |
| `src/profiles.py` *(novo)* | Sessão B | — | perfis de extração |
| `src/extraction.py` *(novo)* | Sessão B | — | segmentação de fala |
| `main.py` | **Sessão B** | — | `--mode`, `--analyze-speech` |
| `src/presets.py` | **ninguém** | — | presets ocultos nesta rodada |
| `src/session.py`, `src/audio_diag.py` | ninguém | — | intocados |
| `amostras/` | **usuário** | — | congelada durante os builds |
| `corpus_cache/` | o app | — | não apagar, não renomear |
| `logs-and-backups/` | cada sessão escreve **só o seu** | — | ver convenção de nomes |

---

## 3. Cronograma: duas trilhas + ponto de encontro

```
TRILHA A (interface, ~2h20)                TRILHA B (modo fala, ~8h–11h)
──────────────────────────────────────     ──────────────────────────────────────
A1 estrutura da tela ......... 30 min      B0 medir a fala .............. 45–60 min
A2 lista inline + botões ..... 45 min      B1 modo no motor + CLI ...... 1h–1h30
A3 terreno para 2 modos ...... 35 min        └─► 1º som (linha de comando) ~2h15
A4 presets ocultos + top bar . 20 min
A5 verificação + CHECKPOINT .. 15 min
      │                                        │
      └────────────────┬───────────────────────┘
                       ▼
        ⚑ PONTO DE ENCONTRO — 25 min (Sessão B, após o Checkpoint A)
           seletor GRANULAR|FALA + troca de lista + pitch padrão
                       ▼
           PRIMEIRO TESTE NA JANELA (~2h45 do início)
                       ▼
        B2 extração (3–4 h) → B3 textura (2–3 h) → B4 controles (45–75 min)
```

**Paralelismo seguro:** a Sessão A só toca `gui.py` e `ui_theme.py`; a Sessão B só toca motor,
extração e comandos. Os testes da B são de linha de comando e **não carregam a interface** — a A pode
estar no meio de uma edição sem quebrar nada.

**Ponto de bloqueio:** a Sessão B **não abre `src/gui.py`** antes de existir
`logs-and-backups/rodada-3a-checkpoint-a.md`.

---

## 4. Checkpoints e critérios de aceite

| Checkpoint | Critério objetivo (o que precisa ser verdade) |
|:--|:--|
| **A5 — Checkpoint A** | o app abre sem erro; 12 amostras listadas; marcar/desmarcar funciona; gate e calibrar funcionam; mix no topo da coluna 2; barra de presets ausente; janela em 1100×680 sem corte; nomes publicados para o encontro (`mode_slot`, `profile_var`, `_pool_files`, `_set_mode`, memória de seleção) |
| **B1 — F1** | `--mode fala --render` gera áudio; `--selftest` passa; o cache granular **não** muda de data (não reindexou) |
| **A7 — clique do `🕫`** | clique no **centro** do botão (sobre o glifo) e na moldura iniciam/param; hover sem retângulo no meio; `⋯` e `■` continuam bloqueando o clique |
| **⚑ Encontro** | alternar o modo troca o material da lista; seletor desabilitado com o motor rodando; pitch desligado no fala; nenhum deslocamento de layout |
| **B2 — extração** | nenhuma unidade atravessa pausa > 200 ms; relatório com números por arquivo |
| **B3 — textura** | articulação em **zero** soa idêntico ao render de referência |
| **B4 — controles** | unidade e articulação alteram a seleção ao vivo, sem travar; presets continuam ocultos |

---

## 5. Decisões travadas (fonte única de verdade)

### 5.1 Estrutura e dados

| ID | Decisão |
|:--:|:--|
| A1 | Amostras granulares ficam **na raiz** de `amostras/`; fala em `amostras/fala/`. **Não existe** `amostras/granular/` |
| A2 | A amostra é identificada pelo **nome do arquivo** (como hoje) |
| A3 | Cada modo tem seu **índice próprio**; o índice granular mantém o arquivo atual (sem reindexar) |
| A4 | Os controles do modo fala serão salvos **dentro da seção "Grãos"** (quando os presets voltarem) |
| A5 | A seleção é lembrada **por modo**, mas mantém o nome atual ("amostras selecionadas") apontando para o modo ativo |
| A6 | "Todas marcadas" = todas as fontes **do modo ativo** |

### 5.2 Interface e escopo

| ID | Decisão |
|:--:|:--|
| B1 | A Sessão A **não cria** o seletor de modo; reserva **150 px** na barra superior |
| B2 | **`Render de arquivo` fora desta rodada** |
| B3 | **Presets ocultos** (trava), código e `.json` preservados |
| B4 | Os **62 px** liberados vão para o rack (lista de amostras ~280 px) |
| C1 | **Gate relativo adiado** (primeiro item pós-build) |
| D1 | **Sem `APLICAR`** — as caixinhas são a fonte da verdade |
| D2 | **Sem contador** de amostras; altura fixa; rolagem sempre visível |
| D3 | Reiniciar o app para ver amostras novas |

### 5.3 Respostas do usuário à rodada 2b (todas "a")

| ID | Decisão final |
|:--:|:--|
| A1 | Teto do índice de fala: **400 por arquivo / 1.800 total** (reavaliar após a extração) |
| A2 | **Descartar** pausas/silêncio do corpus de fala |
| A3 | Seguir com as **4 amostras atuais** (2:12 de áudio) |
| B1 | **Desabilitar** o seletor com o motor rodando |
| B2 | **Padrões por modo** ao alternar (fala com pitch desligado; granular microtonal) |
| B3 | Rótulos **`GRANULAR \| FALA`** |
| C1 | Pitch **visível e desligado por padrão** no fala — **sem nenhum aviso na interface** sobre borrar vogal |
| C2 | Seletor de unidade **exclusivo** (uma unidade por vez) |

### 5.4 Nome e textos

- Interface, logs e documentos: **VoCover** (só V e C maiúsculas).
- **Não mudam:** nomes de classes, threads, módulos, a pasta do projeto e o sufixo `_vocoolder.wav`.

---

## 6. Registro de estado

Atualizar esta tabela a cada checkpoint.

| Etapa | Dono | Status | Data | Observação |
|:--|:--:|:--|:--|:--|
| Backup + referência granular | usuário | ✅ **concluído** | 22/10 | backup feito; `renders\ref_granular_2026-10-22.wav` |
| A1–A4 (interface) | A | ✅ **concluído** | 22/10 | `gui.py` reescrito; engine/presets intocados |
| Ajustes pós-A | A | ✅ **concluído** | 23/10 | rolagem global, boot mix 0/gate 0.0088, glifos, popover enxuto |
| A5 (Checkpoint A) | A | ✅ **aprovado pelo usuário** | 23/10 | `rodada-3a-checkpoint-a.md`; aprovado junto com o teste do ponto de encontro |
| A6 (cosmética fina) | A | ✅ **concluído** | 23/10 | `🕫` em 32 pt sobreposto + popover sem `✕` e fechando ao clicar fora — §9 do checkpoint A |
| B0 (medição) | B | ✅ **concluído** | 23/10 | `rodada-3b-b0-b1.md` |
| B1 (motor + CLI) | B | ✅ **concluído** | 23/10 | `--mode fala`, `--render`, `--selftest`; `renders/fala_v1.wav` aprovado pelo usuário |
| ⚑ Encontro | B | ✅ **concluído e testado** | 23/10 | `rodada-4b-ponto-de-encontro.md`; `GRANULAR \| FALA` no `mode_slot`, 12 ↔ 5 amostras, pitch por modo |
| B2 (extração) | B | ✅ **concluído** | 23/10 | `rodada-5b-extracao-fala.md`: 0 de 1076 unidades com pausa > 200 ms (máx. 0,180 s), auditoria OK, granular idêntico; falta o usuário **ouvir `renders/fala_v2.wav`** |
| A7 (clique do `🕫`) | A | ✅ **concluído** | 23/10 | ponte de `<Enter>/<Leave>/<ButtonRelease-1>` do label para o `CTkButton` + fundo do label sincronizado com o hover (§9.5 do checkpoint A); 10 checagens OK |
| B3 (textura) | B | ✅ **concluído** | 23/10 | `rodada-6b-eixo-articulacao-fala.md`: eixo F1/F2 + `set_unit()` em runtime; articulação 0 = render **bit a bit idêntico** à referência; `corpus_fala.pkl` inalterado; `--selftest` PASS |
| B4 (controles) | B | ✅ **concluído** | 23/10 | `rodada-7b-controles-fala-ui.md`: seletor Fonema\|Sílaba\|Palavra + slider Articulação só no FALA; troca em thread (217–453 ms pior caso, clique ~10 ms); 1100×680 com 38 px de folga; presets ocultos; `--selftest` PASS; **`gui.py` liberado** |

---

## 7. Próximo turno de cada sessão

*(atualizado em 27/10 — pós-B4)*

**Build do modo fala: FECHADO** (B0→B4 + encontro, todos aprovados). `src/gui.py` está **livre** —
voltou para a **Sessão A** ao fim do B4; nenhum build em curso o reivindica.

**Nova rodada de planejamento (27/10) — CHECKLIST FECHADO:** `rodada-7-planejamento.md`
(análise do `ideias.md`: quick wins de escuta, indexação modular, Player-Dashboard). Decisões de
estado desta sessão:

- **P6 (mix → mic-only)** — decidido: **semântica limpa, sem herança** das sessões antigas
  (o que importa das sessões antigas é o áudio). Todos os parâmetros novos/alterados passam por
  definição explícita de semântica e comportamento rastreável antes de código.
- **P7 (estalos/silêncios)** — **em investigação**: ocorrência é variável (só VoCover aberto vs.
  máquina carregada, independente de teto de grãos/amostras/densidade). Limites e condições
  realistas de uso ainda a definir. Aprofundamento P6/P7 em curso nesta sessão.
- **P8 (pan com deriva/modos de movimento)** — **standby** (mais cosmético que P6/P7).
- **P9 (Player-Dashboard)** — **standby**; caminho decidido: **metadados + re-corte on-demand**
  (caminho do arquivo sempre válido).
- **P10 (ordem)** — ordem confirmada: **Quick Wins (escuta) → Indexação → Dashboard**, mas
  **nenhum build começa** sem aprofundamento de P6/P7 e nova autorização.

**Próximo item já decidido do build antigo (qualquer sessão):** **C1 — gate relativo ao vivo** (`§0`, 0.5).

**A fila completa (incluindo o que não começou) está em §0.**

---

## 8. Anexos e convenção

| Documento | Papel |
|:--|:--|
| `rodada-1a-alinhamento-ui-amostras-x-modo-fala.md` | histórico: primeira troca |
| `rodada-1b-resposta-modo-fala-para-ui.md` | histórico: resposta da Sessão B |
| `rodada-2a-definicoes-consolidadas.md` | **anexo técnico da interface** (passos, contrato, custos) |
| `rodada-2b-consolidacao-modo-fala.md` | **anexo técnico do motor** (fases, riscos, respostas) |
| `rodada-3a-checkpoint-a.md` | relatório do Build A + ajustes de 23/10 + cosmética fina (§9) |
| `rodada-3b-b0-b1.md` | relatório do B0/B1 (medições, motor, CLI) |
| `rodada-4b-ponto-de-encontro.md` | relatório do ponto de encontro (seletor de modo, listas, pitch) |
| `rodada-5b-extracao-fala.md` | relatório do B2 (unidades de fala, F1/F2, cache `corpus_fala.pkl`) |
| `rodada-6b-eixo-articulacao-fala.md` | relatório do B3 (eixo F1/F2, `set_unit` em runtime, renders idênticos) |
| `rodada-7b-controles-fala-ui.md` | relatório do B4 (seletor de unidade + articulação na UI) |
| `../html/DESIGN.md` | **design system** do VoCover para as páginas de `html/` (tokens, componentes, checklist) |
| **`glossario-dueto.md`** | **vocabulário comum sessão↔usuário** (termos de áudio/tempo real com exemplo prático) — consultar antes de discutir decisão técnica; doc vivo |
| `v1_rodada-2a-ui-resposta-e-decisoes.md` | **substituído — não usar** |
| **`o1_ORCHESTRA.md`** (este) | mapa de execução: ordem, donos, checkpoints, regras |

**Convenção de nomes:** `rodada-<número><letra>-<assunto>.md` (`a` = interface, `b` = motor).
Resposta mantém o número e troca a letra. Nunca editar o arquivo da outra sessão.

---

*o1_ORCHESTRA — documento vivo. Atualizar a seção 6 a cada checkpoint; não reescrever as seções 2–5
sem uma rodada nova.*
